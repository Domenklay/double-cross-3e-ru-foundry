// Double Cross 3rd basic-book catalog. Russian mechanical summaries are concise paraphrases for this fan implementation.
// Generated data is split into small source chunks for easier maintenance and version control.
import { POWER_DATA_01 } from "./powers-data-01.mjs";
import { POWER_DATA_02 } from "./powers-data-02.mjs";
import { POWER_DATA_03 } from "./powers-data-03.mjs";
import { POWER_DATA_04 } from "./powers-data-04.mjs";
import { POWER_DATA_05 } from "./powers-data-05.mjs";
import { POWER_DATA_06 } from "./powers-data-06.mjs";
import { POWER_DATA_07 } from "./powers-data-07.mjs";
import { POWER_DATA_08 } from "./powers-data-08.mjs";
import { POWER_DATA_09 } from "./powers-data-09.mjs";
import { POWER_DATA_10 } from "./powers-data-10.mjs";
import { POWER_DATA_11 } from "./powers-data-11.mjs";
import { POWER_DATA_12 } from "./powers-data-12.mjs";

export const POWER_CATALOG = [...POWER_DATA_01,...POWER_DATA_02,...POWER_DATA_03,...POWER_DATA_04,...POWER_DATA_05,...POWER_DATA_06,...POWER_DATA_07,...POWER_DATA_08,...POWER_DATA_09,...POWER_DATA_10,...POWER_DATA_11,...POWER_DATA_12];

export function powerDisplayName(p) {
  return p.ruName || "Безымянная способность";
}

export function powerPickerLabel(p) {
  return `${p.syndrome} — ${powerDisplayName(p)} [${p.source}]`;
}

export function powerToItemData(p) {
  const displayName = powerDisplayName(p);
  const status = p.configured
    ? '<p class="dx3-auto-note ready"><strong>Автоматизация:</strong> есть.</p>'
    : '<p class="dx3-auto-note manual"><strong>Автоматизация:</strong> нет — эффект применяется вручную.</p>';
  return {
    name: displayName,
    type: "power",
    img: p.img || "icons/svg/aura.svg",
    flags: { "double-cross-3e-ru": { libraryId: p.id } },
    system: {
      syndrome: p.syndrome,
      source: p.source,
      maxLevel: Number(p.maxLevel ?? 3),
      level: Number(p.level ?? 1),
      timing: p.timing ?? "—",
      skill: p.skill ?? "—",
      skillKey: p.skillKey ?? "none",
      difficulty: p.difficulty ?? "—",
      target: p.target ?? "—",
      range: p.range ?? "—",
      encroach: Number(p.encroach ?? 0),
      encroachFormula: p.encroachFormula ?? (p.encroach ? String(p.encroach) : "-"),
      restrict: p.restrict ?? "-",
      configured: Boolean(p.configured),
      automation: p.automation ?? "card",
      diceBonus: Number(p.diceBase ?? 0),
      dicePerLevel: Number(p.dicePerLevel ?? 0),
      critical: Number(p.critical ?? 10),
      criticalPerLevel: Number(p.criticalPerLevel ?? 0),
      scoreBonus: Number(p.scoreBase ?? 0),
      scorePerLevel: Number(p.scorePerLevel ?? 0),
      attackPower: String(p.attackBase ?? "0"),
      attackPerLevel: Number(p.attackPerLevel ?? 0),
      guardBonus: Number(p.guardBase ?? 0),
      guardPerLevel: Number(p.guardPerLevel ?? 0),
      uses: 0,
      maxUses: 0,
      notes: p.notes ?? "",
      description: `<p><strong>${p.syndrome}</strong> · ${p.source}</p><p>${p.descriptionRu ?? p.notes ?? ""}</p>${status}${(p.notes && p.notes !== p.descriptionRu) ? `<p class="dx3-card-note"><strong>Кратко:</strong> ${p.notes}</p>` : ""}`
    }
  };
}

export function findPowerByPickerLabel(label) {
  return POWER_CATALOG.find(p => powerPickerLabel(p) === label) ?? null;
}

export const POWER_COUNTS = Object.freeze({
  total: POWER_CATALOG.length,
  configured: POWER_CATALOG.filter(p => p.configured).length,
  catalogOnly: POWER_CATALOG.filter(p => !p.configured).length
});
