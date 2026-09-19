export const normalizeDecimalInput = (value) => String(value ?? '')
  .trim()
  .replace(/\s/g, '')
  .replace(',', '.');

export const parseDecimalInput = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = normalizeDecimalInput(value);
  if (!normalized || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
export const parseNonNegativeDecimal = (value) => {
  const parsed = parseDecimalInput(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
};

export const parsePositiveInteger = (value) => {
  const parsed = parseDecimalInput(value);
  return parsed !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
