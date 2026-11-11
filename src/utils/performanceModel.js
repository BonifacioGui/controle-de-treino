import {
  formatEnteredLoad,
  getCanonicalLoad,
  getSetLoadMode,
  inferEquipmentLoadMode,
  isCanonicalLoadMode,
  LOAD_MODES,
} from './loadModel';
import { parseDecimalInput, parsePositiveInteger } from './numberUtils';
import { isSameExercise } from './workoutUtils';

const formatNumber = (value) => (parseDecimalInput(value) ?? 0).toLocaleString('pt-BR');

const getPerformanceLoadMode = (set = {}, exercise = {}) => {
  if (set.loadMode || exercise.loadMode || exercise.mode) return getSetLoadMode(set, exercise);
  return inferEquipmentLoadMode(exercise) || getSetLoadMode(set, exercise);
};

const withPerformanceLoadMode = (exercise, mode) => (
  exercise.loadMode || exercise.mode ? exercise : { ...exercise, loadMode: mode }
);

export const formatPerformanceSet = (set = {}, exercise = {}) => {
  const mode = getPerformanceLoadMode(set, exercise);
  const effectiveExercise = withPerformanceLoadMode(exercise, mode);
  if (mode === LOAD_MODES.duration) return set.duration ? `${formatNumber(set.duration)} s` : null;
  if (mode === LOAD_MODES.distance) return set.distance ? `${formatNumber(set.distance)} km` : null;
  if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(mode)) {
    return set.reps ? `${formatNumber(set.reps)} reps` : null;
  }
  if (set.weight === '' || set.weight === null || set.weight === undefined) return null;
  const entered = formatEnteredLoad(set, effectiveExercise);
  return entered ? `${entered} × ${set.reps || '—'}` : null;
};

export const formatLoadPr = (record) => {
  if (!record) return null;
  if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(record.mode)) {
    return { primary: `${formatNumber(record.reps)} reps`, secondary: null };
  }
  if (record.mode === LOAD_MODES.duration) {
    return { primary: `${formatNumber(record.duration)} s`, secondary: null };
  }
  if (record.mode === LOAD_MODES.distance) {
    return { primary: `${formatNumber(record.distance)} km`, secondary: null };
  }
  const primary = formatEnteredLoad(record.set, record.exercise);
  if (!primary) return null;
  if (record.mode === LOAD_MODES.assisted) {
    return { primary: `${primary} × ${record.reps}`, secondary: null };
  }
  const showCanonicalTotal = [LOAD_MODES.perHand, LOAD_MODES.perSide].includes(record.mode);
  return {
    primary,
    secondary: showCanonicalTotal ? `Total canônico: ${formatNumber(record.canonicalLoad)} kg` : null,
  };
};

const comparePerformanceRecords = (left, right) => {
  if (!left) return 1;
  if (!right) return -1;
  if (isCanonicalLoadMode(left.mode)) {
    return (right.canonicalLoad - left.canonicalLoad) || (right.reps - left.reps);
  }
  if (left.mode === LOAD_MODES.assisted) {
    return (left.assistance - right.assistance) || (right.reps - left.reps);
  }
  if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(left.mode)) return right.reps - left.reps;
  if (left.mode === LOAD_MODES.duration) return right.duration - left.duration;
  if (left.mode === LOAD_MODES.distance) return right.distance - left.distance;
  return 0;
};

const isSamePerformanceRecord = (left, right) => {
  if (!left || !right || left.mode !== right.mode) return false;
  if (isCanonicalLoadMode(left.mode)) {
    return left.canonicalLoad === right.canonicalLoad && left.reps === right.reps;
  }
  if (left.mode === LOAD_MODES.assisted) {
    return left.assistance === right.assistance && left.reps === right.reps;
  }
  if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(left.mode)) return left.reps === right.reps;
  if (left.mode === LOAD_MODES.duration) return left.duration === right.duration;
  if (left.mode === LOAD_MODES.distance) return left.distance === right.distance;
  return false;
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
  const mode = getPerformanceLoadMode(representativeSet, exercise);
  const effectiveExercise = withPerformanceLoadMode(exercise, mode);
  const compatibleSets = completedSets.filter((set) => getPerformanceLoadMode(set, exercise) === mode);

  const candidates = compatibleSets.map((set) => {
    const reps = parsePositiveInteger(set.reps);
    if (isCanonicalLoadMode(mode)) {
      const canonicalLoad = getCanonicalLoad(set, effectiveExercise);
      return canonicalLoad !== null && canonicalLoad >= 0 && reps !== null
        ? { set, exercise: effectiveExercise, mode, canonicalLoad, reps }
        : null;
    }
    if (mode === LOAD_MODES.assisted) {
      const assistance = parseDecimalInput(set.weight);
      return assistance !== null && assistance >= 0 && reps !== null
        ? { set, exercise: effectiveExercise, mode, assistance, reps }
        : null;
    }
    if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(mode)) {
      return reps !== null ? { set, exercise: effectiveExercise, mode, reps } : null;
    }
    if (mode === LOAD_MODES.duration) {
      const duration = parseDecimalInput(set.duration);
      return duration !== null && duration > 0 ? { set, exercise: effectiveExercise, mode, duration } : null;
    }
    if (mode === LOAD_MODES.distance) {
      const distance = parseDecimalInput(set.distance);
      return distance !== null && distance > 0 ? { set, exercise: effectiveExercise, mode, distance } : null;
    }
    return null;
  }).filter(Boolean);

  return candidates.sort(comparePerformanceRecords)[0] || null;
};

export const getBestPerformanceRecord = (exercises = [], requiredMode = null) => exercises
  .map((exercise) => getBestCompletedSet(exercise))
  .filter((record) => record && (!requiredMode || record.mode === requiredMode))
  .sort(comparePerformanceRecords)[0] || null;

export const getExercisePerformance = (history = [], exerciseName, plannedExercise = {}) => {
  const requiredMode = getSetLoadMode({}, plannedExercise);
  const exercises = history
    .flatMap((session) => (session.exercises || []).map((exercise) => ({
      ...exercise,
      dateKey: session.dateKey,
    })))
    .filter((exercise) => {
      if (!isSameExercise(exerciseName, exercise.name)) return false;
      const bestSet = getBestCompletedSet(exercise);
      return !bestSet || bestSet.mode === requiredMode;
    })
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
  const prRecord = getBestPerformanceRecord(exercises, requiredMode);
  const lastBestIsPr = isSamePerformanceRecord(lastBestRecord, prRecord);

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
