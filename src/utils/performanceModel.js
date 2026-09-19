import {
  formatEnteredLoad,
  getSetLoadMode,
  isCanonicalLoadMode,
  LOAD_MODES,
} from './loadModel';
import { getMaxCompletedLoadRecord } from './progressionUtils';
import { parseDecimalInput } from './numberUtils';
import { isSameExercise } from './workoutUtils';

const formatNumber = (value) => (parseDecimalInput(value) ?? 0).toLocaleString('pt-BR');

export const formatPerformanceSet = (set = {}, exercise = {}) => {
  const mode = getSetLoadMode(set, exercise);
  if (mode === LOAD_MODES.duration) return set.duration ? `${formatNumber(set.duration)} s` : null;
  if (mode === LOAD_MODES.distance) return set.distance ? `${formatNumber(set.distance)} km` : null;
  if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(mode)) {
    return set.reps ? `${formatNumber(set.reps)} reps` : null;
  }
  if (set.weight === '' || set.weight === null || set.weight === undefined) return null;
  const entered = formatEnteredLoad(set, exercise);
  return entered ? `${entered} × ${set.reps || '—'}` : null;
};

export const formatLoadPr = (record) => {
  if (!record) return null;
  const primary = formatEnteredLoad(record.set, record.exercise);
  if (!primary) return null;
  const showCanonicalTotal = [LOAD_MODES.perHand, LOAD_MODES.perSide].includes(record.mode);
  return {
    primary,
    secondary: showCanonicalTotal ? `Total canônico: ${formatNumber(record.canonicalLoad)} kg` : null,
  };
};

export const getExercisePerformance = (history = [], exerciseName, plannedExercise = {}) => {
  const exercises = history
    .flatMap((session) => (session.exercises || []).map((exercise) => ({
      ...exercise,
      dateKey: session.dateKey,
    })))
    .filter((exercise) => isSameExercise(exerciseName, exercise.name))
    .sort((left, right) => String(right.dateKey || '').localeCompare(String(left.dateKey || '')));
  const lastExercise = exercises.find((exercise) => exercise.sets?.some((set) => set.completed === true)) || null;
  const lastSets = (lastExercise?.sets || [])
    .filter((set) => set.completed === true)
    .map((set) => formatPerformanceSet(set, lastExercise))
    .filter(Boolean);
  const requiredMode = getSetLoadMode({}, plannedExercise);
  const prRecord = isCanonicalLoadMode(requiredMode)
    ? getMaxCompletedLoadRecord(exercises, exerciseName, requiredMode)
    : null;

  return {
    exercises,
    lastExercise,
    lastSets,
    lastSummary: lastSets.join(' · '),
    prRecord,
    pr: formatLoadPr(prRecord),
  };
};
