import { isSameExercise } from './workoutUtils';

export const hasCompletedExerciseSets = (exerciseProgress = {}) => (
  (exerciseProgress.sets || []).some((set) => set.completed === true)
);

const RECORDED_SET_FIELDS = ['weight', 'reps', 'duration', 'distance', 'rpe'];

export const hasRecordedExerciseData = (exerciseProgress = {}) => (
  (exerciseProgress.sets || []).some((set) => (
    set?.completed === true
    || RECORDED_SET_FIELDS.some((field) => set?.[field] !== undefined
      && set[field] !== null
      && String(set[field]).trim() !== '')
  ))
);

export const addExerciseAlternative = (exercise = {}, alternative) => {
  const name = String(alternative || '').trim();
  if (!name || isSameExercise(exercise.name, name)) return exercise;
  const alternatives = (exercise.alternatives || []).filter(Boolean);
  if (alternatives.some((item) => isSameExercise(item, name))) return exercise;
  return { ...exercise, alternatives: [...alternatives, name] };
};

const resolveExerciseIndex = (workout, preferredIndex, plannedName) => {
  const exercises = workout?.exercises || [];
  if (Number.isInteger(preferredIndex)
    && exercises[preferredIndex]
    && isSameExercise(exercises[preferredIndex].name, plannedName)) return preferredIndex;

  const matchingIndexes = exercises.reduce((indexes, exercise, index) => (
    isSameExercise(exercise?.name, plannedName) ? [...indexes, index] : indexes
  ), []);
  return matchingIndexes.length === 1 ? matchingIndexes[0] : -1;
};

export const addAlternativeToWorkout = (
  workout,
  { exerciseIndex, plannedName, alternative } = {},
) => {
  if (!workout || !plannedName) return workout;
  const resolvedIndex = resolveExerciseIndex(workout, exerciseIndex, plannedName);
  if (resolvedIndex < 0) return workout;
  const exercises = [...(workout.exercises || [])];
  const updatedExercise = addExerciseAlternative(exercises[resolvedIndex], alternative);
  if (updatedExercise === exercises[resolvedIndex]) return workout;
  exercises[resolvedIndex] = updatedExercise;
  return { ...workout, exercises };
};
