import { parseDecimalInput } from './numberUtils';

export const LOAD_MODES = Object.freeze({
  total: 'total',
  perSide: 'per_side',
  perHand: 'per_hand',
  machine: 'machine',
  bodyweight: 'bodyweight',
  assisted: 'assisted',
  duration: 'duration',
  distance: 'distance',
  repsOnly: 'reps_only',
});

export const LOAD_MODE_OPTIONS = Object.freeze([
  { value: LOAD_MODES.total, label: 'Carga total', shortLabel: 'kg total' },
  { value: LOAD_MODES.perSide, label: 'Peso por lado + barra', shortLabel: 'kg por lado' },
  { value: LOAD_MODES.perHand, label: 'Peso de um halter', shortLabel: 'kg por halter' },
  { value: LOAD_MODES.machine, label: 'Carga indicada na máquina', shortLabel: 'kg na máquina' },
  { value: LOAD_MODES.bodyweight, label: 'Peso corporal', shortLabel: 'peso corporal' },
  { value: LOAD_MODES.assisted, label: 'Exercício assistido', shortLabel: 'kg de assistência' },
  { value: LOAD_MODES.duration, label: 'Duração', shortLabel: 'tempo' },
  { value: LOAD_MODES.distance, label: 'Distância', shortLabel: 'distância' },
  { value: LOAD_MODES.repsOnly, label: 'Somente repetições', shortLabel: 'repetições' },
]);

const KNOWN_MODES = new Set(LOAD_MODE_OPTIONS.map((option) => option.value));
const CANONICAL_LOAD_MODES = new Set([
  LOAD_MODES.total,
  LOAD_MODES.perSide,
  LOAD_MODES.perHand,
  LOAD_MODES.machine,
]);

export const normalizeLoadMode = (value, fallback = LOAD_MODES.total) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (KNOWN_MODES.has(normalized)) return normalized;
  if (normalized === 'strength') return LOAD_MODES.total;
  if (normalized === 'reps') return LOAD_MODES.repsOnly;
  return fallback;
};

export const inferLegacyLoadMode = (exercise = {}) => {
  if (exercise.loadMode) return normalizeLoadMode(exercise.loadMode);
  if (exercise.mode) return normalizeLoadMode(exercise.mode);
  const source = `${exercise.sets || ''} ${exercise.note || ''} ${exercise.name || ''}`.toLowerCase();
  if (/\b(km|quil[oô]metro|dist[aâ]ncia|metros?)\b/.test(source)) return LOAD_MODES.distance;
  if (/\b(min|seg|segundo|tempo|isom[eé]tric)\b/.test(source)) return LOAD_MODES.duration;
  if (/peso corporal|sem carga|abdominal|prancha|flex[aã]o|barra fixa/.test(source)) return LOAD_MODES.bodyweight;
  if (!String(exercise.sets || '').includes('x')) return LOAD_MODES.repsOnly;
  return LOAD_MODES.total;
};

export const getSetLoadMode = (set = {}, exercise = {}) => {
  if (set.loadMode || exercise.loadMode || exercise.mode) {
    return normalizeLoadMode(set.loadMode || exercise.loadMode || exercise.mode);
  }
  if (set.weight !== undefined && set.weight !== null && set.weight !== '') return LOAD_MODES.total;
  return inferLegacyLoadMode(exercise);
};

export const isCanonicalLoadMode = (mode) => CANONICAL_LOAD_MODES.has(normalizeLoadMode(mode));

export const getCanonicalLoad = (set = {}, exercise = {}) => {
  const mode = getSetLoadMode(set, exercise);
  const enteredLoad = parseDecimalInput(set.weight);
  if (!isCanonicalLoadMode(mode) || enteredLoad === null || enteredLoad < 0) return null;

  if (mode === LOAD_MODES.perSide) {
    const barWeight = parseDecimalInput(set.barWeight ?? exercise.barWeight);
    return (barWeight !== null && barWeight >= 0 ? barWeight : 20) + (enteredLoad * 2);
  }
  if (mode === LOAD_MODES.perHand) return enteredLoad * 2;
  return enteredLoad;
};

export const calculateSetCanonicalVolume = (set = {}, exercise = {}) => {
  const load = getCanonicalLoad(set, exercise);
  const reps = parseDecimalInput(set.reps);
  if (load === null || reps === null || reps < 0) return 0;
  return load * reps;
};

export const getLoadModeOption = (mode) => LOAD_MODE_OPTIONS.find(
  (option) => option.value === normalizeLoadMode(mode),
) || LOAD_MODE_OPTIONS[0];

export const formatEnteredLoad = (set = {}, exercise = {}) => {
  const value = parseDecimalInput(set.weight);
  if (value === null) return null;
  const mode = getSetLoadMode(set, exercise);
  if (mode === LOAD_MODES.perSide) {
    const barWeight = parseDecimalInput(set.barWeight ?? exercise.barWeight) ?? 20;
    return `${value.toLocaleString('pt-BR')} kg por lado + barra de ${barWeight.toLocaleString('pt-BR')} kg`;
  }
  if (mode === LOAD_MODES.perHand) return `${value.toLocaleString('pt-BR')} kg por halter`;
  if (mode === LOAD_MODES.machine) return `${value.toLocaleString('pt-BR')} kg na máquina`;
  if (mode === LOAD_MODES.assisted) return `${value.toLocaleString('pt-BR')} kg de assistência`;
  return `${value.toLocaleString('pt-BR')} kg total`;
};
