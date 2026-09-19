import { getRpgLevelProgress } from '../../utils/rpgProgressionModel';

export const SHARE_CARD_VARIANTS = Object.freeze({
  solo: 'solo',
  performance: 'performance',
});

export function normalizeShareCardVariant(value) {
  if (value === 'data') return SHARE_CARD_VARIANTS.performance;
  if (value === 'rpg') return SHARE_CARD_VARIANTS.solo;
  return Object.values(SHARE_CARD_VARIANTS).includes(value) ? value : SHARE_CARD_VARIANTS.solo;
}

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
  levelUp = false,
  levelProgress = null,
  newBadges = [],
  prs = 0,
  bossEncounter = null,
  fields = {},
} = {}) {
  if (levelUp && levelProgress && fields.xp !== false) {
    return { type: 'level', eyebrow: 'Level up', title: `Nível ${levelProgress.level}` };
  }
  const badge = Array.isArray(newBadges) ? newBadges[0] : null;
  if (badge) {
    return { type: 'badge', eyebrow: 'Conquista desbloqueada', title: badge.title || String(badge) };
  }
  const prCount = Math.max(0, Number(prs) || 0);
  if (prCount > 0 && fields.prs !== false) {
    return {
      type: 'pr',
      eyebrow: prCount === 1 ? 'Novo recorde' : `${prCount} novos recordes`,
      title: prCount === 1 ? 'Nova marca registrada' : 'Sessão histórica',
    };
  }
  if (bossEncounter?.defeated === true && fields.boss !== false) {
    return { type: 'boss', eyebrow: 'Boss derrotado', title: bossEncounter.bossName || 'Alvo neutralizado' };
  }
  return null;
}

export const SHARE_CARD_FIELD_KEYS = Object.freeze([
  'volume',
  'duration',
  'xp',
  'streak',
  'prs',
  'boss',
]);

export function createShareCardFieldSelection({
  selection = {},
  hasVolume = true,
  hasDuration = true,
  hasXp = true,
  hasStreak = true,
  hasPr = false,
  hasBoss = false,
} = {}) {
  const isSelected = (key) => selection[key] !== false;
  return {
    volume: hasVolume && isSelected('volume'),
    duration: hasDuration && isSelected('duration'),
    xp: hasXp && isSelected('xp'),
    streak: hasStreak && isSelected('streak'),
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
