// ─── Parsers ──────────────────────────────────────────────────────────────────

/**
 * Strips non-numeric characters and returns an integer.
 * @param {string|number} value
 * @returns {number}
 */
export function parseNumeric(value) {
  return parseInt(String(value).replace(/\D/g, ''), 10) || 0;
}

/**
 * Returns a percentage clamped between 0 and 100.
 * @param {number} value
 * @param {number} total
 * @returns {number}
 */
export function clampPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

// ─── Battle report ────────────────────────────────────────────────────────────

/**
 * Derives the battle-report string from volume, HP target and PR count.
 * Pure function — no side effects.
 *
 * @param {{ volume: string|number, prs: number }} stats
 * @param {number} bossHp
 * @returns {string}
 */
export function getBattleReport(stats, bossHp) {
  const volume   = parseNumeric(stats.volume);
  const hpTarget = parseNumeric(bossHp) || 1;
  const damage   = clampPercent(volume, hpTarget);

  if (volume >= hpTarget && stats.prs > 0) {
    return `Aniquilação total. O alvo foi obliterado e ${stats.prs} recorde(s) absoluto(s) de força foram estabelecidos.`;
  }
  if (volume >= hpTarget) {
    return 'Eliminação confirmada. O alvo foi neutralizado com volume de fogo impecável. Excelente trabalho tático.';
  }
  if (damage >= 80) {
    return 'Danos críticos. O alvo sobreviveu por pouco e recuou. Exija mais de si mesmo na próxima investida.';
  }
  if (damage >= 50) {
    return 'Danos moderados confirmados. A missão foi completada, mas o alvo continua sendo uma ameaça.';
  }
  return 'Relatório de danos baixo. O volume tático foi insuficiente e o alvo escapou quase ileso. Comando exige retaliação.';
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Strips unit suffixes (e.g. "kg", "lbs") and keeps only digits, dots and commas.
 * Useful when the raw value already contains a unit and you need the bare number.
 *
 * @param {string|number} value
 * @returns {string}
 */
export function stripUnit(value) {
  return String(value).replace(/[^0-9.,]/g, '');
}

// ─── Training metrics ─────────────────────────────────────────────────────────

/**
 * Calculates training density (volume per minute).
 * Returns "0.0" when duration is zero to avoid division errors.
 *
 * @param {string|number} volume   - Total volume (may include unit suffix)
 * @param {string|number} duration - Duration string (e.g. "45min" or "45")
 * @returns {string}               - Formatted to one decimal place
 */
export function calcDensity(volume, duration) {
  const vol  = parseNumeric(volume);
  const durationText = String(duration ?? '').trim();
  const clockParts = durationText.match(/^(\d+):(\d{1,2})$/);
  const mins = clockParts
    ? Number(clockParts[1]) + (Number(clockParts[2]) / 60)
    : parseNumeric(durationText);
  if (!mins) return '0.0';
  return (vol / mins).toFixed(1);
}

// ─── XP / Level ───────────────────────────────────────────────────────────────

/**
 * Returns the XP required to reach the next level.
 * @param {number} currentLevel
 * @returns {number}
 */
export function xpForNextLevel(currentLevel) {
  return currentLevel * 1000;
}

/**
 * Returns level-progress as a percentage (0-100).
 * @param {number} totalXp
 * @param {number} currentLevel
 * @returns {number}
 */
export function levelProgressPercent(totalXp, currentLevel) {
  return clampPercent(totalXp, xpForNextLevel(currentLevel));
}

// ─── Share-card privacy controls ─────────────────────────────────────────────

export const SHARE_CARD_FIELD_KEYS = Object.freeze([
  'volume',
  'duration',
  'xp',
  'streak',
  'prs',
  'boss',
]);

/**
 * Creates a complete, predictable field-selection object for a Share Card.
 * Metrics that do not exist in the current session are disabled even if a
 * stale selection asks for them, preventing empty PR/Boss blocks.
 */
export function createShareCardFieldSelection({
  selection = {},
  hasPr = true,
  hasBoss = true,
} = {}) {
  const isSelected = (key) => selection[key] !== false;

  return {
    volume: isSelected('volume'),
    duration: isSelected('duration'),
    xp: isSelected('xp'),
    streak: isSelected('streak'),
    prs: hasPr && isSelected('prs'),
    boss: hasBoss && isSelected('boss'),
  };
}

export function toggleShareCardField(selection, field, availability = {}) {
  if (!SHARE_CARD_FIELD_KEYS.includes(field)) return selection;
  const normalized = createShareCardFieldSelection({ selection, ...availability });
  return createShareCardFieldSelection({
    selection: { ...normalized, [field]: !normalized[field] },
    ...availability,
  });
}

export function getShareCardGridClass(itemCount) {
  if (itemCount <= 1) return 'grid-cols-1';
  if (itemCount === 2) return 'grid-cols-2';
  return 'grid-cols-3';
}
