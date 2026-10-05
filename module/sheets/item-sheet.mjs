import { analyzeCombo, comboPreviewBands, comboPowerIdsFromItem, comboRulesText } from "../combo-engine.mjs";
const { api, sheets } = foundry.applications;

export class DX3ItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["double-cross-3e-ru", "dx3", "item-sheet"],
    tag: "form",
    position: { width: 840, height: 780 },
    window: { resizable: true },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      editImage: DX3ItemSheet.editImage
    }
  };

  static PARTS = {
    main: {
      template: "systems/double-cross-3e-ru/templates/item-sheet.hbs",
      scrollable: [".dx3-item-scroll"]
    }
  };

  _dx3ScrollTop = 0;
  _activePowerTab = null;

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;
    const scroller = root?.querySelector?.(".dx3-item-scroll");
    if (!scroller) return;
    const saved = Number(this._dx3ScrollTop ?? 0);
    requestAnimationFrame(() => { scroller.scrollTop = saved; });
    scroller.addEventListener("scroll", () => { this._dx3ScrollTop = scroller.scrollTop; }, { passive: true });

    const tabs = [...root.querySelectorAll("[data-dx3-tab]")];
    const panels = [...root.querySelectorAll("[data-dx3-tab-panel]")];
    const activateTab = name => {
      if (!name || !tabs.length) return;
      this._activePowerTab = name;
      for (const tab of tabs) {
        const active = tab.dataset.dx3Tab === name;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      }
      for (const panel of panels) {
        const active = panel.dataset.dx3TabPanel === name;
        panel.hidden = !active;
        panel.classList.toggle("active", active);
      }
    };
    for (const tab of tabs) {
      tab.addEventListener("click", event => {
        event.preventDefault();
        activateTab(tab.dataset.dx3Tab);
      });
    }
    if (tabs.length) {
      const fallbackTab = this.document.type === "combo" ? "builder" : "description";
      const wanted = tabs.some(tab => tab.dataset.dx3Tab === this._activePowerTab) ? this._activePowerTab : fallbackTab;
      activateTab(wanted);
    }


    const comboIdsInput = root.querySelector("[data-combo-power-ids]");
    const comboPowerChecks = [...root.querySelectorAll("[data-combo-power-check]")];
    if (comboIdsInput && comboPowerChecks.length) {
      for (const checkbox of comboPowerChecks) {
        checkbox.addEventListener("change", () => {
          const ids = comboPowerChecks.filter(cb => cb.checked).map(cb => cb.value);
          comboIdsInput.value = JSON.stringify(ids);
          comboIdsInput.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }
    }

    const description = root.querySelector("[data-description-editor]");
    if (description) {
      description.addEventListener("keydown", event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          description.blur();
        }
      });
      description.addEventListener("blur", async () => {
        let html = description.innerHTML.trim();
        if (!String(description.textContent || "").trim()) html = "";
        const current = String(this.document.system.description || "").trim();
        if (html === current) return;
        try {
          await this.document.update({ "system.description": html });
        } catch (error) {
          console.error("Double Cross | Не удалось сохранить описание предмета", error);
          ui.notifications.error("Не удалось сохранить описание.");
        }
      });
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    context.item = item;
    context.system = item.system;
    context.isPower = item.type === "power";
    context.isWeapon = item.type === "weapon";
    context.isArmor = item.type === "armor";
    context.isMisc = item.type === "misc";
    context.isCombo = item.type === "combo";
    context.typeLabel = {
      power: "Способность",
      weapon: "Оружие",
      armor: "Броня",
      misc: "Предмет",
      combo: "Комбо"
    }[item.type] ?? item.type;
    context.automationOptions = {
      card: "Карточка / ручной эффект",
      check: "Автоматическая проверка",
      attack: "Автоматическая атака",
      resurrect: "Воскрешение",
      warding: "Оберег",
      "heal-card": "Лечение (карточка)",
      servant: "Создание Алого слуги"
    };
    context.skillOptions = {
      none: "Без автоматического броска",
      melee: "Ближний бой [Тело]",
      dodge: "Уклонение [Тело]",
      ride1: "Вождение 1 [Тело]",
      ride2: "Вождение 2 [Тело]",
      ranged: "Дальний бой [Чувства]",
      perception: "Восприятие [Чувства]",
      art1: "Искусство 1 [Чувства]",
      art2: "Искусство 2 [Чувства]",
      rc: "РК [Разум]",
      will: "Воля [Разум]",
      knowledge1: "Знания 1 [Разум]",
      knowledge2: "Знания 2 [Разум]",
      negotiation: "Переговоры [Социум]",
      procure: "Снабжение [Социум]",
      info1: "Информация 1 [Социум]",
      info2: "Информация 2 [Социум]"
    };
    const actor = item.parent?.documentName === "Actor" ? item.parent : null;
    if (actor?.system?.skills?.custom) {
      const statLabel = {ride:"Тело", art:"Чувства", knowledge:"Разум", info:"Социум"};
      for (const [id, row] of Object.entries(actor.system.skills.custom)) {
        context.skillOptions[`custom:${id}`] = `${row.name || "Доп. навык"} [${statLabel[row.category] || "?"}]`;
      }
    }

    if (context.isCombo && actor) {
      const selectedIds = comboPowerIdsFromItem(item);
      const selectedSet = new Set(selectedIds);
      const analysis = analyzeCombo(actor, item);
      context.comboAnalysis = analysis;
      context.comboPreviewBands = comboPreviewBands(actor, item);
      context.comboRules = comboRulesText();
      context.comboPowerIdsJson = JSON.stringify(selectedIds);
      context.comboSelectedCount = selectedIds.length;
      context.comboSkillOptions = Object.fromEntries(analysis.skillOptions.map(row => [row.value, row.label]));
      context.comboTimingOptions = Object.fromEntries(analysis.timingOptions.map(value => [value, value]));
      context.comboTargetOptions = Object.fromEntries((analysis.targetOptions || [analysis.target]).map(value => [value, value]));
      context.comboPowers = actor.items.filter(i => i.type === "power").map(power => {
        const selected = selectedSet.has(power.id);
        const testIds = selected ? selectedIds : [...selectedIds, power.id];
        const test = analyzeCombo(actor, testIds, { skillKey: item.system.skillKey, timing: item.system.timing, weaponId: item.system.weaponId });
        const blockingErrors = test.errors.filter(error => !/минимум две способности/i.test(error));
        return {
          item: power,
          selected,
          disabled: !selected && blockingErrors.length > 0,
          reason: blockingErrors[0] || "",
          level: Number(power.system.level || 0),
          effectiveLevel: Number(power.system.level || 0) + Number(actor.system.encroachment.powerLevelBonus || 0)
        };
      }).sort((a,b) => String(a.item.system.syndrome || "").localeCompare(String(b.item.system.syndrome || ""), "ru") || a.item.name.localeCompare(b.item.name, "ru"));
      context.comboWeapons = actor.items.filter(i => i.type === "weapon").map(weapon => ({
        id: weapon.id,
        name: weapon.name,
        label: `${weapon.name} · ${weapon.system.skill || "—"} · сила ${weapon.system.attackPower || 0}${weapon.system.equipped ? " · экипировано" : ""}`
      }));
      context.comboWeaponOptions = { "": "Без оружия / сила только от способностей" };
      for (const weapon of context.comboWeapons) context.comboWeaponOptions[weapon.id] = weapon.label;
      context.comboPowerNames = analysis.powers.map(p => p.name).join(" + ");
    }
    return context;
  }
}
