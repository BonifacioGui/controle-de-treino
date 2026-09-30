const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const isValidParts = (year, month, day) => {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
};
const toDateKey = (year, month, day) => {
  if (!isValidParts(year, month, day)) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getLocalDateKey = (date = new Date(), timeZone) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;

  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const part = (type) => Number(parts.find((item) => item.type === type)?.value);
    return toDateKey(part('year'), part('month'), part('day'));
  }

  return toDateKey(value.getFullYear(), value.getMonth() + 1, value.getDate());
};

export const normalizeLocalDateKey = (value) => {
  if (!value) return null;
  if (value instanceof Date) return getLocalDateKey(value);

  const text = String(value).trim();
  const dateKeyMatch = text.match(DATE_KEY_PATTERN);
  if (dateKeyMatch) {
    return toDateKey(Number(dateKeyMatch[1]), Number(dateKeyMatch[2]), Number(dateKeyMatch[3]));
  }

  const brMatch = text.match(BR_DATE_PATTERN);
  if (brMatch) {
    return toDateKey(Number(brMatch[3]), Number(brMatch[2]), Number(brMatch[1]));
  }

  const timestampDate = text.includes('T') ? text.split('T')[0] : null;
  if (timestampDate && DATE_KEY_PATTERN.test(timestampDate)) {
    return normalizeLocalDateKey(timestampDate);
  }

  return null;
};

export const parseLocalDateKey = (dateKey) => {
  const normalized = normalizeLocalDateKey(dateKey);
  if (!normalized) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

export const formatLocalDate = (dateKey, options = {}) => {
  const date = parseLocalDateKey(dateKey);
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(date);
};

const utcDayNumber = (dateKey) => {
  const normalized = normalizeLocalDateKey(dateKey);
  if (!normalized) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};

export const daysBetweenLocalDates = (fromDateKey, toDateKey) => {
  const from = utcDayNumber(fromDateKey);
  const to = utcDayNumber(toDateKey);
  if (from === null || to === null) return null;
  return to - from;
};

export const isSameLocalDay = (left, right) => {
  const leftKey = left instanceof Date ? getLocalDateKey(left) : normalizeLocalDateKey(left);
  const rightKey = right instanceof Date ? getLocalDateKey(right) : normalizeLocalDateKey(right);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
};

export const formatDayCount = (value) => {
  const count = Math.max(0, Number(value) || 0);
  return `${count} ${count === 1 ? 'dia' : 'dias'}`;
};
