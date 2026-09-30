import { parseNonNegativeDecimal } from './numberUtils';
import { calculateSessionVolume } from './gameLogic';

export const OVERLOAD_STATUS = Object.freeze({
  baseline: 'NORMAL',
  overload: 'OVERLOAD',
  maintenance: 'MANUTENÇÃO',
  reduction: 'REDUÇÃO',
});

const VOLUME_COMPARISON_EPSILON_KG = 0.01;

const STATUS_ALIASES = Object.freeze({
  NORMAL: OVERLOAD_STATUS.baseline,
  OVERLOAD: OVERLOAD_STATUS.overload,
  'MANUTENÇÃO': OVERLOAD_STATUS.maintenance,
  MANUTENCAO: OVERLOAD_STATUS.maintenance,
  'REDUÇÃO': OVERLOAD_STATUS.reduction,
  REDUCAO: OVERLOAD_STATUS.reduction,
});

export const normalizeOverloadStatus = (status) => {
  const normalized = String(status ?? '').trim().toUpperCase();
  return STATUS_ALIASES[normalized] || OVERLOAD_STATUS.baseline;
};

export const isOverloadStatus = (status) => (
  normalizeOverloadStatus(status) === OVERLOAD_STATUS.overload
);

export const getComparableSessionVolume = (session) => {
  if (!session || typeof session !== 'object') return null;
  const storedVolume = parseNonNegativeDecimal(session.totalVolume ?? session.total_volume);
  if (storedVolume !== null && storedVolume > 0) return storedVolume;
  const calculatedVolume = parseNonNegativeDecimal(calculateSessionVolume(session));
  return calculatedVolume !== null && calculatedVolume > 0 ? calculatedVolume : null;
};

export const findPreviousComparableVolume = (sessions = []) => {
  if (!Array.isArray(sessions)) return null;
  for (const session of sessions) {
    const volume = getComparableSessionVolume(session);
    if (volume !== null) return volume;
  }
  return null;
};

export const classifyVolumeProgress = ({ currentVolume, previousVolume } = {}) => {
  const current = parseNonNegativeDecimal(currentVolume);
  const previous = parseNonNegativeDecimal(previousVolume);

  // Zero ou ausência no histórico não formam uma referência de volume em kg.
  if (current === null || previous === null || previous === 0) {
    return OVERLOAD_STATUS.baseline;
  }
  const difference = current - previous;
  if (Math.abs(difference) < VOLUME_COMPARISON_EPSILON_KG) return OVERLOAD_STATUS.maintenance;
  if (difference > 0) return OVERLOAD_STATUS.overload;
  if (difference < 0) return OVERLOAD_STATUS.reduction;
  return OVERLOAD_STATUS.maintenance;
};
