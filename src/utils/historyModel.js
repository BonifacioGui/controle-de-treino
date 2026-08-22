import { formatLocalDate, normalizeLocalDateKey } from './dateUtils';
import { parseDecimalInput } from './numberUtils';
import { calculateSessionXp } from './xpModel';

const makeLocalId = () => globalThis.crypto?.randomUUID?.()
  || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const normalizeWorkoutSet = (set = {}) => ({
  weight: set.weight ?? '',
  reps: set.reps ?? '',
  duration: set.duration ?? '',
  distance: set.distance ?? '',
  rpe: set.rpe ?? '',
  completed: set.completed === true || set.done === true || set.checked === true,
  finishedAt: set.finishedAt ?? null,
});

export const normalizeHistoryEntry = (entry = {}) => {
  const dateKey = normalizeLocalDateKey(entry.dateKey || entry.workout_date || entry.date);
  const workoutName = String(entry.workoutName || entry.workout_name || entry.dayName || entry.title || 'Treino');
  const exercises = Array.isArray(entry.exercises)
    ? entry.exercises.map((exercise) => ({
        ...exercise,
        name: String(exercise?.name || 'Exercício'),
        sets: Array.isArray(exercise?.sets) ? exercise.sets.map(normalizeWorkoutSet) : [],
        skipped: exercise?.skipped === true,
      }))
    : [];

  const partial = entry.partial === true || exercises.some((exercise) => {
    if (exercise.skipped || exercise.sets.some((set) => !set.completed)) return true;
    const expectedMatch = String(exercise.actualSets ?? '').match(/^(\d+)/);
    const expectedSets = expectedMatch ? Number(expectedMatch[1]) : null;
    const completedSets = exercise.sets.filter((set) => set.completed).length;
    return expectedSets !== null && completedSets < expectedSets;
  });
  const requestedSyncStatus = entry.syncStatus;
  const syncStatus = entry.id
    ? (requestedSyncStatus || 'synced')
    : (requestedSyncStatus === 'pending-delete' ? 'pending-delete' : 'pending-create');
  const normalized = {
    id: entry.id ?? null,
    localId: entry.localId || makeLocalId(),
    dateKey,
    workoutName,
    note: entry.note || '',
    exercises,
    totalVolume: parseDecimalInput(entry.totalVolume ?? entry.total_volume) ?? 0,
    bonusXp: parseDecimalInput(entry.bonusXp ?? entry.bonus_xp) ?? 0,
    duration: parseDecimalInput(entry.duration) ?? 0,
    hasNote: entry.hasNote ?? entry.has_note ?? Boolean(entry.note),
    exercisesSwapped: Number(entry.exercisesSwapped ?? entry.exercises_swapped) || 0,
    prsBroken: Number(entry.prsBroken ?? entry.prs_broken) || 0,
    overloadStatus: entry.overloadStatus ?? entry.overload_status ?? 'NORMAL',
    partial,
    localRevision: Number(entry.localRevision) || 0,
    syncStatus,
  };
  return {
    ...normalized,
    earnedXp: calculateSessionXp({
      ...normalized,
      earnedXp: entry.earnedXp ?? entry.earned_xp,
    }),
  };
};

export const normalizeHistory = (history) => Array.isArray(history)
  ? history.map(normalizeHistoryEntry).filter((entry) => entry.dateKey)
  : [];

export const toSupabaseHistoryRow = (entry, userId, { includeExtendedFields = true } = {}) => {
  const row = {
    user_id: userId,
    workout_date: entry.dateKey,
    workout_name: entry.workoutName,
    note: entry.note,
    exercises: entry.exercises,
    total_volume: entry.totalVolume,
    bonus_xp: entry.bonusXp,
    duration: entry.duration,
    has_note: entry.hasNote,
    exercises_swapped: entry.exercisesSwapped,
    prs_broken: entry.prsBroken,
    overload_status: entry.overloadStatus,
  };
  return includeExtendedFields ? {
    ...row,
    partial: entry.partial === true,
    earned_xp: calculateSessionXp(entry),
  } : row;
};

export const getHistoryDisplayDate = (entry) => formatLocalDate(entry?.dateKey);

export const isExtendedHistorySchemaError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'PGRST204'
    && (message.includes('partial') || message.includes('earned_xp'));
};

export const sortHistoryNewestFirst = (history) => [...normalizeHistory(history)]
  .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
