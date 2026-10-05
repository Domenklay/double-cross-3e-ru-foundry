import { POWER_CATALOG, powerDisplayName, powerToItemData } from "../content/powers.mjs";
import { EQUIPMENT_CATALOG, equipmentToItemData } from "../content/equipment.mjs";
import { runCharacterCreator } from "../character-creator.mjs";
import { runCharacterAdvancement } from "../character-advancement.mjs";
import { powerEffectText, powerRulesGridHtml, showPowerDetails, responsiveDialogPosition } from "../content/power-presentation.mjs";
import { analyzeCombo, comboPowerIdsFromItem } from "../combo-engine.mjs";
const { api, sheets } = foundry.applications;

function esc(value) { return foundry.utils.escapeHTML(String(value ?? "")); }

function isPurePower(p){ return /чист/i.test(String(p?.restrict||"")); }
function groupedPowerCatalog(entries){
  const remaining=[...entries];
  const groups=[];
  const take=(title,pred,kind)=>{const picked=[];for(let i=remaining.length-1;i>=0;i--){if(pred(remaining[i]))picked.push(...remaining.splice(i,1));}picked.reverse();if(picked.length)groups.push({title,kind,powers:picked});};
  take("Чистокровные способности",p=>isPurePower(p),"pure");
  take("Общие способности",p=>p.syndrome==="Общие"&&!p.id.startsWith("conc-"),"common");
  take("Шаблоны концентрации",p=>p.id.startsWith("conc-"),"concentration");
  const syndromeOrder=["Ангел Хало","Балор","Блэк Дог","Брэм Стокер","Химера","Экзайл","Хануман","Морфеус","Нойман","Оркус","Саламандра","Солярис"];
  for(const syn of syndromeOrder){
    take(syn,p=>p.syndrome===syn,"syndrome");
    if(syn==="Брэм Стокер") take("Брэм Стокер — слуги",p=>p.syndrome==="Слуги (Брэм Стокер)","servant");
  }
  take("Ренегат-бытие",p=>p.syndrome==="Ренегат-бытие","renegade");
  if(remaining.length)groups.push({title:"Прочие",kind:"other",powers:remaining});
  return groups;
}

export class DX3ActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["double-cross-3e-ru", "dx3", "actor-sheet"],
    tag: "form",
    position: { width: 1040, height: 800 },
    window: { resizable: true },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      pickTokenImage: DX3ActorSheet._onPickTokenImage,
      rollStat: DX3ActorSheet._onRollStat,
      rollSkill: DX3ActorSheet._onRollSkill,
      skillAdd: DX3ActorSheet._onSkillAdd,
      skillDelete: DX3ActorSheet._onSkillDelete,
      customCheck: DX3ActorSheet._onCustomCheck,
      sceneEntry: DX3ActorSheet._onSceneEntry,
      impulseCheck: DX3ActorSheet._onImpulseCheck,
      backtrack: DX3ActorSheet._onBacktrack,
      resetEncroachment: DX3ActorSheet._onResetEncroachment,
      restoreHp: DX3ActorSheet._onRestoreHp,
      damageDialog: DX3ActorSheet._onDamageDialog,
      itemCreate: DX3ActorSheet._onItemCreate,
      powerLibrary: DX3ActorSheet._onPowerLibrary,
      equipmentLibrary: DX3ActorSheet._onEquipmentLibrary,
      characterCreator: DX3ActorSheet._onCharacterCreator,
      characterAdvancement: DX3ActorSheet._onCharacterAdvancement,
      itemEdit: DX3ActorSheet._onItemEdit,
      itemDelete: DX3ActorSheet._onItemDelete,
      itemUse: DX3ActorSheet._onItemUse,
      powerDamage: DX3ActorSheet._onPowerDamage,
      weaponAttack: DX3ActorSheet._onWeaponAttack,
      weaponDamage: DX3ActorSheet._onWeaponDamage,
      comboDamage: DX3ActorSheet._onComboDamage
    }
  };

  static PARTS = {
    main: {
      template: "systems/double-cross-3e-ru/templates/actor-sheet.hbs",
      scrollable: [".dx3-sheet-scroll"]
    }
  };

  _dx3ScrollTop = 0;

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;
    const scroller = root?.querySelector?.(".dx3-sheet-scroll");
    if (!scroller) return;
    const saved = Number(this._dx3ScrollTop ?? 0);
    requestAnimationFrame(() => { scroller.scrollTop = saved; });
    scroller.addEventListener("scroll", () => { this._dx3ScrollTop = scroller.scrollTop; }, { passive: true });

    const powerSearch = root.querySelector("[data-power-sheet-search]");
    const powerClear = root.querySelector("[data-power-sheet-search-clear]");
    const powerVisible = root.querySelector("[data-power-sheet-visible]");
    const powerRows = [...root.querySelectorAll(".dx3-character-power-row")];
    const powerGroups = [...root.querySelectorAll("[data-character-power-group]")];
    const filterPowers = () => {
      if (!powerSearch) return;
      const query = String(powerSearch.value || "").trim().toLocaleLowerCase("ru");
      let visible = 0;
      for (const row of powerRows) {
        const show = !query || String(row.dataset.powerSearchText || "").includes(query);
        row.hidden = !show;
        if (show) visible++;
      }
      for (const group of powerGroups) {
        const shownRows = [...group.querySelectorAll(".dx3-character-power-row")].filter(row => !row.hidden);
        group.hidden = shownRows.length === 0;
        const counter = group.querySelector("[data-power-group-count]");
        if (counter) counter.textContent = String(shownRows.length);
      }
      if (powerVisible) powerVisible.textContent = String(visible);
    };
    powerSearch?.addEventListener("input", filterPowers);
    powerClear?.addEventListener("click", event => {
      event.preventDefault();
      if (!powerSearch) return;
      powerSearch.value = "";
      filterPowers();
      powerSearch.focus();
    });

    root.addEventListener("click", event => {
      const toggle = event.target.closest("[data-power-inline-toggle], [data-item-inline-toggle]");
      if (!toggle) return;
      event.preventDefault();
      event.stopPropagation();
      const row = toggle.closest(".dx3-character-power-row, .dx3-gear-row, .dx3-gear-card, .dx3-combo-card");
      const description = row?.querySelector(".dx3-power-inline-description, .dx3-item-inline-description");
      if (!description) return;
      const opening = description.hidden;
      description.hidden = !opening;
      row.classList.toggle("expanded", opening);
      const icon = toggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-chevron-down", !opening);
        icon.classList.toggle("fa-chevron-up", opening);
      }
      toggle.title = opening ? "Скрыть описание" : "Показать описание";
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const items = actor.items.contents.slice().sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));

    context.actor = actor;
    context.system = actor.system;
    context.isEditable = this.isEditable;
    context.isCharacter = actor.type === "character";
    context.actorTypeLabel = actor.getFlag?.("double-cross-3e-ru","isServant") ? "Слуга" : actor.type === "enemy" ? "Противник" : "Персонаж";
    context.creationMethodLabel = actor.system.details?.creationMethod === "construction" ? "Конструкция" : actor.system.details?.creationMethod === "full" ? "Полный скретч" : "Не задан";
    const stripHtml = value => String(value ?? "")
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    context.powers = items.filter(i => i.type === "power").map(item => {
      const level = Number(item.system.level || 0);
      const effectiveLevel = level + Number(actor.system.encroachment.powerLevelBonus || 0);
      const syndrome = String(item.system.syndrome || "Без синдрома").trim() || "Без синдрома";
      return {
        item,
        syndrome,
        effectiveLevel,
        levelLabel: effectiveLevel !== level ? `${level} → ${effectiveLevel}` : String(level),
        searchText: `${item.name} ${syndrome} ${item.system.source || ""} ${item.system.timing || ""} ${item.system.skill || ""} ${item.system.target || ""} ${item.system.range || ""} ${stripHtml(item.system.description)}`.toLocaleLowerCase("ru")
      };
    });
    const groupMap = new Map();
    for (const row of context.powers) {
      if (!groupMap.has(row.syndrome)) groupMap.set(row.syndrome, []);
      groupMap.get(row.syndrome).push(row);
    }
    const groupWeight = name => /^(общие|общая)/i.test(name) ? 0 : /ренегат/i.test(name) ? 2 : 1;
    context.powerGroups = [...groupMap.entries()]
      .sort(([a], [b]) => groupWeight(a) - groupWeight(b) || a.localeCompare(b, "ru"))
      .map(([name, rows]) => ({ name, rows, count: rows.length }));
    context.weapons = items.filter(i => i.type === "weapon");
    context.armors = items.filter(i => i.type === "armor");
    context.misc = items.filter(i => i.type === "misc");
    context.combos = items.filter(i => i.type === "combo").map(item => {
      const linked = comboPowerIdsFromItem(item);
      const analysis = linked.length && item.system.autoCalculate !== false ? analyzeCombo(actor, item) : null;
      return { item, linkedCount: linked.length, analysis, isAuto: Boolean(analysis) };
    });
    context.encroachmentClass = Number(actor.system.encroachment.value) >= 100 ? "danger" : Number(actor.system.encroachment.value) >= 80 ? "warning" : "normal";
    context.activeLoises = ["l1", "l2", "l3", "l4", "l5", "l6", "l7"]
      .map(key => actor.system.loises?.[key])
      .filter(l => l?.name && !l.titus && !l.discarded).length;

    const custom = actor.system.skills?.custom ?? {};
    context.customSkills = { ride: [], art: [], knowledge: [], info: [] };
    for (const [id, row] of Object.entries(custom)) {
      const category = context.customSkills[row.category] ? row.category : "ride";
      context.customSkills[category].push({ id, name: row.name, value: row.value, category });
    }
    for (const list of Object.values(context.customSkills)) list.sort((a,b) => a.id.localeCompare(b.id));
    return context;
  }

  static async _onPickTokenImage(event) {
    event.preventDefault();
    const actor = this.document;
    const current = actor.prototypeToken?.texture?.src || actor.img || "";
    const Picker = foundry.applications.apps.FilePicker;
    const picker = new Picker({
      type: "image",
      current,
      callback: async path => {
        if (!path) return;
        await actor.update({ img: path, "prototypeToken.texture.src": path });
        ui.notifications.info("Изображение актёра и прототип токена обновлены.");
      }
    });
    return picker.render({ force: true });
  }

  static async _onRollStat(event, target) {
    event.preventDefault();
    return this.document.rollStat(target.dataset.stat);
  }

  static async _onRollSkill(event, target) {
    event.preventDefault();
    return this.document.rollSkill(target.dataset.skill);
  }

  static async _onSkillAdd(event, target) {
    event.preventDefault();
    const category = target.dataset.category;
    if (!["ride","art","knowledge","info"].includes(category)) return null;
    const current = foundry.utils.deepClone(this.document.system.skills?.custom ?? {});
    let id = foundry.utils.randomID(8);
    while (current[id]) id = foundry.utils.randomID(8);
    current[id] = { category, name: "", value: 0 };
    await this.document.update({ "system.skills.custom": current });
    return id;
  }

  static async _onSkillDelete(event, target) {
    event.preventDefault();
    const id = target.dataset.skillId;
    if (!id) return null;
    const current = foundry.utils.deepClone(this.document.system.skills?.custom ?? {});
    if (!current[id]) return null;
    delete current[id];
    return this.document.update({ "system.skills.custom": current });
  }

  static async _onCustomCheck(event) {
    event.preventDefault();
    return this.document.customCheckDialog();
  }

  static async _onSceneEntry(event) {
    event.preventDefault();
    return this.document.sceneEntry();
  }

  static async _onImpulseCheck(event) {
    event.preventDefault();
    return this.document.impulseCheck();
  }

  static async _onBacktrack(event) {
    event.preventDefault();
    return this.document.backtrack();
  }

  static async _onResetEncroachment(event) {
    event.preventDefault();
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Сбросить вторжение?" },
      content: `<p>Текущее значение будет заменено базовым (${this.document.system.encroachment.base}%).</p>`,
      yes: { label: "Сбросить" },
      no: { label: "Отмена" },
      rejectClose: false
    });
    if (ok) return this.document.resetEncroachment();
  }

  static async _onRestoreHp(event) {
    event.preventDefault();
    return this.document.restoreHp();
  }

  static async _onDamageDialog(event) {
    event.preventDefault();
    return this.document.damageDialog();
  }

  static async _onCharacterCreator(event) {
    event.preventDefault();
    return runCharacterCreator(this.document);
  }

  static async _onCharacterAdvancement(event) {
    event.preventDefault();
    return runCharacterAdvancement(this.document);
  }

  static async _onEquipmentLibrary(event) {
    event.preventDefault();
    const categories = [
      ["","Всё"],["weapon","Оружие"],["armor","Броня"],["misc","Вещи, связи и транспорт"]
    ];
    const rows = EQUIPMENT_CATALOG.map(e => {
      const search = `${e.name} ${e.category} ${e.source} ${e.system?.skill ?? ""}`.toLocaleLowerCase("ru");
      const detail = e.type === "weapon"
        ? `сила ${e.system.attackPower} · точность ${e.system.accuracy} · запас ${e.system.stock}`
        : e.type === "armor"
          ? `броня ${e.system.armor} · запас ${e.system.stock}`
          : `${e.system.itemType} · запас ${e.system.stock}`;
      return `<label class="dx3-power-choice" data-gear-row data-search="${esc(search)}" data-type="${esc(e.type)}">
        <input type="checkbox" data-gear-select value="${esc(e.id)}">
        <img class="picker-icon" src="${esc(e.img)}">
        <span class="power-choice-main"><strong>${esc(e.name)}</strong><small>${esc(e.category)} · ${esc(detail)}</small></span>
      </label>`;
    }).join("");
    const content = `<div class="dx3-power-picker">
      <div class="dx3-power-filters">
        <input type="search" data-gear-search placeholder="Найти оружие, броню или предмет…" autofocus>
        <select data-gear-type>${categories.map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select>
      </div>
      <div class="dx3-power-picker-toolbar"><span>Найдено: <b data-gear-visible>${EQUIPMENT_CATALOG.length}</b> / ${EQUIPMENT_CATALOG.length}</span><span>Выбрано: <b data-gear-selected>0</b></span><button type="button" data-select-visible>Выбрать видимые</button><button type="button" data-clear-selection>Снять выбор</button></div>
      <div class="dx3-power-choice-list">${rows}</div>
      <p class="hint">Каталог — быстрый способ добавить готовые карточки. Стоимость Запаса видна в каждой строке; мастер создания персонажа отдельно контролирует стартовый бюджет.</p>
    </div>`;
    const ids = await foundry.applications.api.DialogV2.wait({
      window:{title:`Каталог снаряжения — ${EQUIPMENT_CATALOG.length}`,resizable:true}, position:responsiveDialogPosition(900,760), content,
      buttons:[{action:"add",label:"Добавить выбранное",icon:"fa-solid fa-plus",default:true,callback:async(ev,b,d)=>[...d.element.querySelectorAll("[data-gear-select]:checked")].map(x=>x.value)},{action:"cancel",label:"Отмена",callback:async()=>null}],
      rejectClose:false,
      render:(ev,d)=>{
        const root=d.element.querySelector(".dx3-power-picker"), search=root.querySelector("[data-gear-search]"), type=root.querySelector("[data-gear-type]"), rows=[...root.querySelectorAll("[data-gear-row]")];
        const upd=()=>{const q=String(search.value||"").trim().toLocaleLowerCase("ru");let visible=0;for(const row of rows){const show=(!q||row.dataset.search.includes(q))&&(!type.value||row.dataset.type===type.value);row.hidden=!show;if(show)visible++;}root.querySelector("[data-gear-visible]").textContent=String(visible);root.querySelector("[data-gear-selected]").textContent=String(root.querySelectorAll("[data-gear-select]:checked").length);};
        root.addEventListener("input",upd);root.addEventListener("change",upd);
        root.querySelector("[data-select-visible]").addEventListener("click",()=>{for(const row of rows)if(!row.hidden)row.querySelector("[data-gear-select]").checked=true;upd();});
        root.querySelector("[data-clear-selection]").addEventListener("click",()=>{for(const cb of root.querySelectorAll("[data-gear-select]"))cb.checked=false;upd();});upd();
      }
    });
    if(!Array.isArray(ids)||!ids.length)return null;
    const data=ids.map(id=>EQUIPMENT_CATALOG.find(x=>x.id===id)).filter(Boolean).map(equipmentToItemData);
    const created=await this.document.createEmbeddedDocuments("Item",data);
    ui.notifications.info(`Добавлено предметов: ${created.length}.`);
    return created;
  }

  static async _onPowerLibrary(event) {
    event.preventDefault();
    const syndromes = [...new Set(POWER_CATALOG.map(p => p.syndrome).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ru"));
    const sources = [...new Set(POWER_CATALOG.map(p => p.source).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ru"));
    const syndromeOptions = [`<option value="">Все синдромы</option>`, ...syndromes.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`)].join("");
    const sourceOptions = [`<option value="">Все источники</option>`, ...sources.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`)].join("");
    const groups=groupedPowerCatalog(POWER_CATALOG);
    const rowHtml=p=>{
      const name = powerDisplayName(p);
      const searchable = `${name} ${p.syndrome} ${p.source} ${p.timing ?? ""} ${p.skill ?? ""} ${p.descriptionRu ?? p.notes ?? ""}`.toLocaleLowerCase("ru");
      const effect=powerEffectText(p);
      return `<label class="dx3-power-choice detailed" data-search="${esc(searchable)}" data-syndrome="${esc(p.syndrome)}" data-source="${esc(p.source)}" data-configured="${p.configured?"1":"0"}">
        <input type="checkbox" data-power-select value="${esc(p.id)}">
        <span class="power-choice-main"><strong>${esc(name)}</strong><small class="power-choice-source">${esc(p.syndrome)} · ${esc(p.source)}</small>${powerRulesGridHtml(p)}<span class="power-choice-desc">${esc(effect)}</span><button type="button" class="power-choice-details" data-power-details="${esc(p.id)}"><i class="fa-solid fa-book-open"></i> Подробнее</button></span>
        <span class="power-choice-state ${p.configured?"ready":"catalog"}">${p.configured?"авто":"вручную"}</span>
      </label>`;
    };
    const groupedRows=groups.map(g=>`<section class="dx3-power-group" data-power-group><header><span>${esc(g.title)}</span><b>${g.powers.length}</b></header><div>${g.powers.map(rowHtml).join("")}</div></section>`).join("");

    const content = `<div class="dx3-power-picker">
      <div class="dx3-power-filters">
        <input type="search" data-power-search placeholder="Поиск по названию, навыку, синдрому…" autofocus>
        <select data-power-syndrome>${syndromeOptions}</select>
        <select data-power-source>${sourceOptions}</select>
        <label class="picker-check"><input type="checkbox" data-power-ready> только с автоматизацией</label>
      </div>
      <div class="dx3-power-picker-toolbar"><span>Найдено: <b data-power-visible>${POWER_CATALOG.length}</b> / ${POWER_CATALOG.length}</span><span>Выбрано: <b data-power-selected>0</b></span><button type="button" data-select-visible>Выбрать видимые</button><button type="button" data-clear-selection>Снять выбор</button></div>
      <div class="dx3-power-choice-list grouped">${groupedRows}</div>
      <p class="hint">Чистокровные, общие и синдромные способности разделены по блокам. Описание показывается полностью; можно выбрать сразу несколько карточек.</p>
    </div>`;

    const selectedIds = await foundry.applications.api.DialogV2.wait({
      window: { title: `Библиотека способностей — ${POWER_CATALOG.length}`, resizable: true },
      position: responsiveDialogPosition(980,820),
      content,
      buttons: [
        {
          action: "add",
          label: "Добавить выбранные",
          icon: "fa-solid fa-plus",
          default: true,
          callback: async (ev, button, dialog) => [...dialog.element.querySelectorAll("[data-power-select]:checked")].map(el => el.value)
        },
        { action: "cancel", label: "Отмена", icon: "fa-solid fa-xmark", callback: async () => null }
      ],
      rejectClose: false,
      render: (ev, dialog) => {
        const root = dialog.element.querySelector(".dx3-power-picker");
        if (!root) return;
        const search = root.querySelector("[data-power-search]");
        const syndrome = root.querySelector("[data-power-syndrome]");
        const source = root.querySelector("[data-power-source]");
        const ready = root.querySelector("[data-power-ready]");
        const choices = [...root.querySelectorAll(".dx3-power-choice")];
        const groups=[...root.querySelectorAll("[data-power-group]")];
        const visibleCounter = root.querySelector("[data-power-visible]");
        const selectedCounter = root.querySelector("[data-power-selected]");

        const updateSelected = () => { selectedCounter.textContent = String(root.querySelectorAll("[data-power-select]:checked").length); };
        const filter = () => {
          const q = String(search.value || "").trim().toLocaleLowerCase("ru");
          let count = 0;
          for (const row of choices) {
            const show = (!q || row.dataset.search.includes(q)) && (!syndrome.value || row.dataset.syndrome === syndrome.value) && (!source.value || row.dataset.source === source.value) && (!ready.checked || row.dataset.configured === "1");
            row.hidden = !show;
            if (show) count++;
          }
          for(const group of groups) group.hidden=![...group.querySelectorAll(".dx3-power-choice")].some(row=>!row.hidden);
          visibleCounter.textContent = String(count);
        };
        for (const el of [search,syndrome,source,ready]) el.addEventListener("input",filter);
        root.addEventListener("click", async ev2 => {
          const btn=ev2.target.closest("[data-power-details]");
          if(!btn)return;
          ev2.preventDefault();
          ev2.stopPropagation();
          const pwr=POWER_CATALOG.find(x=>x.id===btn.dataset.powerDetails);
          if(pwr) await showPowerDetails(pwr);
        });
        root.addEventListener("change", ev2 => { if (ev2.target.matches("[data-power-select]")) updateSelected(); });
        root.querySelector("[data-select-visible]").addEventListener("click", () => { for (const row of choices) if (!row.hidden) row.querySelector("[data-power-select]").checked = true; updateSelected(); });
        root.querySelector("[data-clear-selection]").addEventListener("click", () => { for (const cb of root.querySelectorAll("[data-power-select]")) cb.checked = false; updateSelected(); });
        filter();
      }
    });

    if (!Array.isArray(selectedIds) || !selectedIds.length) return null;
    const entries = selectedIds.map(id => POWER_CATALOG.find(p => p.id === id)).filter(Boolean);
    if (!entries.length) return null;
    const created = await this.document.createEmbeddedDocuments("Item", entries.map(powerToItemData));
    ui.notifications.info(`Добавлено способностей: ${created.length}.`);
    return created;
  }

  static async _onItemCreate(event, target) {
    event.preventDefault();
    const type = target.dataset.type;
    const names = {
      power: "Новая способность",
      weapon: "Новое оружие",
      armor: "Новая броня",
      misc: "Новый предмет",
      combo: "Новое комбо"
    };
    const created = await this.document.createEmbeddedDocuments("Item", [{
      name: names[type] ?? "Новый предмет",
      type
    }]);
    if (created?.[0]) created[0].sheet.render({ force: true });
  }

  static async _onItemEdit(event, target) {
    event.preventDefault();
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    return item?.sheet.render({ force: true });
  }

  static async _onItemDelete(event, target) {
    event.preventDefault();
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.document.items.get(id);
    if (!item) return;
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Удалить предмет?" },
      content: `<p>Удалить «${foundry.utils.escapeHTML(item.name)}»?</p>`,
      yes: { label: "Удалить" },
      no: { label: "Отмена" },
      rejectClose: false
    });
    if (ok) await this.document.deleteEmbeddedDocuments("Item", [id]);
  }

  static async _onItemUse(event, target) {
    event.preventDefault();
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (!item) return;
    if (item.type === "power") return this.document.usePower(item);
    if (item.type === "combo") return this.document.useCombo(item);
    return this.document._postItemCard(item);
  }

  static async _onPowerDamage(event, target) {
    event.preventDefault();
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (item?.type === "power") return this.document.damageDialog(item);
  }

  static async _onWeaponAttack(event, target) {
    event.preventDefault();
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (item?.type === "weapon") return this.document.rollWeapon(item);
  }

  static async _onWeaponDamage(event, target) {
    event.preventDefault();
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (item?.type === "weapon") return this.document.damageDialog(item);
  }

  static async _onComboDamage(event, target) {
    event.preventDefault();
    const item = this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (!item || item.type !== "combo") return;
    return this.document.damageDialog(item);
  }
}
