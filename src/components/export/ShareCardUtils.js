import { getRpgLevelProgress } from '../../utils/rpgProgressionModel';

export const SHARE_CARD_MAX_METRICS = 3;
export const SHARE_CARD_METRIC_KEYS = Object.freeze(['duration', 'xp', 'streak', 'sets', 'density']);
export const SHARE_CARD_HIGHLIGHT_KEYS = Object.freeze(['auto', 'level', 'badge', 'pr', 'boss', 'none']);

export function parseMetricNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value ?? '').trim().replace(/\s/g, '').replace(/[^0-9.,-]/g, '');
  if (!text) return null;

  const commaIndex = text.lastIndexOf(',');
  const dotIndex = text.lastIndexOf('.');
  let normalized = text;

  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;
    normalized = text.replace(thousandsSeparator, '').replace(decimalSeparator, '.');
  } else if (commaIndex >= 0) {
    normalized = /^-?\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
  } else if (dotIndex >= 0) {
    normalized = /^-?\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, '') : text;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseNumeric(value) {
  return Math.max(0, Math.round(parseMetricNumber(value) ?? 0));
}

export function parseDurationSeconds(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;

  const clock = text.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?(?:\s*(?:min|mins|minutos?))?$/);
  if (clock) {
    if (clock[3] !== undefined) {
      const hours = Number(clock[1]);
      const minutes = Number(clock[2]);
      const seconds = Number(clock[3]);
      if (minutes > 59 || seconds > 59) return null;
      return (hours * 3600) + (minutes * 60) + seconds;
    }
    const minutes = Number(clock[1]);
    const seconds = Number(clock[2]);
    if (seconds > 59) return null;
    return (minutes * 60) + seconds;
  }

  const hoursMatch = text.match(/(\d+(?:[.,]\d+)?)\s*h/);
  const minutesMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:min|mins|minutos?)/);
  const secondsMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:s|seg|segs|segundos?)/);
  if (hoursMatch || minutesMatch || secondsMatch) {
    const hours = parseMetricNumber(hoursMatch?.[1]) ?? 0;
    const minutes = parseMetricNumber(minutesMatch?.[1]) ?? 0;
    const seconds = parseMetricNumber(secondsMatch?.[1]) ?? 0;
    return Math.max(0, (hours * 3600) + (minutes * 60) + seconds);
  }

  const numeric = parseMetricNumber(text);
  return numeric === null || numeric < 0 ? null : numeric;
}

export function formatShareDuration(value) {
  const totalSeconds = parseDurationSeconds(value);
  if (totalSeconds === null) return null;
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) return `${hours}H ${String(minutes).padStart(2, '0')}MIN`;
  if (seconds > 0) return `${Math.floor(rounded / 60)}:${String(seconds).padStart(2, '0')}`;
  return `${Math.floor(rounded / 60)} MIN`;
}

export function formatShareVolume(value) {
  const volume = parseMetricNumber(value);
  if (volume === null) return null;
  return Math.max(0, volume).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export function stripUnit(value) {
  return formatShareVolume(value) || '';
}

export function calcDensity(volume, duration) {
  const parsedVolume = parseMetricNumber(volume);
  const durationSeconds = parseDurationSeconds(duration);
  if (parsedVolume === null || durationSeconds === null || durationSeconds <= 0) return null;
  return (parsedVolume / (durationSeconds / 60)).toFixed(1);
}

export function getShareCardLevelProgress(totalXp) {
  if (totalXp === null || totalXp === undefined || totalXp === '') return null;
  const numericXp = Number(totalXp);
  if (!Number.isFinite(numericXp) || numericXp < 0) return null;
  return getRpgLevelProgress(numericXp);
}

export function resolveShareCardHighlight({
  selection = 'auto',
  levelUp = false,
  levelProgress = null,
  newBadges = [],
  prs = 0,
  bossEncounter = null,
} = {}) {
  const badge = Array.isArray(newBadges) ? newBadges[0] : null;
  const prCount = Math.max(0, Number(prs) || 0);
  const highlights = {
    level: levelUp && levelProgress
      ? { type: 'level', eyebrow: 'Level up', title: `Nível ${levelProgress.level}` }
      : null,
    badge: badge
      ? { type: 'badge', eyebrow: 'Conquista desbloqueada', title: badge.title || String(badge) }
      : null,
    pr: prCount > 0 ? {
      type: 'pr',
      eyebrow: prCount === 1 ? 'Novo recorde' : `${prCount} novos recordes`,
      title: prCount === 1 ? 'Nova marca registrada' : 'Sessão histórica',
    } : null,
    boss: bossEncounter?.defeated === true
      ? { type: 'boss', eyebrow: 'Boss derrotado', title: bossEncounter.bossName || 'Alvo neutralizado' }
      : null,
  };

  if (selection === 'none') return null;
  if (selection !== 'auto') return highlights[selection] || null;
  return highlights.level || highlights.badge || highlights.pr || highlights.boss || null;
}

export function getAvailableShareCardHighlights({
  levelUp = false,
  levelProgress = null,
  newBadges = [],
  prs = 0,
  bossEncounter = null,
} = {}) {
  return SHARE_CARD_HIGHLIGHT_KEYS.filter((key) => (
    key === 'auto'
    || key === 'none'
    || resolveShareCardHighlight({ selection: key, levelUp, levelProgress, newBadges, prs, bossEncounter })
  ));
}

export function createShareCardMetricSelection({
  selection = {},
  hasDuration = true,
  hasXp = true,
  hasStreak = true,
  hasSets = false,
  hasDensity = false,
} = {}) {
  const availability = { duration: hasDuration, xp: hasXp, streak: hasStreak, sets: hasSets, density: hasDensity };
  const hasExplicitSelection = Object.keys(selection || {}).some((key) => SHARE_CARD_METRIC_KEYS.includes(key));
  const defaultSelection = { duration: true, xp: true, streak: true };
  let selectedCount = 0;

  return SHARE_CARD_METRIC_KEYS.reduce((result, key) => {
    const requested = hasExplicitSelection ? selection[key] === true : defaultSelection[key] === true;
    const selected = Boolean(availability[key] && requested && selectedCount < SHARE_CARD_MAX_METRICS);
    if (selected) selectedCount += 1;
    result[key] = selected;
    return result;
  }, {});
}

export function getSelectedShareCardMetricKeys(selection = {}) {
  return SHARE_CARD_METRIC_KEYS.filter((key) => selection[key] === true).slice(0, SHARE_CARD_MAX_METRICS);
}

export function toggleShareCardMetric(selection, metric, availability = {}) {
  const normalized = createShareCardMetricSelection({ selection, ...availability });
  if (!SHARE_CARD_METRIC_KEYS.includes(metric)) return { selection: normalized, limitReached: false };
  if (normalized[metric]) {
    return {
      selection: createShareCardMetricSelection({ selection: { ...normalized, [metric]: false }, ...availability }),
      limitReached: false,
    };
  }
  if (getSelectedShareCardMetricKeys(normalized).length >= SHARE_CARD_MAX_METRICS) {
    return { selection: normalized, limitReached: true };
  }
  return {
    selection: createShareCardMetricSelection({ selection: { ...normalized, [metric]: true }, ...availability }),
    limitReached: false,
  };
}

export async function waitForShareCardImages(node) {
  const images = [...(node?.querySelectorAll?.('img') || [])];
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
}
