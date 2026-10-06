import { POWER_CATALOG, powerToItemData, POWER_COUNTS } from "./powers.mjs";
import { ENEMY_CATALOG } from "./enemies.mjs";
import { EQUIPMENT_CATALOG, equipmentToItemData, EQUIPMENT_COUNTS } from "./equipment.mjs";
import { rulesJournalData } from "./rules.mjs";

const SYS = "double-cross-3e-ru";

const JAPANESE_NAME_RE = /[\u3040-\u30ff\u3400-\u9fff]/u;

function isLegacyPowerText(value) {
  const s = String(value ?? "").toLocaleLowerCase("ru");
  return !s || s.includes("см. книгу") || s.includes("смотрите в книге") || s.includes("каталожная запись") || s.includes("печатной книге") || s.includes("сверяйте с вашей книгой") || s.includes("заполнения по вашей книге") || s.includes("универсальная или ситуационная техника") || s.includes("способность направления");
}

function powerRefreshPatch(doc, source) {
  const data = powerToItemData(source);
  const patch = { _id: doc.id };
  let changed = false;
  if (!doc.name || JAPANESE_NAME_RE.test(doc.name)) { patch.name = data.name; changed = true; }
  if (source.restrict === "Чистокровный" && doc.system?.restrict !== "Чистокровный") { patch["system.restrict"] = "Чистокровный"; changed = true; }
  const scripted = new Set(["core-261","core-265","core-269","core-279"]);
  if (scripted.has(source.id)) {
    for (const key of ["maxLevel","timing","skill","skillKey","difficulty","target","range","encroach","encroachFormula","restrict","configured","automation","notes","description"]) {
      patch[`system.${key}`] = data.system[key];
      changed = true;
    }
    return patch;
  }
  for (const key of ["maxLevel","timing","skill","skillKey","difficulty","target","range","encroach","encroachFormula","restrict","notes","description"]) {
    if (doc.system?.[key] === data.system[key]) continue;
    patch[`system.${key}`] = data.system[key];
    changed = true;
  }
  return changed ? patch : null;
}

async function synchronizePowerCards(pack) {
  const byId = new Map(POWER_CATALOG.map(p => [p.id, p]));
  let docs = [];
  try { docs = await pack.getDocuments(); }
  catch (err) { console.warn("Double Cross | failed to read power compendium for migration", err); return 0; }
  const updates = [];
  for (const doc of docs) {
    const id = doc.getFlag(SYS, "libraryId");
    const source = byId.get(id);
    if (!source) continue;
    const patch = powerRefreshPatch(doc, source);
    if (patch) updates.push(patch);
  }
  if (!updates.length) return 0;
  try { if (pack.locked) await pack.configure({ locked: false }); } catch (_) {}
  for (let i = 0; i < updates.length; i += 50) {
    await pack.documentClass.updateDocuments(updates.slice(i, i + 50), { pack: pack.collection });
  }
  return updates.length;
}

async function getOrCreatePack(name, label, type) {
  let pack = game.packs.get(`world.${name}`);
  if (pack) return pack;
  const C = foundry.documents.collections.CompendiumCollection;
  pack = await C.createCompendium({ name, label, type, package: "world" });
  try {
    await pack.configure({
      locked: false,
      ownership: { PLAYER: "OBSERVER", TRUSTED: "OBSERVER", ASSISTANT: "OWNER", GAMEMASTER: "OWNER" }
    });
  } catch (_) {}
  return pack;
}

async function createInPack(pack, data, batchSize=50) {
  if (!data.length) return [];
  try { if (pack.locked) await pack.configure({ locked: false }); } catch (_) {}
  const created=[];
  for (let i=0;i<data.length;i+=batchSize) {
    const batch=data.slice(i,i+batchSize);
    try {
      const docs=await pack.documentClass.createDocuments(batch, { pack: pack.collection });
      created.push(...(docs??[]));
    } catch (bulkError) {
      console.warn("Double Cross | bulk compendium create failed, trying safe import fallback", bulkError);
      for (const source of batch) {
        const temp = pack.createDocument(source, { pack: pack.collection });
        const doc = await pack.importDocument(temp, { keepId: false });
        if (doc) created.push(doc);
      }
    }
  }
  return created;
}

async function synchronizeEnemyPowerCards(pack) {
  const byId = new Map(POWER_CATALOG.map(p => [p.id, p]));
  let docs=[];
  try { docs=await pack.getDocuments(); }
  catch (err) { console.warn("Double Cross | failed to read bestiary for power-card migration", err); return 0; }
  try { if (pack.locked) await pack.configure({ locked:false }); } catch (_) {}
  let refreshed=0;
  for (const actor of docs) {
    const updates=[];
    for (const item of actor.items?.filter?.(i=>i.type==="power") ?? []) {
      const id=item.getFlag(SYS,"libraryId");
      const source=byId.get(id);
      if (!source) continue;
      const patch=powerRefreshPatch(item,source);
      if (patch) updates.push(patch);
    }
    if (updates.length) {
      await actor.updateEmbeddedDocuments("Item",updates);
      refreshed+=updates.length;
    }
  }
  return refreshed;
}

async function existingLibraryIds(pack) {
  try {
    const index=await pack.getIndex({ fields: [`flags.${SYS}.libraryId`] });
    const ids=new Set();
    for (const e of index) {
      const id=foundry.utils.getProperty(e, `flags.${SYS}.libraryId`);
      if (id) ids.add(id);
    }
    return ids;
  } catch (err) {
    console.warn("Double Cross | failed to expand compendium index", pack.collection, err);
    return new Set();
  }
}

async function installPowers() {
  const pack=await getOrCreatePack("dx3-powers-ru", "DX3 — Способности (RU)", "Item");
  const existing=await existingLibraryIds(pack);
  const missing=POWER_CATALOG.filter(p=>!existing.has(p.id)).map(powerToItemData);
  await createInPack(pack, missing, 50);
  const refreshed = await synchronizePowerCards(pack);
  return { pack, added: missing.length, refreshed };
}

async function installEquipment() {
  const pack=await getOrCreatePack("dx3-equipment-ru", "DX3 — Снаряжение и вещи (RU)", "Item");
  const existing=await existingLibraryIds(pack);
  const missing=EQUIPMENT_CATALOG.filter(e=>!existing.has(e.id)).map(equipmentToItemData);
  await createInPack(pack, missing, 50);
  return { pack, added: missing.length };
}

async function installEnemies() {
  const pack=await getOrCreatePack("dx3-bestiary-ru", "DX3 — Бестиарий (RU)", "Actor");
  const existing=await existingLibraryIds(pack);
  const missing=ENEMY_CATALOG.filter(e=>!existing.has(e.flags?.[SYS]?.libraryId));
  await createInPack(pack, missing, 25);
  const powersRefreshed=await synchronizeEnemyPowerCards(pack);
  return { pack, added: missing.length, powersRefreshed };
}

async function installRules() {
  const pack=await getOrCreatePack("dx3-rules-ru", "DX3 — Краткие правила (RU)", "JournalEntry");
  const data=rulesJournalData();
  let docs=[];
  try { docs=await pack.getDocuments(); } catch (_) {}
  const old=docs.find(d=>d.getFlag(SYS,"libraryId")==="rules-ru");
  const version=Number(old?.getFlag(SYS,"contentVersion")||0);
  if (old && version < 7) {
    try { if (pack.locked) await pack.configure({ locked:false }); } catch (_) {}
    await pack.documentClass.deleteDocuments([old.id], { pack:pack.collection });
    await createInPack(pack,[data],1);
    return {pack,added:0,updated:1};
  }
  if (!old) { await createInPack(pack,[data],1); return {pack,added:1,updated:0}; }
  return {pack,added:0,updated:0};
}

export async function installBundledContent({ notify=false }={}) {
  if (!game.user?.isGM) return null;
  try {
    const powers=await installPowers();
    const equipment=await installEquipment();
    const enemies=await installEnemies();
    const rules=await installRules();
    const result={powers:powers.added,powersRefreshed:powers.refreshed??0,equipment:equipment.added,enemies:enemies.added,enemyPowersRefreshed:enemies.powersRefreshed??0,rules:rules.added,rulesUpdated:rules.updated??0,counts:POWER_COUNTS,equipmentCounts:EQUIPMENT_COUNTS};
    console.log("Double Cross 3E RU | Content ready", result);
    if (notify && (powers.added+(powers.refreshed??0)+equipment.added+enemies.added+(enemies.powersRefreshed??0)+rules.added+(rules.updated??0))>0) ui.notifications.info(`Double Cross: компендиумы готовы. Способностей: ${POWER_COUNTS.total}, снаряжения: ${EQUIPMENT_COUNTS.total}, противников: ${ENEMY_CATALOG.length}.`);
    return result;
  } catch (err) {
    console.error("Double Cross 3E RU | Compendium installation failed", err);
    ui.notifications.error(`Double Cross: не удалось создать компендиумы — ${err?.message??err}. Встроенные каталоги способностей и снаряжения всё равно работают.`);
    return null;
  }
}

export async function rebuildBundledContent() {
  if (!game.user?.isGM) return null;
  // Refresh missing entries and run system-managed migrations; deliberate non-Japanese user renames are preserved.
  return installBundledContent({notify:true});
}
