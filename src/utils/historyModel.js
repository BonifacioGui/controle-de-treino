import { formatLocalDate, normalizeLocalDateKey } from './dateUtils';
import { parseDecimalInput, parsePositiveInteger } from './numberUtils';
import { calculateSessionXp } from './xpModel';
import { getSetLoadMode, inferLegacyLoadMode, LOAD_MODES, normalizeLoadMode } from './loadModel';

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
  loadMode: set.loadMode ? normalizeLoadMode(set.loadMode) : null,
  barWeight: set.barWeight ?? null,
});

const hasCompletionFlag = (set) => ['completed', 'done', 'checked'].some(
  (key) => Object.prototype.hasOwnProperty.call(set || {}, key),
);

export const isValidLegacyHistorySet = (set = {}, exercise = {}) => {
  if (hasCompletionFlag(set)) return set.completed === true || set.done === true || set.checked === true;
  const mode = getSetLoadMode(set, exercise);
  if (mode === LOAD_MODES.duration) return (parseDecimalInput(set.duration) ?? 0) > 0;
  if (mode === LOAD_MODES.distance) return (parseDecimalInput(set.distance) ?? 0) > 0;
  if ([LOAD_MODES.bodyweight, LOAD_MODES.repsOnly].includes(mode)) return parsePositiveInteger(set.reps) !== null;
  return parseDecimalInput(set.weight) !== null && parsePositiveInteger(set.reps) !== null;
};

export const normalizeHistoricalWorkoutSet = (set = {}, exercise = {}) => ({
  ...normalizeWorkoutSet(set),
  completed: isValidLegacyHistorySet(set, exercise),
});

const inferHistoricalExerciseLoadMode = (exercise = {}) => {
  if (exercise.loadMode || exercise.mode) return normalizeLoadMode(exercise.loadMode || exercise.mode);
  const representativeSet = (exercise.sets || []).find((set) => (
    set?.loadMode || (set?.weight !== undefined && set?.weight !== null && set?.weight !== '')
  ));
  return representativeSet
    ? getSetLoadMode(representativeSet, { ...exercise, loadMode: undefined, mode: undefined })
    : inferLegacyLoadMode(exercise);
};

export const normalizeHistoryEntry = (entry = {}) => {
  const dateKey = normalizeLocalDateKey(entry.dateKey || entry.workout_date || entry.date);
  const workoutName = String(entry.workoutName || entry.workout_name || entry.dayName || entry.title || 'Treino');
  const exercises = Array.isArray(entry.exercises)
    ? entry.exercises.map((exercise) => {
        const loadMode = inferHistoricalExerciseLoadMode(exercise);
        return {
          ...exercise,
          name: String(exercise?.name || 'Exercício'),
          loadMode,
          barWeight: exercise?.barWeight ?? null,
          sets: Array.isArray(exercise?.sets)
            ? exercise.sets.map((set) => ({
                ...normalizeHistoricalWorkoutSet(set, { ...exercise, loadMode }),
                loadMode: set?.loadMode || loadMode,
              }))
            : [],
          skipped: exercise?.skipped === true,
        };
      })
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
    sessionId: entry.sessionId ?? entry.session_id ?? null,
    workoutTitle: entry.workoutTitle ?? entry.workout_title ?? workoutName,
    workoutFocus: entry.workoutFocus ?? entry.workout_focus ?? '',
    bossEncounter: entry.bossEncounter ?? entry.boss_encounter ?? entry.reportSnapshot?.bossEncounter ?? null,
    reportSnapshot: entry.reportSnapshot ?? entry.report_snapshot ?? null,
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
    session_id: entry.sessionId || null,
    workout_title: entry.workoutTitle || entry.workoutName,
    workout_focus: entry.workoutFocus || '',
    boss_encounter: entry.bossEncounter || null,
    report_snapshot: entry.reportSnapshot || null,
  } : row;
};

export const getHistoryDisplayDate = (entry) => formatLocalDate(entry?.dateKey);

export const isExtendedHistorySchemaError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'PGRST204'
    && (
      message.includes('partial')
      || message.includes('earned_xp')
      || message.includes('session_id')
      || message.includes('workout_title')
      || message.includes('workout_focus')
      || message.includes('boss_encounter')
      || message.includes('report_snapshot')
    );
};

export const sortHistoryNewestFirst = (history) => [...normalizeHistory(history)]
  .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
