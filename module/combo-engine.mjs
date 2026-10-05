import { clampCritical, numberValue as n, powerLevelBonus } from "./roll-engine.mjs";

const SYS = "double-cross-3e-ru";

const DIRECT_SKILL_LABELS = {
  melee: "Ближний бой",
  dodge: "Уклонение",
  ranged: "Дальний бой",
  perception: "Восприятие",
  rc: "РК",
  will: "Воля",
  negotiation: "Переговоры",
  procure: "Снабжение",
  ride1: "Вождение 1",
  ride2: "Вождение 2",
  art1: "Искусство 1",
  art2: "Искусство 2",
  knowledge1: "Знания 1",
  knowledge2: "Знания 2",
  info1: "Информация 1",
  info2: "Информация 2"
};

function uniq(values) { return [...new Set(values.filter(Boolean))]; }
function clean(value) { return String(value ?? "").trim(); }
function lower(value) { return clean(value).toLocaleLowerCase("ru"); }

function splitTiming(value) {
  const raw = clean(value);
  if (!raw || raw === "-") return [];
  return uniq(raw.split(/\s*[\/／,;]\s*/).map(clean));
}

function intersection(sets) {
  if (!sets.length) return [];
  let current = [...sets[0]];
  for (const set of sets.slice(1)) current = current.filter(v => set.includes(v));
  return uniq(current);
}

function union(...sets) { return uniq(sets.flat()); }

export function actorSkillOptions(actor) {
  const options = { ...DIRECT_SKILL_LABELS };
  const custom = actor?.system?.skills?.custom ?? {};
  const prefix = { ride: "Вождение", art: "Искусство", knowledge: "Знания", info: "Информация" };
  for (const [id, row] of Object.entries(custom)) {
    options[`custom:${id}`] = row?.name || prefix[row?.category] || "Доп. навык";
  }
  return options;
}

function actorSkillGroups(actor) {
  const custom = actor?.system?.skills?.custom ?? {};
  const customBy = { ride: [], art: [], knowledge: [], info: [] };
  for (const [id, row] of Object.entries(custom)) {
    if (customBy[row?.category]) customBy[row.category].push(`custom:${id}`);
  }
  const body = union(["melee", "dodge", "ride1", "ride2"], customBy.ride);
  const sense = union(["ranged", "perception", "art1", "art2"], customBy.art);
  const mind = union(["rc", "will", "knowledge1", "knowledge2"], customBy.knowledge);
  const social = union(["negotiation", "procure", "info1", "info2"], customBy.info);
  return {
    body, sense, mind, social,
    bodySense: union(body, sense),
    mindSocial: union(mind, social),
    combat: ["melee", "ranged"],
    rcNegotiation: ["rc", "negotiation"],
    ride: union(["ride1", "ride2"], customBy.ride),
    info: union(["info1", "info2"], customBy.info),
    none: ["none"]
  };
}

function powerSkillCandidates(actor, power) {
  const key = clean(power?.system?.skillKey || "none");
  const groups = actorSkillGroups(actor);
  const options = actorSkillOptions(actor);
  if (key === "syndrome") return { key, values: [], syndrome: true, manual: false };
  if (key === "special") return { key, values: Object.keys(options), syndrome: false, manual: true };
  if (groups[key]) return { key, values: groups[key], syndrome: false, manual: false };
  if (options[key]) return { key, values: [key], syndrome: false, manual: false };
  return { key, values: [], syndrome: false, manual: true };
}

function isNonCombinable(power) {
  const text = lower(`${power?.system?.description ?? ""} ${power?.system?.notes ?? ""}`)
    .replace(/<[^>]+>/g, " ");
  return /(не\s+комбиниру(?:ется|ются)|нельзя\s+комбинировать|не\s+может\s+комбинироваться|не\s+может\s+быть\s+(?:скомбинирован|объедин))/i.test(text);
}

function forbiddenPair(selected) {
  const names = selected.map(p => lower(p.name));
  const text = selected.map(p => lower(`${p?.system?.description ?? ""} ${p?.system?.notes ?? ""}`).replace(/<[^>]+>/g, " "));
  const concentrateIndex = names.findIndex(nm => nm.includes("концентрац"));
  if (concentrateIndex >= 0) {
    const blocker = text.findIndex(t => /нельзя\s+комбинировать\s+с\s+[«\"]?концентрац/i.test(t));
    if (blocker >= 0) return `«${selected[blocker].name}» нельзя комбинировать с «Концентрацией».`;
  }
  return null;
}

function attackKind(power) {
  const key = clean(power?.system?.skillKey);
  const text = lower(`${power?.system?.description ?? ""} ${power?.system?.notes ?? ""}`).replace(/<[^>]+>/g, " ");
  const melee = key === "melee" || /(?:соверш|выполн).{0,20}(?:ближн|рукопашн).{0,12}атак/i.test(text);
  const ranged = key === "ranged" || /(?:соверш|выполн).{0,20}(?:дальн|стрелков).{0,12}атак/i.test(text);
  if (melee && !ranged) return "melee";
  if (ranged && !melee) return "ranged";
  return null;
}

function reactionKind(power) {
  const text = lower(`${power?.system?.description ?? ""} ${power?.system?.notes ?? ""}`).replace(/<[^>]+>/g, " ");
  if (/(?:выполн|соверш).{0,16}(?:уклон|уворот)/i.test(text)) return "dodge";
  if (/(?:выполн|соверш).{0,16}(?:защит|блок)/i.test(text)) return "guard";
  return null;
}

function effectiveLevel(power, rate) {
  return Math.max(0, n(power?.system?.level)) + powerLevelBonus(rate);
}

function normalizeFormula(value, fallback = "0") {
  const raw = clean(value || fallback);
  if (!raw || raw === "-") return null;
  if (/^(?:особое|ссылка|refer)$/i.test(raw)) return null;
  return raw.replace(/\bD(?=\d|$)/gi, "d").replace(/\bLV\b/gi, "@level").replace(/\bУР\.?\b/gi, "@level");
}

function injectLevel(formula, level) {
  return String(formula).replace(/@level\b/gi, String(Math.max(0, n(level))));
}

function sumFormula(parts, fallback = "0") {
  const filtered = parts.map(clean).filter(p => p && p !== "0" && p !== "+0" && p !== "(0)");
  return filtered.length ? filtered.map(p => `(${p})`).join("+") : fallback;
}

function powerAttackPart(power, level) {
  const base = normalizeFormula(power?.system?.attackPower, "0") ?? "0";
  const resolved = injectLevel(base, level);
  const per = n(power?.system?.attackPerLevel);
  return per ? sumFormula([resolved, `${per * level}`]) : resolved;
}

function powerEncroachPart(power, level) {
  const raw = clean(power?.system?.encroachFormula);
  const fallback = clean(power?.system?.encroach);
  const selected = raw && !(raw === "0" && n(fallback) > 0) ? raw : fallback;
  const normalized = normalizeFormula(selected, "0");
  if (!normalized) return { formula: null, display: selected || "0", unresolved: Boolean(selected && selected !== "0" && selected !== "-") };
  return { formula: injectLevel(normalized, level), display: injectLevel(normalized, level), unresolved: false };
}

function targetRank(value) {
  const raw = lower(value);
  if (!raw || raw === "-" || raw.includes("ссылка") || raw.includes("refer")) return null;
  if (raw.includes("на себя") || raw === "self") return 1;
  if (raw.includes("одна") || raw.includes("одиноч") || raw === "single" || /(?:^|\s)1\s*(?:цель|существ|персонаж)/i.test(raw)) return 2;
  if (/\b\d+\b/.test(raw) || raw.includes("тела") || raw.includes("цели")) return 3;
  if (raw.includes("зона") || raw.includes("area")) return 4;
  if (raw.includes("сцена") || raw.includes("scene")) return 5;
  return 3;
}

function resolveTarget(powers, requested = "") {
  const rows = powers.map(p => ({ value: clean(p.system.target), rank: targetRank(p.system.target) })).filter(r => r.rank != null);
  if (!rows.length) return { value: "-", options: ["-"] };
  const min = Math.min(...rows.map(r => r.rank));
  const options = uniq(rows.filter(r => r.rank === min).map(r => r.value));
  const wanted = clean(requested);
  return { value: options.includes(wanted) ? wanted : (options[0] || "-"), options };
}

function rangeInfo(value) {
  const raw = clean(value), l = lower(raw);
  if (!raw || raw === "-" || l.includes("ссылка") || l.includes("refer")) return null;
  if (l.includes("вплотную") || l.includes("близк") || l === "close") return { rank: 0, distance: 0, value: raw };
  const meters = l.match(/(-?\d+(?:[.,]\d+)?)\s*(?:м|метр)/);
  if (meters) return { rank: 1, distance: Number(meters[1].replace(",", ".")), value: raw };
  if (l.includes("оружие") || l === "weapon") return { rank: 1.5, distance: null, value: raw, weapon: true };
  if (l.includes("поле зрения") || l.includes("видимости") || l === "view") return { rank: 2, distance: Infinity, value: raw };
  return { rank: 1.5, distance: null, value: raw };
}

function narrowRange(powers, weapon = null) {
  const rows = [];
  for (const power of powers) {
    let info = rangeInfo(power.system.range);
    if (info?.weapon && weapon) info = rangeInfo(weapon.system?.range) ?? info;
    if (info) rows.push(info);
  }
  if (!rows.length) return "-";
  rows.sort((a, b) => a.rank - b.rank || (a.distance ?? Infinity) - (b.distance ?? Infinity));
  return rows[0].value || "-";
}

function difficultyRank(value) {
  const raw = lower(value);
  if (!raw || raw === "-") return { kind: "none", rank: -1, value: clean(value) || "-" };
  if (raw.includes("против") || raw.includes("встреч") || raw.includes("opposed")) return { kind: "opposed", rank: 100000, value: clean(value) };
  if (raw.includes("авто") || raw.includes("auto")) return { kind: "auto", rank: 0, value: clean(value) };
  const match = raw.match(/\d+/);
  if (match) return { kind: "number", rank: Number(match[0]), value: clean(value) };
  return { kind: "other", rank: 1, value: clean(value) };
}

function hardestDifficulty(powers) {
  const rows = powers.map(p => difficultyRank(p.system.difficulty));
  if (rows.some(r => r.kind === "opposed")) return rows.find(r => r.kind === "opposed").value || "Противостояние";
  const meaningful = rows.filter(r => r.kind !== "none" && r.kind !== "auto");
  if (meaningful.length) return meaningful.sort((a,b) => b.rank - a.rank)[0].value;
  if (rows.some(r => r.kind === "auto")) return rows.find(r => r.kind === "auto").value || "Авто";
  return "-";
}

function restrictionThreshold(restrict) {
  const match = clean(restrict).match(/(80|100|120)\s*%/);
  return match ? Number(match[1]) : null;
}

function readableFormula(formula) {
  return clean(formula).replace(/\)\+\(/g, ") + (");
}

function comboPowerIds(combo) {
  const raw = combo?.system?.powerIds;
  if (Array.isArray(raw)) return uniq(raw.map(String));
  try {
    const parsed = JSON.parse(clean(raw) || "[]");
    return Array.isArray(parsed) ? uniq(parsed.map(String)) : [];
  } catch { return []; }
}

export function selectedComboPowers(actor, comboOrIds) {
  const ids = Array.isArray(comboOrIds) ? comboOrIds.map(String) : comboPowerIds(comboOrIds);
  return ids.map(id => actor?.items?.get?.(id)).filter(item => item?.type === "power");
}

function deriveSkill(actor, powers, requestedSkillKey = "") {
  const errors = [], warnings = [];
  if (!powers.length) return { candidates: [], selected: "none", label: "—", errors, warnings };
  const descriptors = powers.map(p => ({ power: p, ...powerSkillCandidates(actor, p) }));
  const hasNone = descriptors.some(d => d.key === "none");
  if (hasNone && descriptors.some(d => d.key !== "none")) {
    errors.push("Способности с навыком «-» можно комбинировать только с другими способностями с навыком «-».");
    return { candidates: [], selected: "none", label: "—", errors, warnings };
  }
  if (hasNone) return { candidates: ["none"], selected: "none", label: "—", errors, warnings };

  const concrete = descriptors.filter(d => !d.syndrome && !d.manual && d.values.length);
  const manual = descriptors.filter(d => d.manual);
  let candidates = concrete.length ? intersection(concrete.map(d => d.values)) : [];
  if (!concrete.length && manual.length) candidates = Object.keys(actorSkillOptions(actor));
  if (concrete.length && manual.length) warnings.push("В комбинации есть способность с навыком «См. эффект»: совместимость её навыка необходимо проверить вручную.");
  if (concrete.length && !candidates.length) errors.push("У выбранных способностей нет общего навыка для одной проверки.");

  for (const descriptor of descriptors.filter(d => d.syndrome)) {
    const syndrome = lower(descriptor.power.system.syndrome);
    const anchors = descriptors.filter(d => d.power.id !== descriptor.power.id && !d.syndrome && !d.manual && lower(d.power.system.syndrome) === syndrome && d.values.length);
    if (!anchors.length) {
      errors.push(`«${descriptor.power.name}» имеет «Навык: Синдром» и требует в комбинации способность того же синдрома с конкретным навыком.`);
      continue;
    }
    const anchorSkills = union(...anchors.map(a => a.values));
    candidates = candidates.length ? candidates.filter(skill => anchorSkills.includes(skill)) : anchorSkills;
  }

  candidates = uniq(candidates);
  if (!candidates.length && !errors.length) errors.push("Не удалось определить навык комбинации.");
  let selected = clean(requestedSkillKey);
  if (!candidates.includes(selected)) selected = candidates[0] || "none";
  const labels = actorSkillOptions(actor);
  return { candidates, selected, label: labels[selected] || (selected === "none" ? "—" : selected), errors, warnings };
}

export function analyzeCombo(actor, comboOrIds, { rate = null, skillKey = null, timing = null, weaponId = null } = {}) {
  const powers = selectedComboPowers(actor, comboOrIds);
  const ids = powers.map(p => p.id);
  const comboSystem = Array.isArray(comboOrIds) ? {} : (comboOrIds?.system ?? {});
  const currentRate = rate == null ? n(actor?.system?.encroachment?.value) : n(rate);
  const errors = [], warnings = [];

  if (powers.length < 2) errors.push("Для комбо выберите минимум две способности.");
  const nonCombinable = powers.filter(isNonCombinable);
  if (nonCombinable.length) errors.push(`${nonCombinable.map(p => `«${p.name}»`).join(", ")} нельзя включать в комбинацию.`);
  const pairError = forbiddenPair(powers);
  if (pairError) errors.push(pairError);

  const timingSets = powers.map(p => splitTiming(p.system.timing));
  const timingOptions = timingSets.length ? intersection(timingSets) : [];
  if (powers.length && !timingOptions.length) errors.push("У выбранных способностей нет общего тайминга.");
  let selectedTiming = clean(timing ?? comboSystem.timing);
  if (!timingOptions.includes(selectedTiming)) selectedTiming = timingOptions[0] || "-";

  const skill = deriveSkill(actor, powers, skillKey ?? comboSystem.skillKey);
  errors.push(...skill.errors);
  warnings.push(...skill.warnings);

  const attackKinds = uniq(powers.map(attackKind));
  if (attackKinds.includes("melee") && attackKinds.includes("ranged")) errors.push("Силы, выполняющие ближнюю и дальнюю атаку, нельзя объединять в одну комбинацию.");
  const reactionKinds = uniq(powers.map(reactionKind));
  if (reactionKinds.includes("dodge") && reactionKinds.includes("guard")) errors.push("Уклонение и Защиту нельзя объединять в одну реакцию.");

  const chosenWeaponId = clean(weaponId ?? comboSystem.weaponId);
  const requiresWeaponRange = powers.some(power => rangeInfo(power.system.range)?.weapon);
  const matchingEquippedWeapons = actor?.items?.filter?.(candidate =>
    candidate.type === "weapon" &&
    candidate.system?.equipped &&
    (skill.selected === "none" || clean(candidate.system?.skillKey) === skill.selected)
  ) ?? [];

  // По правилам Range: Weapon использует дальность текущего экипированного оружия.
  // Явный выбор в карточке комбо имеет приоритет; иначе подхватываем единственное
  // подходящее экипированное оружие, чтобы игроку не приходилось выбирать его заново.
  let weapon = chosenWeaponId ? actor?.items?.get?.(chosenWeaponId) : null;
  if (!weapon && requiresWeaponRange && matchingEquippedWeapons.length === 1) weapon = matchingEquippedWeapons[0];
  if (!weapon && requiresWeaponRange && matchingEquippedWeapons.length > 1) {
    warnings.push("Для дальности «Оружие» экипировано несколько подходящих оружий — выберите нужное в карточке комбо.");
  }
  if (!weapon && requiresWeaponRange && matchingEquippedWeapons.length === 0) {
    errors.push("Комбинация использует дальность «Оружие», но подходящее экипированное оружие не найдено.");
  }
  if (weapon && weapon.type !== "weapon") warnings.push("Выбранный для комбо предмет больше не является оружием.");
  if (weapon && skill.selected !== "none") {
    const weaponKey = clean(weapon.system.skillKey);
    const allowed = weaponKey === skill.selected;
    if (!allowed) warnings.push(`Оружие «${weapon.name}» использует другой навык и не добавлено к расчёту атаки.`);
  }
  const usableWeapon = weapon && weapon.type === "weapon" && (skill.selected === "none" || clean(weapon.system.skillKey) === skill.selected) ? weapon : null;
  const guardWeapon = weapon && weapon.type === "weapon" && reactionKinds.includes("guard") ? weapon : null;

  const levels = new Map(powers.map(p => [p.id, effectiveLevel(p, currentRate)]));
  let diceBonus = 0, scoreBonus = 0, criticalDelta = 0, guardValue = 0;
  const attackParts = [], costParts = [], unresolvedCosts = [];
  for (const power of powers) {
    const level = levels.get(power.id) ?? 0;
    diceBonus += n(power.system.diceBonus) + n(power.system.dicePerLevel) * level;
    scoreBonus += n(power.system.scoreBonus) + n(power.system.scorePerLevel) * level;
    criticalDelta += (n(power.system.critical, 10) + n(power.system.criticalPerLevel) * level) - 10;
    const attack = powerAttackPart(power, level);
    if (attack && attack !== "0") attackParts.push(attack);
    guardValue += n(power.system.guardBonus) + n(power.system.guardPerLevel) * level;
    const cost = powerEncroachPart(power, level);
    if (cost.formula) costParts.push(cost.formula);
    else if (cost.unresolved) unresolvedCosts.push(`${power.name}: ${cost.display}`);

    const threshold = restrictionThreshold(power.system.restrict);
    if (threshold && currentRate < threshold) errors.push(`«${power.name}» требует Вторжение ${threshold}% или выше.`);
    if (n(power.system.maxUses) > 0 && n(power.system.uses) <= 0) errors.push(`У «${power.name}» не осталось использований.`);
  }

  if (usableWeapon) {
    scoreBonus += n(usableWeapon.system.accuracy);
    const formula = normalizeFormula(usableWeapon.system.attackPower, "0");
    if (formula && formula !== "0") attackParts.unshift(formula);
  }
  if (guardWeapon) guardValue += n(guardWeapon.system.guard);

  const critical = clampCritical(10 + criticalDelta);
  const attackFormula = sumFormula(attackParts, "0");
  const encroachFormula = sumFormula(costParts, "0");
  const difficulty = hardestDifficulty(powers);
  const targetResolution = resolveTarget(powers, comboSystem.target);
  const target = targetResolution.value;
  const range = narrowRange(powers, usableWeapon);

  if (unresolvedCosts.length) warnings.push(`Часть стоимости Вторжения требует ручного ввода: ${unresolvedCosts.join("; ")}.`);
  const combinedText = lower(powers.map(p => `${p.system.description ?? ""} ${p.system.notes ?? ""}`).join(" ")).replace(/<[^>]+>/g, " ");
  if (/(?:измен|увелич|расшир).{0,28}(?:цель|количеств.{0,8}цел)/i.test(combinedText)) warnings.push("Одна из способностей меняет цель комбинации: итоговое число целей проверьте по её тексту — специальное правило может переопределять обычное сужение цели.");
  if (/(?:измен|увелич|расшир).{0,28}(?:дальност|дистанц|радиус)/i.test(combinedText)) warnings.push("Одна из способностей меняет дальность: специальное правило из текста карточки имеет приоритет над обычным выбором самой короткой дальности.");
  if (powers.length && !powers.some(p => ["attack", "check"].includes(clean(p.system.automation)))) warnings.push("Эффект комбинации в основном остаётся карточкой: проверьте текст выбранных способностей после броска.");

  const labels = actorSkillOptions(actor);
  const skillOptions = skill.candidates.map(value => ({ value, label: labels[value] || (value === "none" ? "—" : value) }));
  const attackType = attackKinds.includes("melee") ? "Ближняя атака" : attackKinds.includes("ranged") ? "Дальняя атака" : "Проверка / эффект";

  return {
    valid: errors.length === 0,
    errors: uniq(errors),
    warnings: uniq(warnings),
    powers,
    powerIds: ids,
    levels,
    rate: currentRate,
    levelBonus: powerLevelBonus(currentRate),
    timingOptions,
    timing: selectedTiming,
    skillOptions,
    skillKey: skill.selected,
    skill: skill.label,
    difficulty,
    target,
    targetOptions: targetResolution.options,
    range,
    encroachFormula,
    encroachDisplay: unresolvedCosts.length ? `${readableFormula(encroachFormula)} + вручную` : readableFormula(encroachFormula),
    unresolvedCosts,
    diceBonus,
    critical,
    scoreBonus,
    attackFormula: readableFormula(attackFormula),
    guardValue,
    attackType,
    weapon: usableWeapon,
    selectedWeapon: weapon,
    summary: `${diceBonus >= 0 ? "+" : ""}${diceBonus} куб. · крит ${critical} · результат ${scoreBonus >= 0 ? "+" : ""}${scoreBonus} · сила ${readableFormula(attackFormula)} · защита ${guardValue}`
  };
}

export function comboPowerIdsFromItem(combo) { return comboPowerIds(combo); }

export function comboPreviewBands(actor, comboOrIds, options = {}) {
  return [
    { key: "under", label: "0–99%", rate: 99 },
    { key: "over", label: "100–159%", rate: 100 },
    { key: "high", label: "160%+", rate: 160 }
  ].map(band => ({ ...band, analysis: analyzeCombo(actor, comboOrIds, { ...options, rate: band.rate }) }));
}

export function comboRulesText() {
  return {
    timing: "Все способности комбинации должны иметь общий тайминг.",
    skill: "Обычно нужен общий навык. «Навык: Синдром» берёт навык другой способности того же синдрома; «-» комбинируется только с «-».",
    target: "Итоговая цель сужается до наиболее ограниченной.",
    range: "Итоговая дальность становится самой короткой; «Оружие» использует дальность экипированного оружия (или выбранного вручную в карточке комбо).",
    difficulty: "Берётся наиболее высокая сложность; Противостояние имеет приоритет, Авто подчиняется остальным.",
    encroach: "Стоимость Вторжения всех использованных способностей складывается.",
    attack: "Бонусы силы атаки совместимых атак складываются; ближнюю и дальнюю атаку объединять нельзя.",
    reaction: "Уклонение и Защиту нельзя объединять в одну реакцию. Бонусы Guard совместимых защитных эффектов складываются."
  };
}

export { isNonCombinable };
