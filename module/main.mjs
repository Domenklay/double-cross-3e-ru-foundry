import { ACTOR_MODELS, ITEM_MODELS } from "./data-models.mjs";
import { DX3Actor, encroachmentDiceBonus, powerLevelBonus } from "./actor.mjs";
import { DX3ActorSheet } from "./sheets/actor-sheet.mjs";
import { DX3ItemSheet } from "./sheets/item-sheet.mjs";
import { POWER_CATALOG, POWER_COUNTS, powerToItemData } from "./content/powers.mjs";
import { ENEMY_CATALOG } from "./content/enemies.mjs";
import { EQUIPMENT_CATALOG, EQUIPMENT_COUNTS } from "./content/equipment.mjs";
import { installBundledContent, rebuildBundledContent } from "./content/install-content.mjs";

const SYS = "double-cross-3e-ru";
const VERSION = "0.5.0";

const JAPANESE_NAME_RE = /[\u3040-\u30ff\u3400-\u9fff]/u;

function isLegacyPowerText(value) {
  const s = String(value ?? "").toLocaleLowerCase("ru");
  return !s || s.includes("см. книгу") || s.includes("смотрите в книге") || s.includes("каталожная запись") || s.includes("печатной книге") || s.includes("сверяйте с вашей книгой") || s.includes("заполнения по вашей книге") || s.includes("универсальная или ситуационная техника") || s.includes("способность направления") || s.includes("не автоматизирован") || s.includes("не автоматизирована") || s.includes("точная механика пока") || s.includes("точные числовые параметры") || s.includes("автоматизация:");
}

function powerRefreshPatch(item, source) {
  const data = powerToItemData(source);
  const patch = { _id: item.id };
  let changed = false;
  if (!item.name || JAPANESE_NAME_RE.test(item.name)) { patch.name = data.name; changed = true; }
  if (source.restrict === "Чистокровный" && item.system?.restrict !== "Чистокровный") { patch["system.restrict"] = "Чистокровный"; changed = true; }
  const scripted = new Set(["core-261","core-265","core-268","core-269","core-279"]);
  if (scripted.has(source.id)) {
    for (const key of ["maxLevel","timing","skill","skillKey","difficulty","target","range","encroach","encroachFormula","restrict","configured","automation","notes","description"]) {
      patch[`system.${key}`] = data.system[key];
      changed = true;
    }
    return patch;
  }
  const fields = ["maxLevel","timing","skill","skillKey","difficulty","target","range","encroach","encroachFormula","restrict","notes","description"];
  for (const key of fields) {
    if (item.system?.[key] === data.system[key]) continue;
    patch[`system.${key}`] = data.system[key];
    changed = true;
  }
  return changed ? patch : null;
}

async function migrateEmbeddedPowerCards(actor) {
  if (!actor) return 0;
  const byId = new Map(POWER_CATALOG.map(p => [p.id, p]));
  const updates = [];
  for (const item of actor.items.filter(i => i.type === "power")) {
    const id = item.getFlag(SYS, "libraryId");
    const source = byId.get(id);
    if (!source) continue;
    const patch = powerRefreshPatch(item, source);
    if (patch) updates.push(patch);
  }
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
  return updates.length;
}

async function migrateWorldPowerCards() {
  const byId = new Map(POWER_CATALOG.map(p => [p.id, p]));
  const updates = [];
  for (const item of game.items.filter(i => i.type === "power")) {
    const id = item.getFlag(SYS, "libraryId");
    const source = byId.get(id);
    if (!source) continue;
    const patch = powerRefreshPatch(item, source);
    if (patch) updates.push(patch);
  }
  if (updates.length) await foundry.documents.Item.updateDocuments(updates);
  return updates.length;
}

const SOCKET_CHANNEL = `system.${SYS}`;
const socketPending = new Map();

function activeGm() {
  return game.users.filter(u=>u.active&&u.isGM).sort((a,b)=>String(a.id).localeCompare(String(b.id)))[0] ?? null;
}

async function handleGmDocumentAction(message) {
  const { action, data={}, userId } = message;
  if(action==="createServantActor") {
    const actorData=foundry.utils.deepClone(data.actorData||{});
    if(!actorData?.flags?.[SYS]?.isServant) throw new Error("Разрешено создание только системного слуги.");
    actorData.ownership=actorData.ownership||{default:0};
    if(userId) actorData.ownership[userId]=3;
    const actor=await foundry.documents.Actor.create(actorData,{renderSheet:false});
    return {actorId:actor.id};
  }
  if(action==="updateServantActor") {
    const actor=game.actors.get(data.actorId);
    if(!actor?.getFlag(SYS,"isServant")) throw new Error("Слуга не найден.");
    await actor.update(data.update||{});
    return {actorId:actor.id};
  }
  if(action==="createServantToken") {
    const scene=game.scenes.get(data.sceneId);
    if(!scene) throw new Error("Сцена не найдена.");
    const tokenData=foundry.utils.deepClone(data.tokenData||{});
    if(!foundry.utils.getProperty(tokenData,`flags.${SYS}.servantMasterUuid`)) throw new Error("Некорректный системный токен слуги.");
    const [token]=await scene.createEmbeddedDocuments("Token",[tokenData]);
    return {tokenId:token?.id};
  }
  throw new Error(`Неизвестное системное действие: ${action}`);
}

function initSystemSocket() {
  if(!game.socket) return;
  game.socket.on(SOCKET_CHANNEL, async message => {
    if(!message||typeof message!=="object") return;
    if(message.kind==="response") {
      if(message.targetUserId!==game.user.id) return;
      const pending=socketPending.get(message.requestId);
      if(!pending) return;
      socketPending.delete(message.requestId);
      clearTimeout(pending.timer);
      if(message.ok) pending.resolve(message.result??null);
      else pending.reject(new Error(message.error||"Действие ГМа не выполнено."));
      return;
    }
    if(message.kind!=="request"||!game.user.isGM||activeGm()?.id!==game.user.id) return;
    try {
      const result=await handleGmDocumentAction(message);
      game.socket.emit(SOCKET_CHANNEL,{kind:"response",requestId:message.requestId,targetUserId:message.userId,ok:true,result});
    } catch(err) {
      console.error("Double Cross | GM socket action failed",err);
      game.socket.emit(SOCKET_CHANNEL,{kind:"response",requestId:message.requestId,targetUserId:message.userId,ok:false,error:err?.message??String(err)});
    }
  });
}

function requestGM(action,data={}) {
  if(game.user?.isGM) return handleGmDocumentAction({action,data,userId:game.user.id});
  const gm=activeGm();
  if(!gm) return Promise.reject(new Error("Нет активного ГМа. Для создания или размещения слуги нужен подключённый ГМ."));
  const requestId=foundry.utils.randomID(16);
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socketPending.delete(requestId);reject(new Error("ГМ не ответил на запрос создания слуги."));},12000);
    socketPending.set(requestId,{resolve,reject,timer});
    game.socket.emit(SOCKET_CHANNEL,{kind:"request",requestId,userId:game.user.id,action,data});
  });
}

Hooks.once("init", () => {
  console.log(`Double Cross 3E RU | Инициализация системы v${VERSION}`);

  CONFIG.Actor.documentClass = DX3Actor;
  Object.assign(CONFIG.Actor.dataModels, ACTOR_MODELS);
  Object.assign(CONFIG.Item.dataModels, ITEM_MODELS);

  game.settings.register(SYS, "autoEncroachment", {
    name: "Автоматически прибавлять стоимость вторжения",
    hint: "При использовании способности или комбо система вычисляет числовую или кубовую формулу стоимости и увеличивает текущее вторжение.",
    scope: "world", config: true, type: Boolean, default: true
  });

  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
  DocumentSheetConfig.registerSheet(foundry.documents.Actor, SYS, DX3ActorSheet, {
    types: ["character", "enemy"], label: "Double Cross RU", makeDefault: true
  });
  DocumentSheetConfig.registerSheet(foundry.documents.Item, SYS, DX3ItemSheet, {
    types: ["power", "weapon", "armor", "misc", "combo"], label: "Double Cross RU", makeDefault: true
  });

  game.doubleCross = {
    version: VERSION,
    encroachmentDiceBonus,
    powerLevelBonus,
    powers: POWER_CATALOG,
    powerCounts: POWER_COUNTS,
    enemies: ENEMY_CATALOG,
    equipment: EQUIPMENT_CATALOG,
    equipmentCounts: EQUIPMENT_COUNTS,
    installContent: () => rebuildBundledContent(),
    requestGM
  };
});

async function ensureBasePowers(actor) {
  if (!actor || actor.type !== "character") return [];
  // По правилам всем Овердам обязательны Воскрешение и Оберег.
  // Концентрация автоматически выдаётся только мастером «Конструкция»;
  // в Full Scratch она не является обязательной.
  const wanted = ["core-181", "core-182"];
  const existingIds = new Set(actor.items.filter(i => i.type === "power").map(i => i.getFlag(SYS, "libraryId")).filter(Boolean));
  const create = [];
  for (const id of wanted) {
    if (existingIds.has(id)) continue;
    const p = POWER_CATALOG.find(x => x.id === id);
    if (!p) continue;
    const data = powerToItemData(p);
    data.system.level = 1;
    create.push(data);
  }
  return create.length ? actor.createEmbeddedDocuments("Item", create) : [];
}

Hooks.once("ready", async () => {
  initSystemSocket();
  if (!game.user?.isGM) return;
  await installBundledContent({ notify: true });
  try { await migrateWorldPowerCards(); } catch (err) { console.warn("Double Cross | world power-card migration failed", err); }
  for (const actor of game.actors) {
    try { await migrateEmbeddedPowerCards(actor); } catch (err) { console.warn("Double Cross | actor power-card migration failed", actor?.name, err); }
    if (actor.type !== "character") continue;
    try { await ensureBasePowers(actor); } catch (err) { console.warn("Double Cross | base powers migration failed", actor?.name, err); }
  }
});

Hooks.on("createActor", async (actor, options, userId) => {
  if (userId !== game.user.id || actor.type !== "character") return;
  await ensureBasePowers(actor);
  await actor.update({
    "system.hp.value": actor.system.hp.max,
    "system.stock.value": actor.system.stock.max,
    "system.encroachment.value": actor.system.encroachment.base
  });
});
