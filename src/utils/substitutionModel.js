import { isSameExercise } from './workoutUtils';
import {
  getSetLoadMode,
  inferEquipmentLoadMode,
  LOAD_MODES,
  normalizeLoadMode,
} from './loadModel';

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

export const getAlternativeName = (alternative) => String(
  typeof alternative === 'string' ? alternative : alternative?.name || '',
).trim();

export const addExerciseAlternative = (exercise = {}, alternative) => {
  const name = getAlternativeName(alternative);
  if (!name || isSameExercise(exercise.name, name)) return exercise;
  const alternatives = (exercise.alternatives || []).filter(Boolean);
  if (alternatives.some((item) => isSameExercise(getAlternativeName(item), name))) return exercise;
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

export const updateWorkoutExerciseAlternatives = (
  workout,
  { exerciseIndex, plannedName, alternatives } = {},
) => {
  if (!workout || !plannedName || !Array.isArray(alternatives)) return workout;
  const resolvedIndex = resolveExerciseIndex(workout, exerciseIndex, plannedName);
  if (resolvedIndex < 0) return workout;
  const exercises = [...(workout.exercises || [])];
  exercises[resolvedIndex] = {
    ...exercises[resolvedIndex],
    alternatives: [...alternatives],
  };
  return { ...workout, exercises };
};

const findAlternativeDescriptor = (exercise, selectedName) => (
  (exercise?.alternatives || []).find((alternative) => (
    isSameExercise(getAlternativeName(alternative), selectedName)
  ))
);

export const resolveSubstitutionMetadata = (exercise = {}, selection) => {
  const selectionDescriptor = typeof selection === 'object' && selection !== null
    ? selection
    : null;
  const name = getAlternativeName(selection);
  const storedDescriptor = selectionDescriptor || findAlternativeDescriptor(exercise, name);
  const configuredMode = storedDescriptor && typeof storedDescriptor === 'object'
    ? storedDescriptor.loadMode
    : null;
  const loadMode = configuredMode
    ? normalizeLoadMode(configuredMode)
    : inferEquipmentLoadMode({ name }) || getSetLoadMode({}, exercise);
  const configuredBarWeight = storedDescriptor && typeof storedDescriptor === 'object'
    ? storedDescriptor.barWeight
    : null;
  const inheritedBarWeight = getSetLoadMode({}, exercise) === LOAD_MODES.perSide
    ? exercise.barWeight
    : null;
  const barWeight = loadMode === LOAD_MODES.perSide
    ? configuredBarWeight ?? inheritedBarWeight ?? null
    : null;
  return { name, loadMode, barWeight };
};

export const getEffectiveExercise = (exercise = {}, exerciseProgress = {}) => {
  if (!exerciseProgress.swappedName) return exercise;
  const inferred = resolveSubstitutionMetadata(exercise, exerciseProgress.swappedName);
  const loadMode = exerciseProgress.swappedLoadMode
    ? normalizeLoadMode(exerciseProgress.swappedLoadMode)
    : inferred.loadMode;
  const barWeight = loadMode === LOAD_MODES.perSide
    ? exerciseProgress.swappedBarWeight ?? inferred.barWeight ?? null
    : null;
  return {
    ...exercise,
    name: exerciseProgress.swappedName,
    loadMode,
    barWeight,
  };
};
