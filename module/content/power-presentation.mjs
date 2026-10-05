const esc = value => foundry.utils.escapeHTML(String(value ?? ""));

function showValue(value, fallback="—") {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s && s !== "-" ? s : fallback;
}

export function powerEncroachLabel(power) {
  const formula = showValue(power?.encroachFormula, "");
  if (formula) return formula;
  const value = Number(power?.encroach ?? 0);
  return Number.isFinite(value) && value !== 0 ? String(value) : "—";
}

export function powerEffectText(power) {
  const notes = String(power?.notes ?? "").trim();
  const description = String(power?.descriptionRu ?? "").trim();
  // Описание эффекта никогда не должно рассказывать игроку о состоянии
  // реализации модуля. Автоматизация показывается отдельной маленькой строкой.
  const implementationText = /(не автоматиз|точн(?:ая|ые) механик|точн(?:ые|ый) числов|настроить вручную|каталожн|смотрите? в книге|см\. книгу)/i;
  if (description && !implementationText.test(description)) return description;
  if (notes && !implementationText.test(notes)) return notes;
  return `«${power?.ruName || power?.name || "Эта способность"}» — особая техника синдрома «${power?.syndrome || "Общие"}».`;
}

export function powerRulesRows(power, {maxLevel=null}={}) {
  return [
    ["Макс. ур.", maxLevel ?? power?.maxLevel ?? "—"],
    ["Тайминг", showValue(power?.timing)],
    ["Навык", showValue(power?.skill)],
    ["Сложность", showValue(power?.difficulty)],
    ["Цель", showValue(power?.target)],
    ["Радиус", showValue(power?.range)],
    ["Вторжение", powerEncroachLabel(power)],
    ["Ограничения", showValue(power?.restrict)]
  ];
}

export function powerRulesGridHtml(power, options={}) {
  return `<div class="dx3-power-rules-grid">${powerRulesRows(power, options).map(([label,value]) => `<div><b>${esc(label)}</b><span>${esc(value)}</span></div>`).join("")}</div>`;
}

export function powerDetailHtml(power, {maxLevel=null, prerequisiteNames=[]}={}) {
  const effect = powerEffectText(power);
  const extraDescription = String(power?.descriptionRu ?? power?.notes ?? "").trim();
  const same = extraDescription === effect;
  return `<div class="dx3-power-detail">
    <header>
      <img src="${esc(power?.img || "icons/svg/aura.svg")}" alt="">
      <div>
        <h2>${esc(power?.ruName || power?.name || "Способность")}</h2>
        <p>${esc(power?.syndrome || "—")} · ${esc(power?.source || "—")}</p>
      </div>
    </header>
    ${powerRulesGridHtml(power,{maxLevel})}
    ${prerequisiteNames.length ? `<div class="dx3-power-prereq-full"><b>Требует:</b> ${prerequisiteNames.map(esc).join(" + ")}</div>` : ""}
    <section><h3>Эффект</h3><p>${esc(effect)}</p></section>
    ${(!same && extraDescription && !/(не автоматиз|точн(?:ая|ые) механик|точн(?:ые|ый) числов|настроить вручную|каталожн)/i.test(extraDescription)) ? `<section><h3>Пояснение</h3><p>${esc(extraDescription)}</p></section>` : ""}
    <p class="dx3-power-automation ${power?.configured ? "ready" : "manual"}"><i class="fa-solid ${power?.configured ? "fa-gears" : "fa-hand"}"></i> <b>Автоматизация:</b> ${power?.configured ? "есть" : "нет — эффект применяется вручную"}.</p>
  </div>`;
}

function responsivePosition(width=720, height=650) {
  const vw = Number(globalThis.innerWidth || width + 80);
  const vh = Number(globalThis.innerHeight || height + 100);
  return {
    width: Math.max(360, Math.min(width, vw - 48)),
    height: Math.max(360, Math.min(height, vh - 72))
  };
}

export async function showPowerDetails(power, options={}) {
  return foundry.applications.api.DialogV2.wait({
    window: { title: power?.ruName || power?.name || "Способность", icon: "fa-solid fa-book-open", resizable: true },
    position: responsivePosition(760, 700),
    content: powerDetailHtml(power, options),
    buttons: [{ action: "close", label: "Закрыть", icon: "fa-solid fa-xmark", default: true, callback: async () => true }],
    rejectClose: false
  });
}

export function responsiveDialogPosition(width=900, height=760) {
  const vw = Number(globalThis.innerWidth || width + 80);
  const vh = Number(globalThis.innerHeight || height + 100);
  const availW = Math.max(340, vw - 40);
  const availH = Math.max(340, vh - 64);
  return { width: Math.min(width, availW), height: Math.min(height, availH) };
}
