import { POWER_CATALOG, powerDisplayName, powerToItemData } from "./content/powers.mjs";
import { powerEffectText, showPowerDetails, responsiveDialogPosition } from "./content/power-presentation.mjs";

const SYS = "double-cross-3e-ru";
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const esc = value => foundry.utils.escapeHTML(String(value ?? ""));

const STAT_LABELS = Object.freeze({ body: "Тело", sense: "Чувства", mind: "Разум", social: "Социум" });
const STANDARD_SKILLS = Object.freeze([
  ["melee", "Ближний бой"], ["dodge", "Уклонение"], ["ranged", "Дальний бой"], ["perception", "Восприятие"],
  ["rc", "РК"], ["will", "Воля"], ["negotiation", "Переговоры"], ["procure", "Снабжение"]
]);
const SPECIAL_SKILLS = Object.freeze([
  ["ride1", "Вождение"], ["ride2", "Вождение"], ["art1", "Искусство"], ["art2", "Искусство"],
  ["knowledge1", "Знания"], ["knowledge2", "Знания"], ["info1", "Информация"], ["info2", "Информация"]
]);

const PURE_POWER_IDS = new Set([
  "core-015","core-030","core-045","core-060","core-075","core-090","core-105","core-120","core-135","core-150","core-165","core-180",
  "core-214","core-237","core-260","core-283","core-313","core-336","core-359","core-382","core-405","core-428","core-451","core-474"
]);
const POWER_PREREQUISITES = Object.freeze({
  "core-264":["core-261"], "core-265":["core-261"], "core-268":["core-261"], "core-269":["core-261"],
  "core-271":["core-261"], "core-272":["core-261"], "core-274":["core-261"], "core-276":["core-261"],
  "core-279":["core-261"], "core-281":["core-261","core-265"],
  "core-284":["core-261"], "core-285":["core-261"], "core-286":["core-261"], "core-287":["core-261"],
  "core-288":["core-261"], "core-289":["core-261"], "core-290":["core-261"]
});
const RB_ORIGIN_IDS = new Set(["core-491","core-492","core-493","core-494","core-495","core-496","core-497"]);
const FREE_OR_STORY_POWER_IDS = new Set(["core-181","core-182","core-183","core-490", ...RB_ORIGIN_IDS]);

function skillCost(from, to, special = false) {
  let cost = 0;
  for (let level = Math.max(0, n(from)); level < Math.max(0, n(to)); level++) {
    const next = level + 1;
    if (next <= 10) cost += special ? 1 : 2;
    else if (next <= 20) cost += 3;
    else if (next <= 30) cost += 5;
    else cost += 10;
  }
  return cost;
}

function statCost(from, to) {
  let cost = 0;
  for (let level = Math.max(0, n(from)); level < Math.max(0, n(to)); level++) {
    const next = level + 1;
    cost += next <= 10 ? 10 : next <= 20 ? 20 : 30;
  }
  return cost;
}

function parseSyndromes(actor) {
  const values = String(actor.system.details?.syndromes ?? "")
    .split(/[\/;,]+/)
    .map(v => v.trim())
    .filter(Boolean);
  const sub = String(actor.system.details?.subSyndrome ?? "").trim();
  if (sub && !values.includes(sub)) values.push(sub);
  return [...new Set(values)];
}

function isPurePower(power) {
  return PURE_POWER_IDS.has(power?.id) || /чист/i.test(String(power?.restrict ?? ""));
}

function allowedNewPower(actor, power) {
  if (!power) return false;
  if (FREE_OR_STORY_POWER_IDS.has(power.id) || power.id.startsWith("conc-")) return false;
  const breed = String(actor.system.details?.breed ?? "");
  const syndromes = parseSyndromes(actor);
  const work = String(actor.system.details?.work ?? "");
  const syndromeAllowed = syndromes.includes(power.syndrome)
    || power.syndrome === "Общие"
    || (power.syndrome === "Слуги (Брэм Стокер)" && syndromes.includes("Брэм Стокер"))
    || (power.syndrome === "Ренегат-бытие" && work.startsWith("Ренегат-бытие"));
  if (!syndromeAllowed) return false;
  if (breed !== "Чистокровный" && isPurePower(power)) return false;
  if (breed === "Трибрид") {
    const restrict = String(power.restrict ?? "");
    const sub = String(actor.system.details?.subSyndrome ?? "").trim();
    if (restrict === "100%") return false;
    if (sub && power.syndrome === sub && restrict === "80%") return false;
  }
  return true;
}

function maxPowerLevel(actor, power) {
  const base = Math.max(1, n(power?.maxLevel, 1));
  const breed = String(actor.system.details?.breed ?? "");
  const syndromes = parseSyndromes(actor);
  if (power?.syndrome === "Ренегат-бытие" || power?.syndrome === "Общие" || String(power?.syndrome ?? "").startsWith("Слуги")) return base;
  if (breed === "Чистокровный" && power?.syndrome === syndromes[0]) return base + 2;
  if (breed === "Трибрид" && syndromes.includes(power?.syndrome)) return base === 1 ? 1 : Math.max(1, base - 1);
  return base;
}

function powerPrerequisites(power) {
  const explicit = POWER_PREREQUISITES[power?.id] ?? [];
  if (power?.syndrome === "Слуги (Брэм Стокер)" && !explicit.includes("core-261")) return ["core-261", ...explicit];
  return [...explicit];
}

function powerName(id) {
  const power = POWER_CATALOG.find(p => p.id === id);
  return power ? powerDisplayName(power) : id;
}

function groupPowers(entries) {
  const order = ["Общие", "Ангел Хало", "Балор", "Блэк Дог", "Брэм Стокер", "Слуги (Брэм Стокер)", "Химера", "Экзайл", "Хануман", "Морфеус", "Нойман", "Оркус", "Саламандра", "Солярис", "Ренегат-бытие"];
  const rank = new Map(order.map((name, index) => [name, index]));
  const map = new Map();
  for (const row of entries) {
    const key = row.power.syndrome || "Прочие";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a.localeCompare(b, "ru"))
    .map(([title, rows]) => ({ title, rows: rows.sort((a, b) => powerDisplayName(a.power).localeCompare(powerDisplayName(b.power), "ru")) }));
}

function builtInSpecialName(actor, key, fallback) {
  const name = String(actor.system.skills?.[key]?.name ?? "").trim();
  return name ? `${fallback}: ${name}` : `${fallback}: специализация`;
}

function advancementSkillRows(actor) {
  const rows = STANDARD_SKILLS.map(([key, label]) => ({ key, label, current: n(actor.system.skills?.[key]), special: false, path: `system.skills.${key}` }));
  for (const [key, label] of SPECIAL_SKILLS) {
    rows.push({ key, label: builtInSpecialName(actor, key, label), current: n(actor.system.skills?.[key]?.value), special: true, path: `system.skills.${key}.value` });
  }
  for (const [id, row] of Object.entries(actor.system.skills?.custom ?? {})) {
    const prefix = ({ ride: "Вождение", art: "Искусство", knowledge: "Знания", info: "Информация" })[row.category] ?? "Специализация";
    const name = String(row.name ?? "").trim();
    rows.push({ key: `custom:${id}`, id, label: name ? `${prefix}: ${name}` : `${prefix}: специализация`, current: n(row.value), special: true, path: null });
  }
  return rows;
}

function advancementPowerRows(actor) {
  const ownedByLibraryId = new Map();
  for (const item of actor.items.filter(item => item.type === "power")) {
    const id = item.getFlag?.(SYS, "libraryId");
    if (id && !ownedByLibraryId.has(id)) ownedByLibraryId.set(id, item);
  }
  const catalogById = new Map(POWER_CATALOG.map(p => [p.id, p]));
  const ids = new Set();
  for (const power of POWER_CATALOG) if (allowedNewPower(actor, power)) ids.add(power.id);
  for (const id of ownedByLibraryId.keys()) if (catalogById.has(id)) ids.add(id);

  return [...ids].map(id => {
    const power = catalogById.get(id);
    const item = ownedByLibraryId.get(id) ?? null;
    const current = item ? Math.max(0, n(item.system.level, 1)) : 0;
    const cap = Math.max(current || 1, n(item?.system?.maxLevel, 0), maxPowerLevel(actor, power));
    return { id, power, item, current, cap, canAcquire: Boolean(item) || allowedNewPower(actor, power) };
  });
}

function statRowsHtml(actor) {
  return Object.entries(STAT_LABELS).map(([key, label]) => {
    const current = Math.max(0, n(actor.system.stats?.[key]));
    const nextCost = statCost(current, current + 1);
    return `<label class="advancement-row compact-row">
      <span><b>${esc(label)}</b><small>Сейчас ${current} · следующий +${nextCost} XP</small></span>
      <input type="number" data-adv-stat="${esc(key)}" data-current="${current}" min="${current}" max="99" step="1" value="${current}">
    </label>`;
  }).join("");
}

function skillRowsHtml(actor) {
  return advancementSkillRows(actor).map(row => {
    const nextCost = skillCost(row.current, row.current + 1, row.special);
    return `<label class="advancement-row compact-row">
      <span><b>${esc(row.label)}</b><small>Сейчас ${row.current} · следующий +${nextCost} XP</small></span>
      <input type="number" data-adv-skill="${esc(row.key)}" data-current="${row.current}" data-special="${row.special ? "1" : "0"}" min="${row.current}" max="99" step="1" value="${row.current}">
    </label>`;
  }).join("");
}

function powerRowHtml(row) {
  const { power, current, cap } = row;
  const effect = powerEffectText(power);
  const prereqs = powerPrerequisites(power);
  const prereqText = prereqs.length ? `<small class="advancement-prereq">Требует: ${prereqs.map(id => esc(powerName(id))).join(", ")}</small>` : "";
  const status = current > 0 ? `<span class="advancement-state owned">изучено ${current}/${cap}</span>` : `<span class="advancement-state new">новая · 15 XP</span>`;
  const search = `${powerDisplayName(power)} ${power.syndrome} ${power.source} ${effect} ${prereqs.map(powerName).join(" ")}`.toLocaleLowerCase("ru");
  return `<div class="advancement-power-row" data-adv-power-row data-search="${esc(search)}" data-syndrome="${esc(power.syndrome)}">
    <div class="advancement-power-main">
      <div class="advancement-power-title"><b>${esc(powerDisplayName(power))}</b>${status}</div>
      <small>${esc(power.syndrome)} · ${esc(power.source)} · макс. ${cap}</small>
      <span class="advancement-power-desc">${esc(effect)}</span>
      ${prereqText}
      <button type="button" data-adv-power-details="${esc(power.id)}"><i class="fa-solid fa-book-open"></i> Подробнее</button>
    </div>
    <label class="advancement-level-control"><span>${current ? "Новый уровень" : "Изучить до"}</span><input type="number" data-adv-power-target="${esc(power.id)}" data-current="${current}" min="${current}" max="${cap}" step="1" value="${current}"></label>
  </div>`;
}

function advancementContent(actor, powerRows) {
  const groups = groupPowers(powerRows);
  const powerGroupsHtml = groups.map(group => `<section class="advancement-power-group" data-adv-power-group>
    <header><b>${esc(group.title)}</b><span>${group.rows.length}</span></header>
    <div>${group.rows.map(powerRowHtml).join("")}</div>
  </section>`).join("");
  const available = Math.max(0, n(actor.system.details?.availableXp));
  const spent = Math.max(0, n(actor.system.details?.spentXp));
  return `<div class="dx3-advancement">
    <div class="advancement-header">
      <div><b>Прокачка персонажа</b><small>Изменения применяются только после нажатия «Купить».</small></div>
      <div class="advancement-xp"><span>В наличии <b data-adv-available>${available}</b> XP</span><span>Потрачено <b>${spent}</b> XP</span></div>
    </div>
    <nav class="advancement-tabs">
      <button type="button" class="active" data-adv-tab="stats"><i class="fa-solid fa-chart-simple"></i> Характеристики и навыки</button>
      <button type="button" data-adv-tab="powers"><i class="fa-solid fa-bolt"></i> Способности</button>
    </nav>
    <section class="advancement-tab active" data-adv-panel="stats">
      <div class="advancement-columns">
        <div><h3>Характеристики</h3><div class="advancement-list">${statRowsHtml(actor)}</div></div>
        <div><h3>Навыки</h3><div class="advancement-list skill-list">${skillRowsHtml(actor)}</div></div>
      </div>
      <p class="hint">Стоимость считается по тем же ступеням, что и в мастере создания. Можно повысить сразу несколько значений.</p>
    </section>
    <section class="advancement-tab" data-adv-panel="powers" hidden>
      <div class="advancement-power-tools"><input type="search" data-adv-power-search placeholder="Поиск способности, эффекта или зависимости…"><span>Новая способность: 15 XP · каждый дополнительный уровень: 5 XP</span></div>
      <div class="advancement-power-list">${powerGroupsHtml || '<p class="hint">Для этого персонажа нет доступных способностей из каталога.</p>'}</div>
    </section>
    <footer class="advancement-summary">
      <div><span>К оплате</span><strong><b data-adv-cost>0</b> XP</strong></div>
      <div><span>Останется</span><strong><b data-adv-left>${available}</b> XP</strong></div>
      <p data-adv-warning></p>
    </footer>
  </div>`;
}

function collectTargets(root, actor, powerRows, { enforceDependencies = true } = {}) {
  const available = Math.max(0, n(actor.system.details?.availableXp));
  const statChanges = [];
  const skillChanges = [];
  const powerChanges = [];
  const warnings = [];
  let cost = 0;

  for (const input of root.querySelectorAll("[data-adv-stat]")) {
    const current = Math.max(0, n(input.dataset.current));
    const target = Math.max(current, Math.min(99, Math.trunc(n(input.value, current))));
    input.value = String(target);
    if (target > current) {
      const rowCost = statCost(current, target);
      cost += rowCost;
      statChanges.push({ key: input.dataset.advStat, current, target, cost: rowCost });
    }
  }

  for (const input of root.querySelectorAll("[data-adv-skill]")) {
    const current = Math.max(0, n(input.dataset.current));
    const target = Math.max(current, Math.min(99, Math.trunc(n(input.value, current))));
    input.value = String(target);
    if (target > current) {
      const special = input.dataset.special === "1";
      const rowCost = skillCost(current, target, special);
      cost += rowCost;
      skillChanges.push({ key: input.dataset.advSkill, current, target, special, cost: rowCost });
    }
  }

  const rowById = new Map(powerRows.map(row => [row.id, row]));
  const inputById = new Map([...root.querySelectorAll("[data-adv-power-target]")].map(input => [input.dataset.advPowerTarget, input]));

  if (enforceDependencies) {
    let changed = true;
    let safety = 0;
    while (changed && safety++ < 20) {
      changed = false;
      for (const [id, input] of inputById) {
        const row = rowById.get(id);
        if (!row) continue;
        const target = Math.max(row.current, Math.trunc(n(input.value, row.current)));
        const isBeingBought = target > row.current;
        if (!isBeingBought) continue;
        for (const prereqId of powerPrerequisites(row.power)) {
          const prereqRow = rowById.get(prereqId);
          if (prereqRow?.current > 0) continue;
          const prereqInput = inputById.get(prereqId);
          if (!prereqRow || !prereqInput) {
            warnings.push(`Для «${powerDisplayName(row.power)}» нужна способность «${powerName(prereqId)}», но её нельзя приобрести в этом окне.`);
            continue;
          }
          if (n(prereqInput.value) < 1) {
            prereqInput.value = "1";
            changed = true;
          }
        }
      }
    }
  }

  for (const [id, input] of inputById) {
    const row = rowById.get(id);
    if (!row) continue;
    const current = row.current;
    const target = Math.max(current, Math.min(row.cap, Math.trunc(n(input.value, current))));
    input.value = String(target);
    if (target <= current) continue;
    const rowCost = current <= 0 ? 15 + Math.max(0, target - 1) * 5 : (target - current) * 5;
    cost += rowCost;
    powerChanges.push({ id, row, current, target, cost: rowCost });
  }

  for (const change of powerChanges) {
    for (const prereqId of powerPrerequisites(change.row.power)) {
      const prereqRow = rowById.get(prereqId);
      const prereqChange = powerChanges.find(c => c.id === prereqId);
      if (!prereqRow?.current && !prereqChange) warnings.push(`Не выполнено требование «${powerName(prereqId)}» для «${powerDisplayName(change.row.power)}».`);
    }
  }

  return { available, cost, left: available - cost, statChanges, skillChanges, powerChanges, warnings: [...new Set(warnings)] };
}

async function applyAdvancement(actor, result) {
  if (!result || result.cost <= 0) return false;
  const liveAvailable = Math.max(0, n(actor.system.details?.availableXp));
  if (result.cost > liveAvailable) {
    ui.notifications.warn(`Недостаточно XP: нужно ${result.cost}, в наличии ${liveAvailable}.`);
    return false;
  }

  const updates = {
    "system.details.availableXp": liveAvailable - result.cost,
    "system.details.spentXp": Math.max(0, n(actor.system.details?.spentXp)) + result.cost
  };
  for (const change of result.statChanges) updates[`system.stats.${change.key}`] = change.target;

  const customSkills = foundry.utils.deepClone(actor.system.skills?.custom ?? {});
  let customChanged = false;
  for (const change of result.skillChanges) {
    if (change.key.startsWith("custom:")) {
      const id = change.key.slice("custom:".length);
      if (customSkills[id]) {
        customSkills[id].value = change.target;
        customChanged = true;
      }
    } else if (SPECIAL_SKILLS.some(([key]) => key === change.key)) updates[`system.skills.${change.key}.value`] = change.target;
    else updates[`system.skills.${change.key}`] = change.target;
  }
  if (customChanged) updates["system.skills.custom"] = customSkills;

  const existingUpdates = [];
  const newItems = [];
  for (const change of result.powerChanges) {
    if (change.row.item) existingUpdates.push({ _id: change.row.item.id, "system.level": change.target });
    else {
      const data = powerToItemData(change.row.power);
      data.system.maxLevel = change.row.cap;
      data.system.level = change.target;
      newItems.push(data);
    }
  }

  const previousLevels = existingUpdates.map(update => ({
    _id: update._id,
    "system.level": n(actor.items.get(update._id)?.system?.level, 1)
  }));
  let createdItems = [];
  try {
    if (existingUpdates.length) await actor.updateEmbeddedDocuments("Item", existingUpdates);
    if (newItems.length) createdItems = await actor.createEmbeddedDocuments("Item", newItems);
    await actor.update(updates);
    ui.notifications.info(`Прокачка применена: потрачено ${result.cost} XP, осталось ${liveAvailable - result.cost} XP.`);
    return true;
  } catch (error) {
    console.error("Double Cross | advancement failed", error);
    try {
      if (createdItems.length) await actor.deleteEmbeddedDocuments("Item", createdItems.map(item => item.id));
      if (previousLevels.length) await actor.updateEmbeddedDocuments("Item", previousLevels);
    } catch (rollbackError) {
      console.error("Double Cross | advancement rollback failed", rollbackError);
    }
    ui.notifications.error(`Не удалось применить прокачку: ${error?.message ?? error}`);
    return false;
  }
}

export async function runCharacterAdvancement(actor) {
  if (!actor || actor.type !== "character") return null;
  const powerRows = advancementPowerRows(actor);
  const content = advancementContent(actor, powerRows);

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `Прокачка — ${actor.name}`, resizable: true },
    position: responsiveDialogPosition(1080, 820),
    content,
    buttons: [
      {
        action: "buy",
        label: "Купить улучшения",
        icon: "fa-solid fa-arrow-up-right-dots",
        default: true,
        callback: async (event, button, dialog) => collectTargets(dialog.element.querySelector(".dx3-advancement"), actor, powerRows)
      },
      { action: "cancel", label: "Отмена", icon: "fa-solid fa-xmark", callback: async () => null }
    ],
    rejectClose: false,
    render: (event, dialog) => {
      const root = dialog.element.querySelector(".dx3-advancement");
      if (!root) return;
      const buyButton = dialog.element.querySelector('button[data-action="buy"]');
      const search = root.querySelector("[data-adv-power-search]");

      const switchTab = name => {
        for (const button of root.querySelectorAll("[data-adv-tab]")) button.classList.toggle("active", button.dataset.advTab === name);
        for (const panel of root.querySelectorAll("[data-adv-panel]")) {
          const active = panel.dataset.advPanel === name;
          panel.classList.toggle("active", active);
          panel.hidden = !active;
        }
      };

      const filterPowers = () => {
        const q = String(search?.value ?? "").trim().toLocaleLowerCase("ru");
        for (const row of root.querySelectorAll("[data-adv-power-row]")) row.hidden = Boolean(q && !row.dataset.search.includes(q));
        for (const group of root.querySelectorAll("[data-adv-power-group]")) group.hidden = ![...group.querySelectorAll("[data-adv-power-row]")].some(row => !row.hidden);
      };

      const update = () => {
        const state = collectTargets(root, actor, powerRows);
        root.querySelector("[data-adv-cost]").textContent = String(state.cost);
        root.querySelector("[data-adv-left]").textContent = String(Math.max(0, state.left));
        const warning = root.querySelector("[data-adv-warning]");
        if (state.warnings.length) warning.textContent = state.warnings[0];
        else if (state.cost > state.available) warning.textContent = `Недостаточно XP: нужно ${state.cost}, в наличии ${state.available}.`;
        else if (state.cost <= 0) warning.textContent = "Выберите хотя бы одно улучшение.";
        else warning.textContent = `Будет потрачено ${state.cost} XP.`;
        warning.classList.toggle("error", state.warnings.length > 0 || state.cost > state.available);
        if (buyButton) buyButton.disabled = state.cost <= 0 || state.cost > state.available || state.warnings.length > 0;
      };

      root.addEventListener("click", async click => {
        const tab = click.target.closest("[data-adv-tab]");
        if (tab) {
          click.preventDefault();
          switchTab(tab.dataset.advTab);
          return;
        }
        const details = click.target.closest("[data-adv-power-details]");
        if (details) {
          click.preventDefault();
          click.stopPropagation();
          const row = powerRows.find(row => row.id === details.dataset.advPowerDetails);
          if (row) await showPowerDetails(row.power, { maxLevel: row.cap, prerequisiteNames: powerPrerequisites(row.power).map(powerName) });
        }
      });
      root.addEventListener("input", event2 => {
        if (event2.target.matches("[data-adv-power-search]")) filterPowers();
        else update();
      });
      root.addEventListener("change", update);
      filterPowers();
      update();
    }
  });

  if (!result) return null;
  return applyAdvancement(actor, result);
}
