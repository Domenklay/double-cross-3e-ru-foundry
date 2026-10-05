export function numberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clampCritical(value) {
  return Math.max(2, Math.min(10, Math.trunc(numberValue(value, 10))));
}

export function encroachmentDiceBonus(rate) {
  rate = numberValue(rate, 0);
  if (rate >= 300) return 8;
  if (rate >= 240) return 7;
  if (rate >= 200) return 6;
  if (rate >= 160) return 5;
  if (rate >= 130) return 4;
  if (rate >= 100) return 3;
  if (rate >= 80) return 2;
  if (rate >= 60) return 1;
  return 0;
}

export function powerLevelBonus(rate) {
  rate = numberValue(rate, 0);
  if (rate >= 160) return 2;
  if (rate >= 100) return 1;
  return 0;
}

/** Pure scoring helper used by tests and documentation examples. */
export function scoreDX3Stages(stages, critical = 10, flat = 0) {
  const crit = clampCritical(critical);
  const normalized = (stages ?? []).map(stage => (stage ?? []).map(v => numberValue(v)).filter(v => v >= 1 && v <= 10));
  if (!normalized.length || !normalized[0].length) return { score: 0, fumble: false, criticalCount: 0 };
  if (normalized[0].every(v => v === 1)) return { score: 0, fumble: true, criticalCount: 0 };

  let base = 0;
  let criticalCount = 0;
  for (let i = 0; i < normalized.length; i++) {
    const results = normalized[i];
    if (!results.length) break;
    const criticalDice = results.filter(v => v >= crit);
    if (criticalDice.length && i < normalized.length - 1) {
      base += 10;
      criticalCount += 1;
      continue;
    }
    if (criticalDice.length && i === normalized.length - 1) {
      // The caller did not provide the required next critical stage; treat this stage as unresolved.
      base += 10;
      criticalCount += 1;
      continue;
    }
    base += Math.max(...results);
    break;
  }
  return { score: base + numberValue(flat), fumble: false, criticalCount };
}

export function damageDiceFromAccuracy(score) {
  return Math.max(1, 1 + Math.floor(Math.max(0, numberValue(score)) / 10));
}
