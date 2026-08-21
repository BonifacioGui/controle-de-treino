import { parseDecimalInput } from './numberUtils';

const normalizeName = (value) => String(value || '').trim().toLocaleLowerCase('pt-BR');

export const getMaxCompletedLoad = (exercises = [], exerciseName) => exercises.reduce((best, exercise) => {
  if (normalizeName(exercise.name) !== normalizeName(exerciseName)) return best;
  const loads = (exercise.sets || [])
    .filter((set) => set.completed)
    .map((set) => parseDecimalInput(set.weight) ?? 0);
  return Math.max(best, ...loads, 0);
}, 0);

export const countLoadPrs = (currentExercises = [], history = [], workoutName) => (
  currentExercises.reduce((count, exercise) => {
    const previousMax = history
      .filter((session) => !workoutName || session.workoutName === workoutName)
      .reduce((best, session) => Math.max(
        best,
        getMaxCompletedLoad(session.exercises || [], exercise.name),
      ), 0);
    const currentMax = getMaxCompletedLoad([exercise], exercise.name);
    return count + (previousMax > 0 && currentMax > previousMax ? 1 : 0);
  }, 0)
);
