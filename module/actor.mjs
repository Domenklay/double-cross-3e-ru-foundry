import { encroachmentDiceBonus, powerLevelBonus, clampCritical, numberValue as n, damageDiceFromAccuracy } from "./roll-engine.mjs";
import { analyzeCombo, comboPowerIdsFromItem } from "./combo-engine.mjs";

function esc(value) { return foundry.utils.escapeHTML(String(value ?? "")); }
function RollClass() { return foundry.dice.Roll; }
function ChatClass() { return foundry.documents.ChatMessage; }
const SYS = "double-cross-3e-ru";

function normalizeFormula(value, fallback = "0") {
  const raw = String(value ?? fallback).trim();
  if (!raw || raw === "-" || /^см\.?\s*книгу$/i.test(raw) || /бросок восстановления/i.test(raw)) return null;
  return raw.replace(/\bLV\b/gi, "@level").replace(/\bУР\.?\b/gi, "@level");
}

function attackFormula(base, perLevel = 0) {
  const baseFormula = normalizeFormula(base, "0") ?? "0";
  const per = n(perLevel);
  return per ? `(${baseFormula})+(${per}*@level)` : baseFormula;
}

async function evaluate(formula, data = {}) {
  const Roll = RollClass();
  return new Roll(formula, data).evaluate({ allowInteractive: false });
}

async function formulaTotal(value, data = {}, fallback = 0) {
  const formula = normalizeFormula(value, String(fallback));
  if (!formula) return { total: n(fallback), formula: null, roll: null, skipped: true };
  const roll = await evaluate(formula, data);
  return { total: n(roll.total), formula, roll, skipped: false };
}

function dieResults(roll) {
  return (roll?.dice ?? []).flatMap(d => d?.results ?? []).filter(r => r?.active !== false).map(r => n(r?.result));
}

export class DX3Actor extends foundry.documents.Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    const s = this.system;
    if (!s?.stats || !s?.skills) return;

    const armorItems = this.items?.filter(i => i.type === "armor" && i.system?.equipped) ?? [];
    const armorTotal = armorItems.reduce((sum, i) => sum + n(i.system.armor), 0);
    const initiativePenalty = armorItems.reduce((sum, i) => sum + n(i.system.initiative), 0);
    const dodgeMod = armorItems.reduce((sum, i) => sum + n(i.system.dodge), 0);

    s.armorTotal = armorTotal;
    s.dodgeItemMod = dodgeMod;
    const body = n(s.stats.body), sense = n(s.stats.sense), mind = n(s.stats.mind), social = n(s.stats.social), procure = n(s.skills.procure);
    const servantProfile = this.getFlag?.(SYS, "servantProfile");
    s.hp.max = servantProfile?.isServant ? Math.max(1, n(servantProfile.hpMax, 1)) : Math.max(0, body * 2 + mind + 20 + n(s.hp.bonus));
    s.stock.max = Math.max(0, social * 2 + procure * 2 + n(s.stock.bonus));
    s.initiative = Math.max(0, sense * 2 + mind + n(s.initiativeBonus) - initiativePenalty);
    s.move = Math.max(0, s.initiative + 5 + n(s.moveBonus));
    s.dash = Math.max(0, s.move * 2);
    s.encroachment.max = 100;
    s.encroachment.diceBonus = encroachmentDiceBonus(s.encroachment.value);
    s.encroachment.powerLevelBonus = powerLevelBonus(s.encroachment.value);
  }

  getSkillInfo(skillKey) {
    const s = this.system;
    if (String(skillKey).startsWith("custom:")) {
      const id = String(skillKey).slice(7);
      const row = s.skills.custom?.[id];
      if (!row) return null;
      const statKey = { ride: "body", art: "sense", knowledge: "mind", info: "social" }[row.category] ?? "body";
      const prefix = { ride: "Вождение", art: "Искусство", knowledge: "Знания", info: "Информация" }[row.category] ?? "Навык";
      return { key: skillKey, statKey, label: row.name || prefix, skill: n(row.value), stat: n(s.stats[statKey]) };
    }

    const map = {
      melee:["body","Ближний бой",n(s.skills.melee)], dodge:["body","Уклонение",n(s.skills.dodge)+n(s.dodgeItemMod)],
      ride1:["body",s.skills.ride1.name||"Вождение",n(s.skills.ride1.value)], ride2:["body",s.skills.ride2.name||"Вождение",n(s.skills.ride2.value)],
      ranged:["sense","Дальний бой",n(s.skills.ranged)], perception:["sense","Восприятие",n(s.skills.perception)],
      art1:["sense",s.skills.art1.name||"Искусство",n(s.skills.art1.value)], art2:["sense",s.skills.art2.name||"Искусство",n(s.skills.art2.value)],
      rc:["mind","РК",n(s.skills.rc)], will:["mind","Воля",n(s.skills.will)],
      knowledge1:["mind",s.skills.knowledge1.name||"Знания",n(s.skills.knowledge1.value)], knowledge2:["mind",s.skills.knowledge2.name||"Знания",n(s.skills.knowledge2.value)],
      negotiation:["social","Переговоры",n(s.skills.negotiation)], procure:["social","Снабжение",n(s.skills.procure)],
      info1:["social",s.skills.info1.name||"Информация",n(s.skills.info1.value)], info2:["social",s.skills.info2.name||"Информация",n(s.skills.info2.value)]
    };
    const row = map[skillKey];
    return row ? {key:skillKey,statKey:row[0],label:row[1],skill:row[2],stat:n(s.stats[row[0]])} : null;
  }

  _powerByLibraryId(id) {
    return this.items?.find(i => i.type === "power" && i.getFlag(SYS, "libraryId") === id) ?? null;
  }

  _powerLevelByLibraryId(id) {
    return Math.max(0, n(this._powerByLibraryId(id)?.system?.level));
  }

  _activeServantTokens() {
    if (!globalThis.canvas?.scene) return [];
    return [...canvas.scene.tokens].filter(t => t.getFlag?.(SYS, "servantMasterUuid") === this.uuid);
  }

  _hasActiveServant() {
    if (this.getFlag?.(SYS, "isServant")) return false;
    return this._activeServantTokens().length > 0;
  }

  _servantProfile(redServantLevel) {
    const redRiver = this._powerLevelByLibraryId("core-269");
    const lifeBlood = this._powerLevelByLibraryId("core-279");
    const silentServants = this._powerLevelByLibraryId("core-265");
    const stat = 3 + redRiver;
    const hpMax = Math.max(1, Math.trunc(n(redServantLevel, 1) * 5 + 10 + lifeBlood * 5));
    return { stat, hpMax, maxActive: 1 + silentServants, redRiver, lifeBlood, silentServants };
  }

  _savedServants() {
    return game.actors.filter(a => a.getFlag?.(SYS, "isServant") && a.getFlag?.(SYS, "servantMasterUuid") === this.uuid)
      .sort((a,b)=>a.name.localeCompare(b.name,"ru"));
  }

  _masterToken() {
    if (!globalThis.canvas?.scene) return null;
    return canvas.tokens?.controlled?.find(t => t.actor?.id === this.id)
      ?? canvas.tokens?.placeables?.find(t => t.actor?.id === this.id)
      ?? null;
  }

  _servantSpawnPoint(masterToken) {
    const doc=masterToken?.document;
    if(!doc) return null;
    const size=n(canvas.grid?.size ?? canvas.scene?.grid?.size,100) || 100;
    const occupied=new Set([...canvas.scene.tokens].map(t=>`${Math.round(n(t.x))}:${Math.round(n(t.y))}`));
    const offsets=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[0,2]];
    for(const [dx,dy] of offsets){
      const x=n(doc.x)+dx*size, y=n(doc.y)+dy*size;
      if(!occupied.has(`${Math.round(x)}:${Math.round(y)}`)) return {x,y};
    }
    return {x:n(doc.x)+size,y:n(doc.y)};
  }

  async _gmDocumentAction(action,data) {
    if (game.user?.isGM) return null;
    const fn=game.doubleCross?.requestGM;
    if(typeof fn!=="function") throw new Error("Нет активного канала к ГМу для создания слуги.");
    return fn(action,data);
  }

  async _createServantTemplate(name, redServantLevel) {
    const profile=this._servantProfile(redServantLevel);
    const img="icons/svg/blood.svg";
    const ownership=foundry.utils.deepClone(this.ownership ?? {default:0});
    ownership[game.user.id]=3;
    const actorData={
      name:String(name||`Слуга ${this.name}`).trim()||`Слуга ${this.name}`,
      type:"enemy",
      img,
      ownership,
      prototypeToken:{actorLink:false,disposition:1,texture:{src:img}},
      flags:{[SYS]:{isServant:true,servantMasterUuid:this.uuid,servantProfile:{isServant:true,...profile}}},
      system:{
        details:{breed:"Слуга",syndromes:"Брэм Стокер — слуга",cover:`Слуга ${this.name}`,notes:`<p>Кровавый слуга, созданный персонажем <strong>${esc(this.name)}</strong>. Повторно призывается способностью «Алый слуга».</p>`},
        stats:{body:profile.stat,sense:profile.stat,mind:profile.stat,social:profile.stat},
        hp:{value:profile.hpMax,max:profile.hpMax,bonus:0},
        encroachment:{base:0,value:0,max:100,diceBonus:0,powerLevelBonus:0}
      }
    };
    try {
      const created=await foundry.documents.Actor.create(actorData,{renderSheet:false});
      return created;
    } catch(err) {
      if(game.user?.isGM) throw err;
      const result=await this._gmDocumentAction("createServantActor",{actorData});
      let actor=game.actors.get(result?.actorId);
      for(let i=0;!actor&&i<20;i++){await new Promise(r=>setTimeout(r,100));actor=game.actors.get(result?.actorId);}
      if(!actor) throw new Error("ГМ создал слугу, но актёр не успел синхронизироваться с клиентом.");
      return actor;
    }
  }

  async _syncServantTemplate(servant, redServantLevel) {
    const profile=this._servantProfile(redServantLevel);
    const update={
      "system.stats.body":profile.stat,"system.stats.sense":profile.stat,"system.stats.mind":profile.stat,"system.stats.social":profile.stat,
      "system.hp.value":profile.hpMax,
      [`flags.${SYS}.isServant`]:true,
      [`flags.${SYS}.servantMasterUuid`]:this.uuid,
      [`flags.${SYS}.servantProfile`]:{isServant:true,...profile}
    };
    try { await servant.update(update); }
    catch(err) {
      if(game.user?.isGM) throw err;
      await this._gmDocumentAction("updateServantActor",{actorId:servant.id,update});
    }
    return profile;
  }

  async _summonServantToken(servant, redServantLevel) {
    if(!globalThis.canvas?.scene) throw new Error("Откройте сцену, на которую нужно призвать слугу.");
    const masterToken=this._masterToken();
    if(!masterToken) throw new Error("На текущей сцене нет токена хозяина. Сначала поместите или выберите его токен.");
    const profile=await this._syncServantTemplate(servant,redServantLevel);
    const spawn=this._servantSpawnPoint(masterToken);
    let tokenData;
    if(typeof servant.getTokenDocument==="function") {
      const tokenDoc=await servant.getTokenDocument(spawn||{});
      tokenData=tokenDoc.toObject();
    } else tokenData=servant.prototypeToken?.toObject?.() ?? {name:servant.name,texture:{src:servant.img}};
    delete tokenData._id;
    tokenData.actorId=servant.id;
    tokenData.actorLink=false;
    tokenData.disposition=1;
    tokenData.x=spawn.x; tokenData.y=spawn.y;
    tokenData.name=servant.name;
    foundry.utils.setProperty(tokenData,`flags.${SYS}.servantMasterUuid`,this.uuid);
    foundry.utils.setProperty(tokenData,`flags.${SYS}.servantTemplateId`,servant.id);
    foundry.utils.setProperty(tokenData,`flags.${SYS}.summonedByPower`,`core-261`);
    foundry.utils.setProperty(tokenData,`flags.${SYS}.servantActed`,true);
    let created;
    try { [created]=await canvas.scene.createEmbeddedDocuments("Token",[tokenData]); }
    catch(err) {
      if(game.user?.isGM) throw err;
      const result=await this._gmDocumentAction("createServantToken",{sceneId:canvas.scene.id,tokenData});
      created=canvas.scene.tokens.get(result?.tokenId) ?? null;
    }
    await this._postChat(`<div class="dx3-chat-card"><h3>${esc(servant.name)} призван</h3><p>Характеристики: <strong>${profile.stat}</strong> / ${profile.stat} / ${profile.stat} / ${profile.stat} · ОЗ: <strong>${profile.hpMax}</strong>.</p><p>Слуга появляется уже действовавшим. Пока хотя бы один ваш слуга находится на сцене, ваши проверки получают <strong>-3 куба</strong>.</p></div>`);
    return {servant,token:created,profile};
  }

  async _useRedServant(item,effectiveLevel) {
    if(!globalThis.canvas?.scene) { ui.notifications.warn("Откройте сцену, на которую нужно призвать слугу."); return null; }
    if(!this._masterToken()) { ui.notifications.warn("Поместите токен хозяина на текущую сцену перед призывом слуги."); return null; }
    const profile=this._servantProfile(effectiveLevel);
    const active=this._activeServantTokens();
    if(active.length>=profile.maxActive) { ui.notifications.warn(`Лимит слуг на сцене: ${profile.maxActive}. Сейчас призвано ${active.length}.`); return null; }
    const saved=this._savedServants();
    const savedRows=saved.length?saved.map(a=>{const hp=n(a.getFlag(SYS,"servantProfile")?.hpMax,a.system.hp?.max);return `<label class="dx3-servant-choice"><input type="radio" name="servantChoice" value="${esc(a.id)}"><img src="${esc(a.img)}"><span><b>${esc(a.name)}</b><small>сохранённый слуга · ОЗ ${hp}</small></span></label>`;}).join(""):`<p class="hint">Сохранённых слуг пока нет.</p>`;
    const content=`<div class="dx3-servant-dialog"><div class="servant-summary"><b>Алый слуга, эффективный ур. ${effectiveLevel}</b><span>Лимит на сцене: ${active.length}/${profile.maxActive}</span><span>Характеристики нового слуги: ${profile.stat}; ОЗ: ${profile.hpMax}</span></div><label class="dx3-servant-choice new"><input type="radio" name="servantChoice" value="new" checked><i class="fa-solid fa-plus"></i><span><b>Создать нового слугу</b><small>Сохранится в каталоге актёров и будет доступен для следующих призывов.</small><input type="text" data-servant-name value="Слуга ${esc(this.name)}" placeholder="Имя слуги"></span></label><h4>Или призвать сохранённого</h4><div class="dx3-servant-saved">${savedRows}</div></div>`;
    const choice=await foundry.applications.api.DialogV2.wait({window:{title:`${item.name} — призыв слуги`,icon:"fa-solid fa-droplet"},position:{width:620,height:620},content,buttons:[{action:"summon",label:"Призвать",icon:"fa-solid fa-person-circle-plus",default:true,callback:async(ev,b,d)=>{const selected=d.element.querySelector('input[name="servantChoice"]:checked')?.value||"new";const name=d.element.querySelector('[data-servant-name]')?.value||`Слуга ${this.name}`;return {selected,name};}},{action:"cancel",label:"Отмена",callback:async()=>null}],rejectClose:false});
    if(!choice) return null;
    let servant;
    if(choice.selected==="new") servant=await this._createServantTemplate(choice.name,effectiveLevel);
    else servant=game.actors.get(choice.selected);
    if(!servant) { ui.notifications.error("Выбранный слуга не найден."); return null; }
    if(active.some(t=>t.getFlag?.(SYS,"servantTemplateId")===servant.id)) { ui.notifications.warn(`«${servant.name}» уже призван на эту сцену.`); return null; }
    return this._summonServantToken(servant,effectiveLevel);
  }

  async rollStat(statKey, options={}) {
    const labels={body:"Тело",sense:"Чувства",mind:"Разум",social:"Социум"};
    return this.rollCheck({label:labels[statKey]??statKey,dice:n(this.system.stats?.[statKey]),skillBonus:0,...options});
  }

  async rollSkill(skillKey, options={}) {
    const info=this.getSkillInfo(skillKey);
    if (!info) { ui.notifications.warn(`Неизвестный навык: ${skillKey}`); return null; }
    return this.rollCheck({label:info.label,dice:info.stat,skillBonus:info.skill,...options});
  }

  async rollCheck({label="Проверка",dice=0,skillBonus=0,diceBonus=0,critical=10,scoreBonus=0,difficulty=null,includeEncroachment=true}={}) {
    try {
      const encBonus=includeEncroachment?n(this.system.encroachment?.diceBonus):0;
      const servantPenalty=this._hasActiveServant()?-3:0;
      const pool=Math.trunc(n(dice)+n(diceBonus)+encBonus+servantPenalty);
      const crit=clampCritical(critical), flat=n(skillBonus)+n(scoreBonus);
      if (pool<=0) {
        await this._postChat(`<div class="dx3-chat-card failure"><h3>${esc(label)}</h3><p><strong>Автоматический провал:</strong> доступно ${pool} кубов.</p></div>`);
        return {score:0,success:false,fumble:false,pool,critical:crit,rolls:[]};
      }
      let currentPool=pool, criticalCount=0, baseScore=0, firstStage=true, fumble=false;
      const stages=[];
      for (let safety=0;safety<100;safety++) {
        const roll=await evaluate(`${currentPool}d10`);
        const results=dieResults(roll);
        if (!results.length) break;
        stages.push({roll,results:[...results]});
        if (firstStage && results.every(v=>v===1)) { fumble=true; baseScore=0; break; }
        firstStage=false;
        const criticalDice=results.filter(v=>v>=crit);
        if (criticalDice.length) { criticalCount++; baseScore+=10; currentPool=criticalDice.length; continue; }
        baseScore+=Math.max(...results); break;
      }
      const score=fumble?0:baseScore+flat;
      const diffNumber=difficulty===null||difficulty===""?null:Number(difficulty);
      const success=fumble?false:(Number.isFinite(diffNumber)?score>=diffNumber:null);
      const stageHtml=stages.map((s,idx)=>`<div class="dx3-roll-stage"><span>${idx===0?"Бросок":`Крит. ${idx}`}:</span> ${s.results.map(v=>`<span class="die ${v>=crit?"critical":""}">${v}</span>`).join(" ")}</div>`).join("");
      let verdict="";
      if (fumble) verdict=`<div class="dx3-verdict failure">Фамбл — автоматический провал</div>`;
      else if (success===true) verdict=`<div class="dx3-verdict success">Успех${Number.isFinite(diffNumber)?` против сложности ${diffNumber}`:""}</div>`;
      else if (success===false) verdict=`<div class="dx3-verdict failure">Провал против сложности ${diffNumber}</div>`;
      await this._postChat(`<div class="dx3-chat-card"><h3>${esc(label)}</h3><div class="dx3-roll-meta">Кубы: <b>${pool}</b> · Крит: <b>${crit}+</b>${encBonus?` · бонус вторжения +${encBonus}`:""}${servantPenalty?` · слуга ${servantPenalty} куба`:""}</div>${stageHtml}<div class="dx3-roll-total">Результат: <strong>${score}</strong>${flat?` <span>(модификатор ${flat>=0?"+":""}${flat})</span>`:""}</div>${verdict}</div>`);
      return {score,success,fumble,pool,critical:crit,criticalCount,rolls:stages};
    } catch (err) {
      console.error("Double Cross | rollCheck failed", err);
      ui.notifications.error(`Double Cross: ошибка броска — ${err?.message??err}`);
      return null;
    }
  }

  async customCheckDialog() {
    const fd=await foundry.applications.api.DialogV2.input({window:{title:"Произвольная проверка Double Cross"},content:`<div class="dx3-dialog-grid"><label>Название <input name="label" type="text" value="Проверка"></label><label>Кубы <input name="dice" type="number" value="1" step="1"></label><label>Критическое значение <input name="critical" type="number" value="10" min="2" max="10" step="1"></label><label>Бонус результата <input name="bonus" type="number" value="0" step="1"></label><label>Сложность (необязательно) <input name="difficulty" type="number" value="" step="1"></label><label><input name="enc" type="checkbox" checked> учитывать бонус вторжения</label></div>`,ok:{label:"Бросить"},rejectClose:false});
    if (!fd) return null;
    return this.rollCheck({label:fd.label||"Проверка",dice:n(fd.dice,1),critical:n(fd.critical,10),scoreBonus:n(fd.bonus),difficulty:fd.difficulty===""?null:n(fd.difficulty),includeEncroachment:Boolean(fd.enc)});
  }

  async sceneEntry() { const roll=await evaluate("1d10"); const amount=n(roll.total); await this.changeEncroachment(amount,`Вход в сцену: +${amount}`); return amount; }

  async impulseCheck() {
    const fd=await foundry.applications.api.DialogV2.input({window:{title:"Проверка импульса"},content:`<label>Сложность проверки Воли <input name="difficulty" type="number" value="9" step="1"></label>`,ok:{label:"Проверить"},rejectClose:false});
    if (!fd) return null;
    const check=await this.rollSkill("will",{label:"Проверка импульса — Воля",difficulty:n(fd.difficulty,9)});
    const roll=await evaluate("2d10"), amount=n(roll.total); await this.changeEncroachment(amount,`Проверка импульса: +${amount} вторжения`);
    if (check?.success===false) ui.notifications.warn("Проверка импульса провалена. Примените соответствующий негативный статус по правилам.");
    return {check,encroachment:amount};
  }

  async backtrack() {
    const activeLoises=["l1","l2","l3","l4","l5","l6","l7"].map(k=>this.system.loises?.[k]).filter(l=>l?.name&&!l.titus&&!l.discarded).length;
    const fd=await foundry.applications.api.DialogV2.input({window:{title:"Backtrack / Возврат"},content:`<div class="dx3-dialog-grid"><label>Активных Лоис <input name="loises" type="number" min="0" value="${activeLoises}" step="1"></label><label>Множитель кубов <select name="multiplier"><option value="1" selected>×1</option><option value="2">×2</option></select></label></div>`,ok:{label:"Бросить"},rejectClose:false});
    if (!fd) return null;
    const dice=Math.max(0,Math.trunc(n(fd.loises)))*Math.max(1,Math.trunc(n(fd.multiplier,1)));
    if (dice<=0) { ui.notifications.warn("Нет кубов для Backtrack."); return null; }
    const roll=await evaluate(`${dice}d10`), amount=n(roll.total), old=n(this.system.encroachment.value), next=Math.max(0,old-amount);
    await this.update({"system.encroachment.value":next});
    await this._postChat(`<div class="dx3-chat-card"><h3>Backtrack / Возврат</h3><p>Бросок: <strong>${dice}d10 = ${amount}</strong></p><p>Вторжение: ${old}% → <strong>${next}%</strong></p></div>`);
    return {dice,amount,old,next};
  }

  async changeEncroachment(delta,reason="Изменение вторжения") { const old=n(this.system.encroachment.value), next=Math.max(0,old+n(delta)); await this.update({"system.encroachment.value":next}); await this._postChat(`<div class="dx3-chat-card compact"><h3>${esc(reason)}</h3><p>Вторжение: ${old}% → <strong>${next}%</strong></p></div>`); return next; }
  async resetEncroachment(){const base=n(this.system.encroachment.base);await this.update({"system.encroachment.value":base});ui.notifications.info(`Вторжение возвращено к базовому значению ${base}%.`);}
  async restoreHp(){await this.update({"system.hp.value":n(this.system.hp.max)});}

  async _applyEncroachmentCost(value, label, data={}) {
    const formula = normalizeFormula(value, "0");
    if (!formula) return 0;
    const resolved = await formulaTotal(formula, data, 0);
    const amount = Math.max(0, n(resolved.total));
    if (resolved.roll && /d\d|@/i.test(formula)) {
      await resolved.roll.toMessage({speaker:ChatClass().getSpeaker({actor:this}),flavor:`${label}: стоимость вторжения (${formula})`});
    }
    if (amount > 0) await this.changeEncroachment(amount,`${label}: стоимость вторжения +${amount}`);
    return amount;
  }

  async usePower(item) {
    if (!item||item.type!=="power") return null;
    try {
      const d=item.system, effectiveLevel=n(d.level)+n(this.system.encroachment.powerLevelBonus);
      const formulaData={level:effectiveLevel, encroachment:n(this.system.encroachment.value)};
      if (d.maxUses>0 && d.uses<=0) { ui.notifications.warn(`У «${item.name}» не осталось использований.`); return null; }
      if (d.automation==="resurrect") {
        if (n(this.system.encroachment.value)>=100) { ui.notifications.warn("Воскрешение недоступно при вторжении 100% и выше."); return null; }
        const dice=Math.max(1,effectiveLevel), roll=await evaluate(`${dice}d10`), amount=n(roll.total);
        const oldHp=n(this.system.hp.value), newHp=Math.min(n(this.system.hp.max),Math.max(0,oldHp)+amount);
        await this.update({"system.hp.value":newHp});
        await this.changeEncroachment(amount,`${item.name}: +${amount} вторжения`);
        await this._postChat(`<div class="dx3-chat-card"><h3>${esc(item.name)}</h3><p>Восстановлено ОЗ: <strong>${amount}</strong> (${oldHp} → ${newHp}).</p></div>`);
        return {heal:amount,encroachment:amount};
      }
      if (d.automation==="servantCreate") {
        const servantResult=await this._useRedServant(item,effectiveLevel);
        if(!servantResult) return null;
        if (game.settings.get(SYS,"autoEncroachment")) {
          const formulaText=String(d.encroachFormula??"").trim();
          const cost=(formulaText===""||(formulaText==="0"&&n(d.encroach)>0))?d.encroach:d.encroachFormula;
          await this._applyEncroachmentCost(cost,item.name,formulaData);
        }
        if(d.maxUses>0&&d.uses>0) await item.update({"system.uses":Math.max(0,n(d.uses)-1)});
        return {servant:servantResult,effectiveLevel};
      }
      const diceBonus=n(d.diceBonus)+n(d.dicePerLevel)*effectiveLevel;
      const critical=clampCritical(n(d.critical,10)+n(d.criticalPerLevel)*effectiveLevel);
      const scoreBonus=n(d.scoreBonus)+n(d.scorePerLevel)*effectiveLevel;
      const attackPowerFormula=attackFormula(d.attackPower,d.attackPerLevel);
      let result=null;
      if (d.skillKey&&d.skillKey!=="none" && ["check","attack"].includes(d.automation)) {
        result=await this.rollSkill(d.skillKey,{label:`${item.name} (ур. ${effectiveLevel})`,diceBonus,critical,scoreBonus});
        if (result && d.automation==="attack") await this._postChat(`<div class="dx3-chat-card compact"><h3>${esc(item.name)}</h3><p>Итог точности: <strong>${result.score}</strong> · Сила атаки: <strong>${esc(attackPowerFormula)}</strong></p><p class="hint">Для броска урона нажмите значок взрыва у способности и укажите итог точности.</p></div>`);
      } else {
        await this._postItemCard(item,`Эффективный уровень: ${effectiveLevel}${d.configured?" · базовые параметры настроены":" · каталожная запись"}`);
      }
      if (game.settings.get("double-cross-3e-ru","autoEncroachment") && d.automation!=="resurrect") {
        const formulaText = String(d.encroachFormula ?? "").trim();
        // Backward compatibility with powers created before v0.3.0, where only numeric encroach existed.
        const cost = (formulaText === "" || (formulaText === "0" && n(d.encroach) > 0)) ? d.encroach : d.encroachFormula;
        await this._applyEncroachmentCost(cost, item.name, formulaData);
      }
      if (d.maxUses>0&&d.uses>0) await item.update({"system.uses":Math.max(0,n(d.uses)-1)});
      return {check:result,attackPowerFormula,effectiveLevel};
    } catch(err) { console.error("Double Cross | usePower failed",err); ui.notifications.error(`Double Cross: способность не сработала — ${err?.message??err}`); return null; }
  }

  async useCombo(item) {
    if (!item || item.type !== "combo") return null;
    try {
      const linkedIds = comboPowerIdsFromItem(item);
      if (item.system.autoCalculate !== false && linkedIds.length) {
        const analysis = analyzeCombo(this, item);
        if (!analysis.valid) {
          ui.notifications.error(`Комбо «${item.name}» нельзя использовать: ${analysis.errors.join(" ")}`);
          return null;
        }

        let extraCost = "0";
        if (analysis.unresolvedCosts.length) {
          const fd = await foundry.applications.api.DialogV2.input({
            window: { title: `${item.name} — особая стоимость Вторжения` },
            content: `<div class="dx3-dialog-grid"><p class="hint">Система не может вычислить часть стоимости автоматически: ${analysis.unresolvedCosts.map(esc).join("; ")}.</p><label>Дополнительная стоимость / формула <input name="extra" type="text" value="0" placeholder="Например: 3 или 1d10"></label></div>`,
            ok: { label: "Продолжить" },
            rejectClose: false
          });
          if (!fd) return null;
          extraCost = String(fd.extra || "0").trim() || "0";
        }

        let result = null;
        if (analysis.skillKey && analysis.skillKey !== "none") {
          result = await this.rollSkill(analysis.skillKey, {
            label: `${item.name} — ${analysis.timing}`,
            diceBonus: analysis.diceBonus,
            critical: analysis.critical,
            scoreBonus: analysis.scoreBonus,
            difficulty: /^\d+$/.test(String(analysis.difficulty || "")) ? Number(analysis.difficulty) : null
          });
        } else {
          await this._postItemCard(item, `${analysis.timing}: автоматический эффект без проверки`);
        }

        const powerNames = analysis.powers.map(p => esc(p.name)).join(" + ");
        const warningHtml = analysis.warnings.length ? `<p class="hint">${analysis.warnings.map(esc).join(" ")}</p>` : "";
        await this._postChat(`<div class="dx3-chat-card compact"><h3>${esc(item.name)}</h3><p><strong>Комбинация:</strong> ${powerNames}</p><p>Навык: <strong>${esc(analysis.skill)}</strong> · Цель: <strong>${esc(analysis.target)}</strong> · Дальность: <strong>${esc(analysis.range)}</strong> · Сложность: <strong>${esc(analysis.difficulty)}</strong></p><p>Кубы: <strong>${analysis.diceBonus >= 0 ? "+" : ""}${analysis.diceBonus}</strong> · Крит: <strong>${analysis.critical}</strong> · Результат: <strong>${analysis.scoreBonus >= 0 ? "+" : ""}${analysis.scoreBonus}</strong> · Сила атаки: <strong>${esc(analysis.attackFormula)}</strong> · Защита: <strong>${analysis.guardValue}</strong></p>${warningHtml}<p class="hint">Эффекты всех выбранных способностей применяются совместно по их карточкам.</p></div>`);

        if (game.settings.get(SYS, "autoEncroachment")) {
          const formula = extraCost && extraCost !== "0" ? `(${analysis.encroachFormula})+(${extraCost})` : analysis.encroachFormula;
          await this._applyEncroachmentCost(formula, item.name, { level: 1, encroachment: n(this.system.encroachment.value) });
        }

        const useUpdates = analysis.powers
          .filter(p => n(p.system.maxUses) > 0 && n(p.system.uses) > 0)
          .map(p => ({ _id: p.id, "system.uses": Math.max(0, n(p.system.uses) - 1) }));
        if (useUpdates.length) await this.updateEmbeddedDocuments("Item", useUpdates);
        return { check: result, attackPower: analysis.attackFormula, analysis };
      }

      // Обратная совместимость: старые комбо, заполненные вручную.
      const d = item.system, over = n(this.system.encroachment.value) >= 100;
      const diceBonus = over ? n(d.diceOver) : n(d.diceUnder), critical = over ? n(d.criticalOver, 10) : n(d.criticalUnder, 10), attackPower = String(over ? d.attackOver : d.attackUnder), notes = over ? d.notesOver : d.notesUnder;
      let result = null;
      if (d.skillKey && d.skillKey !== "none") result = await this.rollSkill(d.skillKey, { label: `${item.name} — ${over ? "100%+" : "до 100%"}`, diceBonus, critical });
      else await this._postItemCard(item, `${over ? "100%+" : "до 100%"}: кубы ${diceBonus >= 0 ? "+" : ""}${diceBonus}, крит ${critical}, сила ${attackPower}`);
      if (notes) await this._postChat(`<div class="dx3-chat-card compact"><h3>${esc(item.name)} — примечание</h3><p>${esc(notes)}</p></div>`);
      if (game.settings.get(SYS, "autoEncroachment")) {
        const formulaText = String(d.encroachFormula ?? "").trim();
        const cost = (formulaText === "" || (formulaText === "0" && n(d.encroach) > 0)) ? d.encroach : d.encroachFormula;
        await this._applyEncroachmentCost(cost, item.name, { level: 1, encroachment: n(this.system.encroachment.value) });
      }
      return { check: result, attackPower };
    } catch (err) {
      console.error("Double Cross | useCombo failed", err);
      ui.notifications.error(`Double Cross: комбо не сработало — ${err?.message ?? err}`);
      return null;
    }
  }

  async rollWeapon(item) {
    if (!item||item.type!=="weapon") return null;
    const d=item.system, result=await this.rollSkill(d.skillKey||"melee",{label:`Атака: ${item.name}`,scoreBonus:n(d.accuracy)});
    if (result&&!result.fumble) await this._postChat(`<div class="dx3-chat-card compact"><h3>${esc(item.name)}</h3><p>Точность: <strong>${result.score}</strong> · Сила атаки: <strong>${esc(d.attackPower)}</strong> · Защита: ${n(d.guard)} · Дистанция: ${esc(d.range)}</p></div>`);
    return result;
  }

  async rollDamage({accuracyScore=0,attackPower="0",label="Урон",formulaData={}}={}) {
    try {
      const score=Math.max(0,n(accuracyScore)), dice=damageDiceFromAccuracy(score);
      const powerFormula=normalizeFormula(attackPower,"0") ?? "0";
      const formula=`${dice}d10 + (${powerFormula})`;
      const roll=await evaluate(formula,formulaData), ChatMessage=ChatClass();
      await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:this}),flavor:`${label}: ${dice}d10 + (${powerFormula}) · из точности ${score}`});
      return roll;
    } catch(err){console.error("Double Cross | rollDamage failed",err);ui.notifications.error(`Double Cross: ошибка формулы урона — ${err?.message??err}`);return null;}
  }

  async damageDialog(item=null) {
    let defaultPower="0", formulaData={level:1,encroachment:n(this.system.encroachment.value)};
    if (item?.type==="power") {
      const effectiveLevel=n(item.system.level)+n(this.system.encroachment.powerLevelBonus);
      defaultPower=attackFormula(item.system.attackPower,item.system.attackPerLevel);
      formulaData.level=effectiveLevel;
    } else if (item?.type==="combo") {
      const linkedIds=comboPowerIdsFromItem(item);
      if(item.system.autoCalculate!==false && linkedIds.length) defaultPower=analyzeCombo(this,item).attackFormula;
      else { const over=n(this.system.encroachment.value)>=100; defaultPower=String(over?item.system.attackOver:item.system.attackUnder); }
    } else if (item?.system?.attackPower !== undefined) defaultPower=String(item.system.attackPower);
    const fd=await foundry.applications.api.DialogV2.input({window:{title:item?`Урон: ${item.name}`:"Бросок урона"},content:`<div class="dx3-dialog-grid"><label>Итог точности <input name="score" type="number" value="10" step="1"></label><label>Сила атаки / формула <input name="power" type="text" value="${esc(defaultPower)}" placeholder="Например: 8 или 1d4+3"></label></div>`,ok:{label:"Бросить урон"},rejectClose:false});
    if (!fd) return null;
    return this.rollDamage({accuracyScore:n(fd.score,10),attackPower:String(fd.power||"0"),label:item?`Урон: ${item.name}`:"Урон",formulaData});
  }

  async _postItemCard(item,extra="") {
    const d=item.system;
    await this._postChat(`<div class="dx3-chat-card"><h3>${esc(item.name)}</h3>${extra?`<p><strong>${esc(extra)}</strong></p>`:""}${d.syndrome?`<p>${esc(d.syndrome)} · ${esc(d.source||"")}</p>`:""}${d.timing?`<p>Действие: ${esc(d.timing)} · Навык: ${esc(d.skill||"-")} · Цель: ${esc(d.target||"-")} · Дистанция: ${esc(d.range||"-")}</p>`:""}${d.description?`<div class="description">${d.description}</div>`:""}${d.notes?`<p class="hint">${esc(d.notes)}</p>`:""}</div>`);
  }

  async _postChat(content) {
    const ChatMessage=ChatClass();
    return ChatMessage.create({speaker:ChatMessage.getSpeaker({actor:this}),content});
  }
}

export { encroachmentDiceBonus, powerLevelBonus, normalizeFormula, attackFormula };
