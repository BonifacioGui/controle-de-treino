import { getCanonicalName } from './exerciseParser';
import { getSetLoadMode, isCanonicalLoadMode } from './loadModel';
import { formatLoadPr } from './performanceModel';
import { getMaxCompletedLoadRecord } from './progressionUtils';
import { isSameExercise } from './workoutUtils';

const getPlanExercises = (workoutData = {}) => Object.values(workoutData || {})
  .flatMap((workout) => workout?.exercises || []);
const getHistoryExercises = (history = []) => (history || [])
  .flatMap((session) => session?.exercises || []);

const resolveExerciseSource = (exerciseName, history, workoutData) => (
  getPlanExercises(workoutData).find((exercise) => isSameExercise(exerciseName, exercise.name))
  || getHistoryExercises(history).find((exercise) => isSameExercise(exerciseName, exercise.name))
  || null
);

export const getTrackableExerciseNames = (history = [], workoutData = {}) => {
  const exercises = [...getPlanExercises(workoutData), ...getHistoryExercises(history)];
  const names = new Map();
  exercises.forEach((exercise) => {
    if (!isCanonicalLoadMode(getSetLoadMode({}, exercise))) return;
    const canonicalName = getCanonicalName(exercise.name);
    if (canonicalName && !names.has(canonicalName)) names.set(canonicalName, canonicalName);
  });
  return [...names.values()].sort((left, right) => left.localeCompare(right, 'pt-BR'));
};

export const getSemanticHallOfFame = (history = [], workoutData = {}, limit = 6) => {
  const allHistoryExercises = getHistoryExercises(history);
  return getTrackableExerciseNames(history, workoutData)
    .map((name) => {
      const source = resolveExerciseSource(name, history, workoutData);
      const mode = getSetLoadMode({}, source || {});
      const record = getMaxCompletedLoadRecord(allHistoryExercises, name, mode);
      const formatted = formatLoadPr(record);
      return record && formatted ? {
        name,
        mode,
        canonicalLoad: record.canonicalLoad,
        primary: formatted.primary,
        secondary: formatted.secondary,
      } : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.canonicalLoad - left.canonicalLoad)
    .slice(0, limit);
};

export const getSemanticLoadSeries = (history = [], exerciseName, workoutData = {}) => {
  if (!exerciseName) return [];
  const source = resolveExerciseSource(exerciseName, history, workoutData);
  const mode = getSetLoadMode({}, source || {});
  if (!isCanonicalLoadMode(mode)) return [];
  return history
    .map((session) => {
      const record = getMaxCompletedLoadRecord(session.exercises || [], exerciseName, mode);
      return record ? { dateKey: session.dateKey, canonicalLoad: record.canonicalLoad, mode } : null;
    })
    .filter(Boolean);
};
