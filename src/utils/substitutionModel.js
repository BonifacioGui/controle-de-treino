import { isSameExercise } from './workoutUtils';

export const hasCompletedExerciseSets = (exerciseProgress = {}) => (
  (exerciseProgress.sets || []).some((set) => set.completed === true)
);

export const addExerciseAlternative = (exercise = {}, alternative) => {
  const name = String(alternative || '').trim();
  if (!name || isSameExercise(exercise.name, name)) return exercise;
  const alternatives = (exercise.alternatives || []).filter(Boolean);
  if (alternatives.some((item) => isSameExercise(item, name))) return exercise;
  return { ...exercise, alternatives: [...alternatives, name] };
};
