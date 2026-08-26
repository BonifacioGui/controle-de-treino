import { getCanonicalLoad, getSetLoadMode, isCanonicalLoadMode } from './loadModel';

const normalizeName = (value) => String(value || '').trim().toLocaleLowerCase('pt-BR');
const getExerciseLoadMode = (exercise = {}) => getSetLoadMode(
  (exercise.sets || []).find((set) => set?.loadMode || set?.weight !== undefined) || {},
  exercise,
);

export const getMaxCompletedLoad = (exercises = [], exerciseName, requiredMode = null) => exercises.reduce((best, exercise) => {
  if (normalizeName(exercise.name) !== normalizeName(exerciseName)) return best;
  const mode = getExerciseLoadMode(exercise);
  if (!isCanonicalLoadMode(mode) || (requiredMode && mode !== requiredMode)) return best;
  const loads = (exercise.sets || [])
    .filter((set) => set.completed)
    .map((set) => getCanonicalLoad(set, exercise) ?? 0);
  return Math.max(best, ...loads, 0);
}, 0);

export const countLoadPrs = (currentExercises = [], history = [], workoutName) => (
  currentExercises.reduce((count, exercise) => {
    const mode = getExerciseLoadMode(exercise);
    if (!isCanonicalLoadMode(mode)) return count;
    const previousMax = history
      .filter((session) => !workoutName || session.workoutName === workoutName)
      .reduce((best, session) => Math.max(
        best,
        getMaxCompletedLoad(session.exercises || [], exercise.name, mode),
      ), 0);
    const currentMax = getMaxCompletedLoad([exercise], exercise.name, mode);
    return count + (previousMax > 0 && currentMax > previousMax ? 1 : 0);
  }, 0)
);
