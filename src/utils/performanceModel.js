import {
  formatEnteredLoad,
  getCanonicalLoad,
  getSetLoadMode,
  isCanonicalLoadMode,
  LOAD_MODES,
} from './loadModel';
import { getMaxCompletedLoadRecord } from './progressionUtils';
import { parseDecimalInput, parsePositiveInteger } from './numberUtils';
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

const getCompletedSets = (exercise = {}) => (exercise.sets || []).filter(
  (set) => set.completed === true,
);

export const getBestCompletedSet = (exercise = {}) => {
  const completedSets = getCompletedSets(exercise);
  if (completedSets.length === 0) return null;
  const representativeSet = completedSets.find((set) => (
    set.loadMode || set.weight !== undefined || set.duration !== undefined || set.distance !== undefined
  )) || completedSets[0];
  const mode = getSetLoadMode(representativeSet, exercise);
  const compatibleSets = completedSets.filter((set) => getSetLoadMode(set, exercise) === mode);

  const candidates = compatibleSets.map((set) => {
    const reps = parsePositiveInteger(set.reps);
    if (isCanonicalLoadMode(mode)) {
      const canonicalLoad = getCanonicalLoad(set, exercise);
      return canonicalLoad !== null && canonicalLoad >= 0 && reps !== null
        ? { set, exercise, mode, canonicalLoad, reps }
        : null;
    }
    if (mode === LOAD_MODES.assisted) {
      const assistance = parseDecimalInput(set.weight);
      return assistance !== null && assistance >= 0 && reps !== null
        ? { set, exercise, mode, assistance, reps }
        : null;
    }
    if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(mode)) {
      return reps !== null ? { set, exercise, mode, reps } : null;
    }
    if (mode === LOAD_MODES.duration) {
      const duration = parseDecimalInput(set.duration);
      return duration !== null && duration > 0 ? { set, exercise, mode, duration } : null;
    }
    if (mode === LOAD_MODES.distance) {
      const distance = parseDecimalInput(set.distance);
      return distance !== null && distance > 0 ? { set, exercise, mode, distance } : null;
    }
    return null;
  }).filter(Boolean);

  const compare = (left, right) => {
    if (isCanonicalLoadMode(mode)) {
      return (right.canonicalLoad - left.canonicalLoad) || (right.reps - left.reps);
    }
    if (mode === LOAD_MODES.assisted) {
      return (left.assistance - right.assistance) || (right.reps - left.reps);
    }
    if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(mode)) return right.reps - left.reps;
    if (mode === LOAD_MODES.duration) return right.duration - left.duration;
    if (mode === LOAD_MODES.distance) return right.distance - left.distance;
    return 0;
  };

  return candidates.sort(compare)[0] || null;
};

export const getExercisePerformance = (history = [], exerciseName, plannedExercise = {}) => {
  const exercises = history
    .flatMap((session) => (session.exercises || []).map((exercise) => ({
      ...exercise,
      dateKey: session.dateKey,
    })))
    .filter((exercise) => isSameExercise(exerciseName, exercise.name))
    .sort((left, right) => String(right.dateKey || '').localeCompare(String(left.dateKey || '')));
  const lastExercise = exercises.find((exercise) => getBestCompletedSet(exercise)) || null;
  const lastSets = (lastExercise?.sets || [])
    .filter((set) => set.completed === true)
    .map((set) => formatPerformanceSet(set, lastExercise))
    .filter(Boolean);
  const lastBestRecord = getBestCompletedSet(lastExercise || {});
  const lastBestSummary = lastBestRecord
    ? formatPerformanceSet(lastBestRecord.set, lastBestRecord.exercise)
    : null;
  const requiredMode = getSetLoadMode({}, plannedExercise);
  const prRecord = isCanonicalLoadMode(requiredMode)
    ? getMaxCompletedLoadRecord(exercises, exerciseName, requiredMode)
    : null;
  const lastBestIsPr = Boolean(
    lastBestRecord
    && prRecord
    && lastBestRecord.mode === prRecord.mode
    && lastBestRecord.canonicalLoad === prRecord.canonicalLoad,
  );

  return {
    exercises,
    lastExercise,
    lastSets,
    lastBestRecord,
    lastBestSummary,
    lastBestIsPr,
    lastSummary: lastBestSummary || '',
    prRecord,
    pr: formatLoadPr(prRecord),
  };
};
