import { getCanonicalLoad, getSetLoadMode, isCanonicalLoadMode } from './loadModel';
import { isSameExercise } from './workoutUtils';

const getExerciseLoadMode = (exercise = {}) => getSetLoadMode(
  (exercise.sets || []).find((set) => set?.loadMode || set?.weight !== undefined) || {},
  exercise,
);

export const getMaxCompletedLoadRecord = (exercises = [], exerciseName, requiredMode = null) => exercises.reduce((best, exercise) => {
  if (!isSameExercise(exerciseName, exercise.name)) return best;
  const mode = getExerciseLoadMode(exercise);
  if (!isCanonicalLoadMode(mode) || (requiredMode && mode !== requiredMode)) return best;
  return (exercise.sets || []).reduce((currentBest, set) => {
    if (set.completed !== true) return currentBest;
    const canonicalLoad = getCanonicalLoad(set, exercise);
    if (canonicalLoad === null || canonicalLoad <= (currentBest?.canonicalLoad || 0)) return currentBest;
    return { canonicalLoad, exercise, mode, set };
  }, best);
}, null);

export const getMaxCompletedLoad = (exercises = [], exerciseName, requiredMode = null) => (
  getMaxCompletedLoadRecord(exercises, exerciseName, requiredMode)?.canonicalLoad || 0
);

export const countLoadPrs = (currentExercises = [], history = []) => (
  currentExercises.reduce((count, exercise) => {
    const mode = getExerciseLoadMode(exercise);
    if (!isCanonicalLoadMode(mode)) return count;
    const previousMax = history
      .reduce((best, session) => Math.max(
        best,
        getMaxCompletedLoad(session.exercises || [], exercise.name, mode),
      ), 0);
    const currentMax = getMaxCompletedLoad([exercise], exercise.name, mode);
    return count + (previousMax > 0 && currentMax > previousMax ? 1 : 0);
  }, 0)
);
