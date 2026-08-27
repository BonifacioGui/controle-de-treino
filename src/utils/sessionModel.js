import { parsePositiveInteger } from './numberUtils';
import {
  calculateSetCanonicalVolume,
  getSetLoadMode,
  LOAD_MODES,
} from './loadModel';

export const SESSION_STATUS = Object.freeze({
  idle: 'idle',
  active: 'active',
  paused: 'paused',
  finishing: 'finishing',
  completed: 'completed',
});

export const getExerciseMode = (exercise = {}) => {
  const loadMode = getSetLoadMode({}, exercise);
  if (loadMode === LOAD_MODES.distance) return 'distance';
  if (loadMode === LOAD_MODES.duration) return 'duration';
  if (loadMode === LOAD_MODES.bodyweight) return 'bodyweight';
  if (loadMode === LOAD_MODES.repsOnly) return 'reps';
  if (loadMode === LOAD_MODES.assisted) return 'assisted';
  return 'strength';
};

export const getExpectedSetCount = (exercise = {}, actualSets) => {
  const override = parsePositiveInteger(actualSets);
  if (override) return override;
  const prescription = String(exercise.sets || '').trim();
  const match = prescription.match(/^(\d+)\s*[xX×]/);
  if (match) return Number(match[1]);
  return 1;
};

export const isSetCompleted = (set) => set?.completed === true;

export const isExerciseCompleted = (exercise, exerciseProgress = {}) => {
  if (exerciseProgress.skipped === true) return true;
  const expected = getExpectedSetCount(exercise, exerciseProgress.actualSets);
  const completed = (exerciseProgress.sets || []).slice(0, expected).filter(isSetCompleted).length;
  return expected > 0 && completed === expected;
};

export const getSessionCompletion = (workout, progress, dateKey, workoutName) => {
  const exercises = workout?.exercises || [];
  return exercises.reduce((summary, exercise, index) => {
    const id = `${dateKey}-${workoutName}-${index}`;
    const exerciseProgress = progress?.[id] || {};
    const expected = getExpectedSetCount(exercise, exerciseProgress.actualSets);
    const completed = (exerciseProgress.sets || []).slice(0, expected).filter(isSetCompleted).length;
    const skipped = exerciseProgress.skipped === true;
    return {
      totalSets: summary.totalSets + expected,
      completedSets: summary.completedSets + completed,
      incompleteSets: summary.incompleteSets + (skipped ? 0 : Math.max(0, expected - completed)),
      skippedExercises: summary.skippedExercises + (skipped ? 1 : 0),
      completedExercises: summary.completedExercises + (isExerciseCompleted(exercise, exerciseProgress) ? 1 : 0),
    };
  }, { totalSets: 0, completedSets: 0, incompleteSets: 0, skippedExercises: 0, completedExercises: 0 });
};

export const calculateCompletedVolume = (sets = [], exercise = {}) => sets.reduce((total, set) => {
  if (!isSetCompleted(set)) return total;
  return total + calculateSetCanonicalVolume(set, exercise);
}, 0);

export const createSessionId = () => globalThis.crypto?.randomUUID?.()
  || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const getSessionProgress = (progress = {}, dateKey, workoutName) => {
  const prefix = `${dateKey}-${workoutName}-`;
  return Object.fromEntries(Object.entries(progress).filter(([key]) => key.startsWith(prefix)));
};

export const buildSessionExercises = (workout, progress, dateKey, workoutName) => (
  (workout?.exercises || []).map((exercise, index) => {
    const id = `${dateKey}-${workoutName}-${index}`;
    const exerciseProgress = progress?.[id] || {};
    const loadMode = getSetLoadMode({}, exercise);
    const performedName = exerciseProgress.swappedName || exercise.name;
    return {
      name: performedName,
      plannedName: exercise.name,
      performedName,
      sets: (exerciseProgress.sets || []).map((set) => ({
        ...set,
        loadMode: set.loadMode || loadMode,
        barWeight: set.barWeight ?? exercise.barWeight ?? null,
      })),
      skipped: exerciseProgress.skipped === true,
      actualSets: exerciseProgress.actualSets || exercise.sets,
      loadMode,
      barWeight: exercise.barWeight ?? null,
    };
  })
);
