import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { initialWorkoutData } from '../data/workoutData';
import { calculateStats, calculateStreak } from '../utils/rpgSystem';
import { getUnlockedBadges } from '../utils/gameLogic';
import { getLocalDateKey, isSameLocalDay, normalizeLocalDateKey } from '../utils/dateUtils';
import {
  normalizeHistory,
  normalizeHistoryEntry,
  normalizeWorkoutSet,
  sortHistoryNewestFirst,
  isExtendedHistorySchemaError,
  toSupabaseHistoryRow,
} from '../utils/historyModel';
import {
  getVisibleHistory,
  HISTORY_SYNC_STATUS,
  isPendingHistoryEntry,
  mergeCloudAndLocalHistory,
  sessionFingerprint,
} from '../utils/historySync';
import { countLoadPrs } from '../utils/progressionUtils';
import { DEFAULT_PLAN_SYNC, markPlanDirty, markPlanSynced, normalizePlanSync } from '../utils/planSync';
import { calculateCompletedVolume, getSessionCompletion, SESSION_STATUS } from '../utils/sessionModel';
import { QUEST_RULES } from '../utils/questRules';
import {
  migrateLegacyStorage,
  readUserStoredJSON,
  readUserStoredText,
  removeUserStoredItem,
  STORAGE_KEYS,
  writeUserStoredJSON,
  writeUserStoredText,
} from '../utils/storage';
import { calculateSessionXp } from '../utils/xpModel';
import { useWorkoutSession } from './useWorkoutSession';

const getInitialWorkout = (data) => Object.keys(data || {})[0] || 'A';
const normalizeWorkoutPlan = (plan) => {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return {};
  if (Object.keys(plan).length === 1 && plan['INÍCIO']) return {};
  return plan;
};
const normalizeBodyHistory = (entries) => Array.isArray(entries)
  ? entries.map((entry) => ({ ...entry, date: normalizeLocalDateKey(entry.date) })).filter((entry) => entry.date)
  : [];

const writeHistoryWithSchemaFallback = async (operation, entry, userId) => {
  let result = await operation(toSupabaseHistoryRow(entry, userId));
  if (result.error && isExtendedHistorySchemaError(result.error)) {
    result = await operation(toSupabaseHistoryRow(entry, userId, { includeExtendedFields: false }));
  }
  return result;
};

export const useWorkout = (userId) => {
  const {
    session,
    isHydrated: isSessionHydrated,
    workoutTimer,
    startSession,
    pauseSession,
    resumeSession,
    toggleWorkoutTimer,
    markFinishing,
    restoreAfterFailedFinish,
    completeSession,
    resetSession,
    acknowledgeRecovery,
    updateSessionNote,
  } = useWorkoutSession(userId);
  const [hydratedUserId, setHydratedUserId] = useState(null);
  const [workoutData, setWorkoutDataState] = useState({});
  const [planSync, setPlanSync] = useState(DEFAULT_PLAN_SYNC);
  const [activeDay, setActiveDay] = useState('A');
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey);
  const [sessionNote, setSessionNoteState] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [view, setView] = useState('workout');
  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? 'synced' : 'offline');
  const [isCloudSyncReady, setIsCloudSyncReady] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState({ duration: 0, volume: 0, xp: 0 });
  const syncInFlight = useRef(false);
  const activeUserRef = useRef(userId);
  activeUserRef.current = userId;

  const [progress, setProgress] = useState({});
  const [history, setHistory] = useState([]);
  const [bodyHistory, setBodyHistory] = useState([]);
  const [timerState, setTimerState] = useState({ active: false, endTime: null, duration: 90 });
  const historyRef = useRef(history);
  historyRef.current = history;
  const isHydrated = Boolean(userId && hydratedUserId === userId && isSessionHydrated);
  const visibleHistory = useMemo(() => getVisibleHistory(history), [history]);

  const setWorkoutData = useCallback((update) => {
    setWorkoutDataState((current) => (typeof update === 'function' ? update(current) : update));
    setPlanSync(markPlanDirty);
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
  }, []);

  useEffect(() => {
    if (!userId) {
      setHydratedUserId(null);
      setWorkoutDataState({});
      setPlanSync(DEFAULT_PLAN_SYNC);
      setActiveDay('A');
      setProgress({});
      setHistory([]);
      setBodyHistory([]);
      setTimerState({ active: false, endTime: null, duration: 90 });
      setLastSessionStats({ duration: 0, volume: 0, xp: 0 });
      setView('workout');
      setIsCloudSyncReady(false);
      return;
    }

    migrateLegacyStorage(userId);
    const plan = normalizeWorkoutPlan(readUserStoredJSON(
      userId,
      STORAGE_KEYS.workoutPlan,
      initialWorkoutData,
    ));
    const savedDay = readUserStoredText(userId, STORAGE_KEYS.activeDay, '');
    const savedTimer = readUserStoredJSON(userId, STORAGE_KEYS.restTimer, null);
    setWorkoutDataState(plan);
    setPlanSync(normalizePlanSync(readUserStoredJSON(userId, STORAGE_KEYS.planSync, DEFAULT_PLAN_SYNC)));
    setActiveDay(savedDay && plan[savedDay] ? savedDay : getInitialWorkout(plan));
    setProgress(readUserStoredJSON(userId, STORAGE_KEYS.progress, {}));
    setHistory(normalizeHistory(readUserStoredJSON(userId, STORAGE_KEYS.history, [])));
    setBodyHistory(normalizeBodyHistory(readUserStoredJSON(userId, STORAGE_KEYS.bodyHistory, [])));
    setTimerState(savedTimer?.endTime > Date.now()
      ? savedTimer
      : { active: false, endTime: null, duration: 90 });
    setSelectedDate(getLocalDateKey());
    setSessionNoteState('');
    setLastSessionStats({ duration: 0, volume: 0, xp: 0 });
    setView('workout');
    setIsCloudSyncReady(false);
    setHydratedUserId(userId);
  }, [userId]);

  useEffect(() => {
    if (!isHydrated || session.status === SESSION_STATUS.idle) return;
    if (session.workoutName) setActiveDay(session.workoutName);
    if (session.dateKey) setSelectedDate(session.dateKey);
    setSessionNoteState(session.note || '');
  }, [isHydrated, session.dateKey, session.note, session.status, session.workoutName]);

  const setSessionNote = useCallback((note) => {
    setSessionNoteState(note);
    updateSessionNote(note);
  }, [updateSessionNote]);

  const fetchCloudData = useCallback(async () => {
    if (!isHydrated || !userId) return;

    try {
      setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
      const [bodyResult, historyResult, planResult] = await Promise.all([
        supabase.from('body_stats').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('workout_history').select('*').eq('user_id', userId).order('workout_date', { ascending: false }),
        supabase.from('workout_plans').select('plan_data').eq('user_id', userId).limit(1),
      ]);
      if (activeUserRef.current !== userId) return;
      if (bodyResult.error) throw bodyResult.error;
      if (historyResult.error) throw historyResult.error;
      if (planResult.error) throw planResult.error;

      if (bodyResult.data) {
        setBodyHistory(normalizeBodyHistory(bodyResult.data));
      }

      const cloudHistory = normalizeHistory(historyResult.data || []);
      setHistory((current) => mergeCloudAndLocalHistory(cloudHistory, current));

      const planRow = planResult.data?.[0];
      if (planRow?.plan_data && !planSync.dirty) {
        const parsedPlan = normalizeWorkoutPlan(typeof planRow.plan_data === 'string'
          ? JSON.parse(planRow.plan_data)
          : planRow.plan_data);
        setWorkoutDataState(parsedPlan);
        const planKeys = Object.keys(parsedPlan);
        const latestSession = cloudHistory[0];

        if (session.status !== SESSION_STATUS.idle && session.workoutName) {
          setActiveDay(session.workoutName);
          if (session.dateKey) setSelectedDate(session.dateKey);
        } else if (latestSession && planKeys.includes(latestSession.workoutName)) {
          const latestIndex = planKeys.indexOf(latestSession.workoutName);
          setActiveDay(isSameLocalDay(latestSession.dateKey, getLocalDateKey())
            ? latestSession.workoutName
            : planKeys[(latestIndex + 1) % planKeys.length]);
        } else {
          setActiveDay((current) => (parsedPlan[current] ? current : (planKeys[0] || 'A')));
        }
      } else if (!planRow?.plan_data && Object.keys(workoutData).length > 0 && !planSync.dirty) {
        setPlanSync(markPlanDirty);
      }
      setSyncStatus('synced');
    } catch {
      if (activeUserRef.current === userId) setSyncStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      if (activeUserRef.current === userId) setIsCloudSyncReady(true);
    }
  }, [isHydrated, planSync.dirty, session.dateKey, session.status, session.workoutName, userId, workoutData]);

  useEffect(() => {
    if (isHydrated && !isCloudSyncReady) fetchCloudData();
  }, [fetchCloudData, isCloudSyncReady, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    writeUserStoredJSON(userId, STORAGE_KEYS.workoutPlan, workoutData);
    writeUserStoredJSON(userId, STORAGE_KEYS.planSync, planSync);
    writeUserStoredJSON(userId, STORAGE_KEYS.progress, progress);
    writeUserStoredJSON(userId, STORAGE_KEYS.history, history);
    writeUserStoredJSON(userId, STORAGE_KEYS.bodyHistory, bodyHistory);
    writeUserStoredText(userId, STORAGE_KEYS.activeDay, activeDay);
  }, [activeDay, bodyHistory, history, isHydrated, planSync, progress, userId, workoutData]);

  useEffect(() => {
    if (!isHydrated) return;
    if (timerState.active) writeUserStoredJSON(userId, STORAGE_KEYS.restTimer, timerState);
    else removeUserStoredItem(userId, STORAGE_KEYS.restTimer);
  }, [isHydrated, timerState, userId]);

  const syncPendingWorkoutPlan = useCallback(async () => {
    if (!planSync.dirty) return;
    const revision = planSync.revision;
    const planSnapshot = workoutData;
    const { error } = await supabase
      .from('workout_plans')
      .upsert({ user_id: userId, plan_data: planSnapshot }, { onConflict: 'user_id' });
    if (error) throw error;
    if (activeUserRef.current !== userId) return;
    setPlanSync((current) => markPlanSynced(current, revision));
  }, [planSync, userId, workoutData]);

  const syncPendingHistory = useCallback(async () => {
    const pending = history.filter(isPendingHistoryEntry);
    for (const entry of pending) {
      if (entry.syncStatus === HISTORY_SYNC_STATUS.delete) {
        if (entry.id) {
          const { error } = await supabase
            .from('workout_history')
            .delete()
            .eq('id', entry.id)
            .eq('user_id', userId);
          if (error) throw error;
        } else {
          const { data: possibleMatches, error: queryError } = await supabase
            .from('workout_history')
            .select('*')
            .eq('user_id', userId)
            .eq('workout_date', entry.dateKey)
            .eq('workout_name', entry.workoutName);
          if (queryError) throw queryError;
          const matchingIds = normalizeHistory(possibleMatches || [])
            .filter((candidate) => sessionFingerprint(candidate) === sessionFingerprint(entry))
            .map((candidate) => candidate.id)
            .filter(Boolean);
          if (matchingIds.length > 0) {
            const { error } = await supabase
              .from('workout_history')
              .delete()
              .in('id', matchingIds)
              .eq('user_id', userId);
            if (error) throw error;
          }
        }
        if (activeUserRef.current !== userId) return;
        setHistory((current) => current.filter((item) => item.localId !== entry.localId));
        continue;
      }

      let syncedEntry;
      if (entry.syncStatus === HISTORY_SYNC_STATUS.update && entry.id) {
        const { data, error } = await writeHistoryWithSchemaFallback(
          (row) => supabase
            .from('workout_history')
            .update(row)
            .eq('id', entry.id)
            .eq('user_id', userId)
            .select()
            .single(),
          entry,
          userId,
        );
        if (error) throw error;
        if (activeUserRef.current !== userId) return;
        syncedEntry = normalizeHistoryEntry(data);
      } else {
        const { data: possibleMatches, error: queryError } = await supabase
          .from('workout_history')
          .select('*')
          .eq('user_id', userId)
          .eq('workout_date', entry.dateKey)
          .eq('workout_name', entry.workoutName);
        if (queryError) throw queryError;
        const existing = normalizeHistory(possibleMatches || [])
          .find((candidate) => sessionFingerprint(candidate) === sessionFingerprint(entry));
        syncedEntry = existing;
        if (!syncedEntry) {
          const { data, error } = await writeHistoryWithSchemaFallback(
            (row) => supabase.from('workout_history').insert([row]).select().single(),
            entry,
            userId,
          );
          if (error) throw error;
          if (activeUserRef.current !== userId) return;
          syncedEntry = normalizeHistoryEntry(data);
        }
      }

      if (activeUserRef.current !== userId) return;
      if (!historyRef.current.some((item) => item.localId === entry.localId)) {
        if (syncedEntry.id) {
          const { error } = await supabase
            .from('workout_history')
            .delete()
            .eq('id', syncedEntry.id)
            .eq('user_id', userId);
          if (error) throw error;
        }
        continue;
      }
      setHistory((current) => current.map((item) => {
        if (item.localId !== entry.localId) return item;
        if (item.syncStatus === HISTORY_SYNC_STATUS.delete) {
          return { ...item, id: syncedEntry.id };
        }
        if (item.localRevision !== entry.localRevision) {
          return item.id ? item : {
            ...item,
            id: syncedEntry.id,
            syncStatus: HISTORY_SYNC_STATUS.update,
          };
        }
        return {
          ...syncedEntry,
          localId: entry.localId,
          partial: entry.partial,
          earnedXp: entry.earnedXp,
          localRevision: entry.localRevision,
          syncStatus: HISTORY_SYNC_STATUS.synced,
        };
      }));
    }
  }, [history, userId]);

  const hasPendingChanges = planSync.dirty || history.some(isPendingHistoryEntry);

  const syncPendingChanges = useCallback(async () => {
    if (!isCloudSyncReady || !isHydrated || !userId || !navigator.onLine || syncInFlight.current) return;
    if (!planSync.dirty && !history.some(isPendingHistoryEntry)) {
      setSyncStatus('synced');
      return;
    }

    syncInFlight.current = true;
    setSyncStatus('syncing');
    try {
      await syncPendingWorkoutPlan();
      await syncPendingHistory();
      if (activeUserRef.current === userId) setSyncStatus('synced');
    } catch {
      if (activeUserRef.current === userId) setSyncStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      syncInFlight.current = false;
      if (activeUserRef.current !== userId) setIsCloudSyncReady(false);
    }
  }, [history, isCloudSyncReady, isHydrated, planSync.dirty, syncPendingHistory, syncPendingWorkoutPlan, userId]);

  useEffect(() => {
    const onOnline = () => {
      setSyncStatus('syncing');
      setIsCloudSyncReady(false);
    };
    const onOffline = () => setSyncStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (hasPendingChanges && navigator.onLine && syncStatus !== 'error') {
      syncPendingChanges();
    }
  }, [hasPendingChanges, syncPendingChanges, syncStatus]);

  const streak = useMemo(() => calculateStreak(visibleHistory), [visibleHistory]);
  const globalRPG = useMemo(() => calculateStats(visibleHistory), [visibleHistory]);

  const updateSetData = useCallback((id, index, field, value) => {
    setProgress((currentProgress) => {
      const exerciseProgress = currentProgress[id] || { sets: [] };
      const sets = [...(exerciseProgress.sets || [])];
      while (sets.length <= index) sets.push(normalizeWorkoutSet());
      sets[index] = { ...sets[index], [field]: value };
      return { ...currentProgress, [id]: { ...exerciseProgress, sets } };
    });
  }, []);

  const startRestTimer = useCallback((duration = 90) => {
    const safeDuration = Math.max(0, Number(duration) || 0);
    if (!safeDuration) return;
    setTimerState({ active: true, duration: safeDuration, endTime: Date.now() + safeDuration * 1000 });
  }, []);

  const toggleSetComplete = useCallback((id, setIndex, restSeconds = 90) => {
    setProgress((currentProgress) => {
      const exerciseProgress = currentProgress[id] || { sets: [] };
      const sets = [...(exerciseProgress.sets || [])];
      while (sets.length <= setIndex) sets.push(normalizeWorkoutSet());
      const completed = sets[setIndex]?.completed !== true;
      sets[setIndex] = {
        ...normalizeWorkoutSet(sets[setIndex]),
        completed,
        finishedAt: completed ? Date.now() : null,
      };
      if (completed) startRestTimer(restSeconds);
      return { ...currentProgress, [id]: { ...exerciseProgress, skipped: false, sets } };
    });
  }, [startRestTimer]);

  const evaluateQuests = useCallback((sessionData, dateKey) => {
    if (!isSameLocalDay(dateKey, getLocalDateKey())) return { bonusXp: 0, newlyCompleted: [] };
    const quests = readUserStoredJSON(userId, STORAGE_KEYS.quests, []);
    const newlyCompleted = [];
    const updated = quests.map((quest) => {
      if (quest.completed) return quest;
      const rule = QUEST_RULES[quest.type];
      if (!rule || rule(sessionData) !== true) return quest;
      const completedQuest = { ...quest, completed: true };
      newlyCompleted.push(completedQuest);
      return completedQuest;
    });
    return {
      bonusXp: newlyCompleted.reduce((sum, quest) => sum + (Number(quest.reward) || 0), 0),
      newlyCompleted,
      commit: () => {
        writeUserStoredJSON(userId, STORAGE_KEYS.quests, updated);
        const questData = readUserStoredJSON(userId, STORAGE_KEYS.questData, {});
        writeUserStoredJSON(userId, STORAGE_KEYS.questData, { ...questData, quests: updated });
        window.dispatchEvent(new Event('quest_update'));
      },
    };
  }, [userId]);

  const finishWorkout = useCallback(async ({ allowPartial = false } = {}) => {
    const safeDay = workoutData[activeDay] ? activeDay : Object.keys(workoutData)[0];
    const workout = workoutData[safeDay];
    if (!workout) throw new Error('O treino selecionado não existe mais no plano.');
    const completion = getSessionCompletion(workout, progress, selectedDate, safeDay);
    if (completion.completedSets === 0 && completion.skippedExercises === 0) {
      throw new Error('Conclua ao menos uma série antes de finalizar o treino.');
    }
    if (completion.incompleteSets > 0 && !allowPartial) {
      return { requiresConfirmation: true, completion };
    }

    markFinishing();
    const exercises = workout.exercises.map((exercise, index) => {
      const id = `${selectedDate}-${safeDay}-${index}`;
      const exerciseProgress = progress[id] || {};
      return {
        name: exerciseProgress.swappedName || exercise.name,
        sets: (exerciseProgress.sets || []).map(normalizeWorkoutSet),
        skipped: exerciseProgress.skipped === true,
        actualSets: exerciseProgress.actualSets || exercise.sets,
      };
    });
    const totalVolume = exercises.reduce((sum, exercise) => sum + calculateCompletedVolume(exercise.sets), 0);
    const durationSeconds = Math.max(1, workoutTimer.elapsed);
    const previousSessions = visibleHistory.filter((entry) => entry.workoutName === safeDay);
    const previousVolume = previousSessions[0]?.totalVolume || 0;
    const overloadStatus = previousVolume > 0 && totalVolume > previousVolume ? 'OVERLOAD' : 'MANUTENÇÃO';

    const prsBroken = countLoadPrs(exercises, visibleHistory, safeDay);
    const exercisesSwapped = exercises
      .filter((exercise, index) => exercise.name !== workout.exercises[index].name).length;
    const questEvaluation = evaluateQuests({
      totalVolume,
      duration: durationSeconds,
      hasNote: Boolean(sessionNote.trim()),
      totalSets: completion.totalSets,
      completedSets: completion.completedSets,
      exercisesSwapped,
      prsBroken,
      finished: true,
    }, selectedDate);
    const partial = completion.incompleteSets > 0 || completion.skippedExercises > 0;
    const xpGained = calculateSessionXp({
      totalVolume,
      bonusXp: questEvaluation.bonusXp,
      overloadStatus,
    });
    const statsBefore = calculateStats(visibleHistory);
    const badgesBefore = new Set(getUnlockedBadges(visibleHistory).filter((badge) => badge.unlocked).map((badge) => badge.id));

    let localEntry = normalizeHistoryEntry({
      dateKey: selectedDate,
      workoutName: safeDay,
      note: sessionNote,
      exercises,
      totalVolume,
      bonusXp: questEvaluation.bonusXp,
      duration: durationSeconds,
      hasNote: Boolean(sessionNote.trim()),
      exercisesSwapped,
      prsBroken,
      overloadStatus,
      partial,
      earnedXp: xpGained,
      localRevision: 1,
      syncStatus: HISTORY_SYNC_STATUS.create,
    });
    const localHistory = sortHistoryNewestFirst([localEntry, ...history]);

    writeUserStoredJSON(userId, STORAGE_KEYS.history, localHistory);
    historyRef.current = localHistory;
    setHistory(localHistory);
    questEvaluation.commit?.();
    setLastSessionStats({
      duration: Math.max(1, Math.floor(durationSeconds / 60)),
      volume: totalVolume,
      xp: xpGained,
    });
    const currentPrefix = `${selectedDate}-${safeDay}-`;
    setProgress((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(currentPrefix)),
    ));
    setSessionNoteState('');
    setTimerState({ active: false, endTime: null, duration: 90 });
    completeSession();

    let savedToCloud = false;
    if (userId && navigator.onLine && !syncInFlight.current) {
      syncInFlight.current = true;
      const submittedRevision = localEntry.localRevision;
      try {
        setSyncStatus('syncing');
        const { data, error } = await writeHistoryWithSchemaFallback(
          (row) => supabase.from('workout_history').insert([row]).select().single(),
          localEntry,
          userId,
        );
        if (error) throw error;
        const synced = {
          ...normalizeHistoryEntry(data),
          localId: localEntry.localId,
          partial: localEntry.partial,
          earnedXp: localEntry.earnedXp,
          localRevision: localEntry.localRevision,
          syncStatus: HISTORY_SYNC_STATUS.synced,
        };
        localEntry = synced;
        savedToCloud = true;
        if (activeUserRef.current === userId) {
          const latestLocalEntry = historyRef.current.find((entry) => entry.localId === synced.localId);
          if (!latestLocalEntry && synced.id) {
            const { error: deleteError } = await supabase
              .from('workout_history')
              .delete()
              .eq('id', synced.id)
              .eq('user_id', userId);
            if (deleteError) throw deleteError;
          }
          setHistory((current) => current.map((entry) => {
            if (entry.localId !== synced.localId) return entry;
            if (entry.syncStatus === HISTORY_SYNC_STATUS.delete) {
              return { ...entry, id: synced.id };
            }
            if (entry.localRevision !== submittedRevision) {
              return entry.id ? entry : {
                ...entry,
                id: synced.id,
                syncStatus: HISTORY_SYNC_STATUS.update,
              };
            }
            return synced;
          }));
          setSyncStatus('synced');
        }
      } catch {
        if (activeUserRef.current === userId) setSyncStatus('error');
      } finally {
        syncInFlight.current = false;
      }
    } else if (!navigator.onLine) {
      setSyncStatus('offline');
    }

    const finalHistory = sortHistoryNewestFirst([localEntry, ...visibleHistory]);
    const statsAfter = calculateStats(finalHistory);
    const newBadges = getUnlockedBadges(finalHistory)
      .filter((badge) => badge.unlocked && !badgesBefore.has(badge.id));

    return {
      requiresConfirmation: false,
      savedLocally: true,
      savedToCloud,
      syncStatus: savedToCloud ? 'synced' : 'pending',
      subiuDeNivel: (statsAfter.level || 1) > (statsBefore.level || 1),
      sessionXp: xpGained,
      sessionVolume: totalVolume,
      sessionDuration: Math.max(1, Math.floor(durationSeconds / 60)),
      completedSets: completion.completedSets,
      prsBroken,
      newLevel: statsAfter.level || 1,
      newStreak: calculateStreak(finalHistory),
      newBadges,
      newlyCompletedQuests: questEvaluation.newlyCompleted,
      overloadStatus,
      partial,
    };
  }, [activeDay, completeSession, evaluateQuests, history, markFinishing, progress, selectedDate, sessionNote, userId, visibleHistory, workoutData, workoutTimer.elapsed]);

  const abandonSession = useCallback(() => {
    const workoutName = session.workoutName || activeDay;
    const dateKey = session.dateKey || selectedDate;
    const prefix = `${dateKey}-${workoutName}-`;
    setProgress((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(prefix)),
    ));
    setSessionNoteState('');
    setTimerState({ active: false, endTime: null, duration: 90 });
    resetSession();
  }, [activeDay, resetSession, selectedDate, session.dateKey, session.workoutName]);

  const actions = useMemo(() => ({
    updateSetData,
    toggleSetComplete,
    startSession: () => {
      startSession({ workoutName: activeDay, dateKey: selectedDate });
      setSessionNoteState('');
    },
    pauseSession,
    resumeSession,
    toggleWorkoutTimer,
    resetWorkoutTimer: abandonSession,
    acknowledgeRecovery,
    restoreAfterFailedFinish,
    finishWorkout,
    syncPendingSessions: syncPendingChanges,
    syncPendingChanges,
    syncPendingWorkoutPlan,
    updateSessionSets: (id, value) => setProgress((current) => ({
      ...current,
      [id]: { ...current[id], actualSets: value },
    })),
    skipExercise: (id, skipped = true) => setProgress((current) => ({
      ...current,
      [id]: { ...current[id], skipped },
    })),
    onSwap: (id, newName, options = {}) => {
      setProgress((current) => ({ ...current, [id]: { ...current[id], swappedName: newName } }));
      if (options.scope === 'plan' && Number.isInteger(options.exerciseIndex)) {
        setWorkoutData((currentPlan) => {
          const exercises = [...(currentPlan[activeDay]?.exercises || [])];
          exercises[options.exerciseIndex] = { ...exercises[options.exerciseIndex], name: newName };
          return { ...currentPlan, [activeDay]: { ...currentPlan[activeDay], exercises } };
        });
      }
    },
    setWeight: setWeightInput,
    setWaist: setWaistInput,
    setNote: setSessionNote,
    handleDateChange: (dateKey) => {
      setSelectedDate(dateKey);
      const entry = bodyHistory.find((item) => normalizeLocalDateKey(item.date) === dateKey);
      setWeightInput(entry?.weight || '');
      setWaistInput(entry?.waist || '');
    },
    closeTimer: () => setTimerState((current) => ({ ...current, active: false, endTime: null })),
    adjustRestTimer: (seconds) => setTimerState((current) => ({
      ...current,
      active: true,
      endTime: Math.max(Date.now(), current.endTime || Date.now()) + seconds * 1000,
    })),
    fetchCloudData,
    deleteEntry: async (id, type) => {
      if (type === 'body') {
        setBodyHistory((current) => current.filter((entry) => entry.id !== id));
        if (id) await supabase.from('body_stats').delete().eq('id', id).eq('user_id', userId);
        return;
      }
      setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
      setHistory((current) => {
        const target = current.find((entry) => entry.id === id || entry.localId === id);
        if (!target) return current;
        const next = current.map((entry) => entry.localId === target.localId ? {
          ...entry,
          localRevision: (entry.localRevision || 0) + 1,
          syncStatus: HISTORY_SYNC_STATUS.delete,
        } : entry);
        historyRef.current = next;
        return next;
      });
    },
    updateHistoryEntry: async (id, updatedSession) => {
      setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
      setHistory((current) => {
        const next = current.map((entry) => {
          if (entry.id !== id && entry.localId !== id) return entry;
          const normalized = normalizeHistoryEntry({
            ...updatedSession,
            id: entry.id,
            localId: entry.localId,
          });
          const totalVolume = normalized.exercises.reduce(
            (sum, exercise) => sum + calculateCompletedVolume(exercise.sets), 0,
          );
          const earnedXp = calculateSessionXp({ ...normalized, totalVolume, earnedXp: undefined });
          return {
            ...normalized,
            totalVolume,
            earnedXp,
            localRevision: (entry.localRevision || 0) + 1,
            syncStatus: entry.id ? HISTORY_SYNC_STATUS.update : HISTORY_SYNC_STATUS.create,
          };
        });
        historyRef.current = next;
        return next;
      });
    },
    manageData: {
      add: (day) => setWorkoutData((current) => ({
        ...current,
        [day]: {
          ...current[day],
          exercises: [...current[day].exercises, { name: 'Novo exercício', sets: '3x12', note: '' }],
        },
      })),
      addFromCatalog: (day, exercisesToAdd) => setWorkoutData((current) => ({
        ...current,
        [day]: {
          ...current[day],
          exercises: [
            ...(current[day]?.exercises || []),
            ...exercisesToAdd.map((name) => ({ name, sets: '3x10', note: '' })),
          ],
        },
      })),
      remove: (day, index) => setWorkoutData((current) => ({
        ...current,
        [day]: { ...current[day], exercises: current[day].exercises.filter((_, itemIndex) => itemIndex !== index) },
      })),
      edit: (day, index, field, value) => setWorkoutData((current) => {
        const exercises = [...current[day].exercises];
        exercises[index] = { ...exercises[index], [field]: value };
        return { ...current, [day]: { ...current[day], exercises } };
      }),
      addDay: (day) => setWorkoutData((current) => (current[day] ? current : {
        ...current,
        [day]: { title: `Treino ${day}`, focus: 'Geral', exercises: [] },
      })),
      removeDay: (day) => setWorkoutData((current) => Object.fromEntries(
        Object.entries(current).filter(([key]) => key !== day),
      )),
    },
  }), [
    activeDay,
    abandonSession,
    acknowledgeRecovery,
    bodyHistory,
    fetchCloudData,
    finishWorkout,
    selectedDate,
    pauseSession,
    restoreAfterFailedFinish,
    resumeSession,
    setSessionNote,
    startSession,
    setWorkoutData,
    syncPendingChanges,
    syncPendingWorkoutPlan,
    toggleSetComplete,
    toggleWorkoutTimer,
    updateSetData,
    userId,
  ]);

  return {
    state: {
      activeDay,
      sessionNote,
      selectedDate,
      weightInput,
      waistInput,
      view,
      workoutData,
      progress,
      history: visibleHistory,
      bodyHistory,
      timerState,
      workoutTimer,
      session,
      syncStatus,
      hasPendingChanges,
      isHydrated,
      userId,
    },
    setters: {
      setActiveDay,
      setSessionNote,
      setSelectedDate,
      setWeightInput,
      setWaistInput,
      setView,
      setWorkoutData,
    },
    actions,
    stats: {
      latest: bodyHistory[0] || { weight: '--', waist: '--' },
      streak,
      lastSessionStats,
      level: globalRPG.level,
      xp: globalRPG.xp,
      title: globalRPG.title,
      progress: globalRPG.nextLevelProgress,
      xpRemaining: globalRPG.xpRemaining,
    },
  };
};
