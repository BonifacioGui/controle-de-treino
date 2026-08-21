import { parseDecimalInput, parsePositiveInteger } from './numberUtils';

export const SESSION_STATUS = Object.freeze({
  idle: 'idle',
  active: 'active',
  paused: 'paused',
  finishing: 'finishing',
  completed: 'completed',
});

export const getExerciseMode = (exercise = {}) => {
  if (exercise.mode) return exercise.mode;
  const source = `${exercise.sets || ''} ${exercise.note || ''}`.toLowerCase();
  if (/\b(km|quil[oô]metro|dist[aâ]ncia|metros?)\b/.test(source)) return 'distance';
  if (/\b(min|seg|segundo|tempo)\b/.test(source)) return 'duration';
  if (/peso corporal|sem carga|abdominal|prancha|flex[aã]o/.test(source)) return 'bodyweight';
  if (!String(exercise.sets || '').includes('x')) return 'reps';
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

export const calculateCompletedVolume = (sets = []) => sets.reduce((total, set) => {
  if (!isSetCompleted(set)) return total;
  const weight = parseDecimalInput(set.weight);
  const reps = parseDecimalInput(set.reps);
  return total + (weight !== null && reps !== null ? weight * reps : 0);
}, 0);
