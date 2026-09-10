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
import {
  buildSessionExercises,
  calculateCompletedVolume,
  createSessionId,
  getSessionCompletion,
  getSessionProgress,
  SESSION_STATUS,
} from '../utils/sessionModel';
import { createBossEncounter, updateBossEncounter } from '../utils/bossModel';
import {
  adjustRestTimerEndTime,
  createRestTimerState,
  finishRestTimerState,
  getIdleRestTimerState,
  REST_TIMER_STATUS,
  restoreRestTimerState,
  shouldStartRestTimer,
} from '../utils/restTimerModel';
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
import { classifyVolumeProgress, findPreviousComparableVolume } from '../utils/overloadModel';
import { addExerciseAlternative, hasCompletedExerciseSets } from '../utils/substitutionModel';
import {
  claimHapticAttempt,
  getHapticDelivery,
  HAPTIC_DELIVERY,
  HAPTIC_TYPES,
  triggerHaptic,
} from '../utils/haptics';
import { resolveSelectedWorkoutDay } from '../utils/workoutSelection';
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

export const useWorkout = (userId, { hapticFeedback = true } = {}) => {
  const {
    session,
    isHydrated: isSessionHydrated,
    workoutTimer,
    startSession,
    reopenSession,
    pauseSession,
    resumeSession,
    toggleWorkoutTimer,
    markFinishing,
    restoreAfterFailedFinish,
    completeSession,
    resetSession,
    acknowledgeRecovery,
    updateSessionNote,
    updateSessionSnapshot,
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
  const [timerState, setTimerState] = useState(getIdleRestTimerState);
  const handledRestTimersRef = useRef(new Set());
  const pendingRestHapticRef = useRef(null);
  const attemptedRestHapticsRef = useRef(new Set());
  const hapticFeedbackRef = useRef(hapticFeedback);
  hapticFeedbackRef.current = hapticFeedback;
  const historyRef = useRef(history);
  historyRef.current = history;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const restoredSessionRef = useRef(null);
  const isHydrated = Boolean(userId && hydratedUserId === userId && isSessionHydrated);
  const visibleHistory = useMemo(() => getVisibleHistory(history), [history]);
  const sessionActive = [SESSION_STATUS.active, SESSION_STATUS.paused, SESSION_STATUS.finishing]
    .includes(session.status);
  const activeWorkout = sessionActive
    ? (session.workoutSnapshot || workoutData[session.workoutName || activeDay])
    : workoutData[activeDay];
  const activeSessionProgress = useMemo(() => (
    sessionActive
      ? getSessionProgress(progress, session.dateKey || selectedDate, session.workoutName || activeDay)
      : {}
  ), [activeDay, progress, selectedDate, session.dateKey, session.workoutName, sessionActive]);
  const activeSessionExercises = useMemo(() => (
    sessionActive && activeWorkout
      ? buildSessionExercises(
          activeWorkout,
          progress,
          session.dateKey || selectedDate,
          session.workoutName || activeDay,
        )
      : []
  ), [activeDay, activeWorkout, progress, selectedDate, session.dateKey, session.workoutName, sessionActive]);
  const bossHistory = useMemo(() => visibleHistory.filter((entry) => (
    !session.editTarget
    || (entry.id !== session.editTarget.id && entry.localId !== session.editTarget.localId)
  )), [session.editTarget, visibleHistory]);
  const activeBossEncounter = useMemo(() => updateBossEncounter(
    session.bossEncounter,
    activeSessionExercises,
    bossHistory,
    session.workoutName || activeDay,
  ), [activeDay, activeSessionExercises, bossHistory, session.bossEncounter, session.workoutName]);

  const setWorkoutData = useCallback((update) => {
    setWorkoutDataState((current) => (typeof update === 'function' ? update(current) : update));
    setPlanSync(markPlanDirty);
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
  }, []);

  useEffect(() => {
    if (!isHydrated || !sessionActive) return;
    const progressChanged = JSON.stringify(session.progress || {}) !== JSON.stringify(activeSessionProgress);
    const bossChanged = JSON.stringify(session.bossEncounter || null) !== JSON.stringify(activeBossEncounter || null);
    if (!progressChanged && !bossChanged) return;
    updateSessionSnapshot({ progress: activeSessionProgress, bossEncounter: activeBossEncounter });
  }, [activeBossEncounter, activeSessionProgress, isHydrated, session.bossEncounter, session.progress, sessionActive, updateSessionSnapshot]);

  useEffect(() => {
    if (!userId) {
      setHydratedUserId(null);
      setWorkoutDataState({});
      setPlanSync(DEFAULT_PLAN_SYNC);
      setActiveDay('A');
      setProgress({});
      setHistory([]);
      setBodyHistory([]);
      setTimerState(getIdleRestTimerState());
      handledRestTimersRef.current.clear();
      pendingRestHapticRef.current = null;
      attemptedRestHapticsRef.current.clear();
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
    const savedProgress = readUserStoredJSON(userId, STORAGE_KEYS.progress, {});
    setProgress(savedProgress);
    progressRef.current = savedProgress;
    setHistory(normalizeHistory(readUserStoredJSON(userId, STORAGE_KEYS.history, [])));
    setBodyHistory(normalizeBodyHistory(readUserStoredJSON(userId, STORAGE_KEYS.bodyHistory, [])));
    setTimerState(restoreRestTimerState(savedTimer));
    handledRestTimersRef.current.clear();
    pendingRestHapticRef.current = null;
    attemptedRestHapticsRef.current.clear();
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

  useEffect(() => {
    if (!isHydrated || session.status === SESSION_STATUS.idle) return;
    const recoveryKey = `${userId}:${session.sessionId || session.dateKey}:${session.workoutName}`;
    if (restoredSessionRef.current === recoveryKey) return;
    restoredSessionRef.current = recoveryKey;
    if (session.progress && Object.keys(session.progress).length > 0) {
      setProgress((current) => {
        const next = { ...current, ...session.progress };
        progressRef.current = next;
        return next;
      });
    }
  }, [isHydrated, session.dateKey, session.progress, session.sessionId, session.status, session.workoutName, userId]);

  useEffect(() => {
    if (!isHydrated || !sessionActive) return;
    const workoutName = session.workoutName || activeDay;
    const workoutSnapshot = session.workoutSnapshot || workoutData[workoutName];
    if (!workoutSnapshot) return;
    const patch = {};
    const upgradedSessionId = session.sessionId || createSessionId();
    if (!session.sessionId) patch.sessionId = upgradedSessionId;
    if (!session.workoutName) patch.workoutName = workoutName;
    if (!session.workoutSnapshot) patch.workoutSnapshot = structuredClone(workoutSnapshot);
    if (!session.workoutTitle) patch.workoutTitle = workoutSnapshot.title || workoutName;
    if (!session.workoutFocus) patch.workoutFocus = workoutSnapshot.focus || '';
    if (!session.bossEncounter) {
      const bossEncounter = createBossEncounter({
        sessionId: upgradedSessionId,
        dateKey: session.dateKey || selectedDate,
        workoutName,
        workout: workoutSnapshot,
        history: visibleHistory,
      });
      if (bossEncounter) patch.bossEncounter = bossEncounter;
    }
    if (Object.keys(patch).length > 0) updateSessionSnapshot(patch);
  }, [activeDay, isHydrated, selectedDate, session.bossEncounter, session.dateKey, session.sessionId, session.workoutFocus, session.workoutName, session.workoutSnapshot, session.workoutTitle, sessionActive, updateSessionSnapshot, visibleHistory, workoutData]);

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
        const latestSession = cloudHistory[0];

        setActiveDay((current) => resolveSelectedWorkoutDay({
          plan: parsedPlan,
          currentDay: current,
          sessionStatus: session.status,
          sessionWorkoutName: session.workoutName,
          latestSession,
          today: getLocalDateKey(),
        }));
        if (session.status !== SESSION_STATUS.idle && session.dateKey) setSelectedDate(session.dateKey);
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

  useEffect(() => {
    const deliverPendingRestHaptic = () => {
      if (document.visibilityState !== 'visible') return;
      const timerId = pendingRestHapticRef.current;
      if (!timerId) return;

      pendingRestHapticRef.current = null;
      if (!claimHapticAttempt(attemptedRestHapticsRef.current, timerId)) return;
      triggerHaptic(HAPTIC_TYPES.restComplete, { enabled: hapticFeedbackRef.current });
    };

    document.addEventListener('visibilitychange', deliverPendingRestHaptic);
    return () => document.removeEventListener('visibilitychange', deliverPendingRestHaptic);
  }, []);

  useEffect(() => {
    const timerId = timerState.timerId;
    if (!isHydrated
      || timerState.status !== REST_TIMER_STATUS.finished
      || !timerId
      || attemptedRestHapticsRef.current.has(timerId)) return;

    const delivery = getHapticDelivery({
      enabled: hapticFeedbackRef.current,
      visibilityState: document.visibilityState,
    });
    if (delivery === HAPTIC_DELIVERY.whenVisible) {
      pendingRestHapticRef.current = timerId;
      return;
    }

    pendingRestHapticRef.current = null;
    if (!claimHapticAttempt(attemptedRestHapticsRef.current, timerId)) return;
    if (delivery === HAPTIC_DELIVERY.now) {
      triggerHaptic(HAPTIC_TYPES.restComplete, { enabled: true });
    }
  }, [isHydrated, timerState.status, timerState.timerId]);

  useEffect(() => {
    if (!timerState.active || !timerState.endTime || !timerState.timerId) return undefined;
    const timerId = timerState.timerId;
    const finishIfExpired = () => {
      if (handledRestTimersRef.current.has(timerId)) return;
      setTimerState((current) => {
        if (current.timerId !== timerId) return current;
        const transition = finishRestTimerState(current);
        if (!transition.didFinish) return current;
        handledRestTimersRef.current.add(timerId);
        return transition.state;
      });
    };
    const delay = Math.max(0, Number(timerState.endTime) - Date.now());
    const timeout = window.setTimeout(finishIfExpired, delay);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') finishIfExpired();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [timerState.active, timerState.endTime, timerState.timerId]);

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
          sessionId: entry.sessionId,
          workoutTitle: entry.workoutTitle,
          workoutFocus: entry.workoutFocus,
          bossEncounter: entry.bossEncounter,
          reportSnapshot: entry.reportSnapshot,
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
      const next = { ...currentProgress, [id]: { ...exerciseProgress, sets } };
      progressRef.current = next;
      return next;
    });
  }, []);

  const startRestTimer = useCallback((duration = 90) => {
    setTimerState(createRestTimerState(duration));
  }, []);

  const toggleSetComplete = useCallback((id, setIndex, restSeconds = 90) => {
    const currentProgress = progressRef.current;
    const exerciseProgress = currentProgress[id] || { sets: [] };
    const sets = [...(exerciseProgress.sets || [])];
    while (sets.length <= setIndex) sets.push(normalizeWorkoutSet());
    const completed = sets[setIndex]?.completed !== true;
    sets[setIndex] = {
      ...normalizeWorkoutSet(sets[setIndex]),
      completed,
      finishedAt: completed ? Date.now() : null,
    };
    const nextProgress = {
      ...currentProgress,
      [id]: { ...exerciseProgress, skipped: false, sets },
    };
    progressRef.current = nextProgress;
    setProgress(nextProgress);

    if (completed) {
      const workoutName = session.workoutName || activeDay;
      const dateKey = session.dateKey || selectedDate;
      const workout = session.workoutSnapshot || workoutData[workoutName];
      const completion = getSessionCompletion(workout, nextProgress, dateKey, workoutName);
      if (shouldStartRestTimer({ setCompleted: true, completion })) startRestTimer(restSeconds);
      else setTimerState(getIdleRestTimerState());
      triggerHaptic(HAPTIC_TYPES.setComplete, { enabled: hapticFeedback });
    }
  }, [activeDay, hapticFeedback, selectedDate, session.dateKey, session.workoutName, session.workoutSnapshot, startRestTimer, workoutData]);

  const beginSession = useCallback(() => {
    const workout = workoutData[activeDay];
    if (!workout) return;
    const sessionId = createSessionId();
    const sessionProgress = getSessionProgress(progressRef.current, selectedDate, activeDay);
    const bossEncounter = createBossEncounter({
      sessionId,
      dateKey: selectedDate,
      workoutName: activeDay,
      workout,
      history: visibleHistory,
    });
    startSession({
      sessionId,
      workoutName: activeDay,
      dateKey: selectedDate,
      workoutSnapshot: workout,
      progress: sessionProgress,
      bossEncounter,
    });
    setSessionNoteState('');
  }, [activeDay, selectedDate, startSession, visibleHistory, workoutData]);

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
    const safeDay = session.workoutName || (workoutData[activeDay] ? activeDay : Object.keys(workoutData)[0]);
    const workout = session.workoutSnapshot || workoutData[safeDay];
    if (!workout) throw new Error('O treino selecionado não existe mais no plano.');
    const sessionDateKey = session.dateKey || selectedDate;
    const completion = getSessionCompletion(workout, progress, sessionDateKey, safeDay);
    if (completion.completedSets === 0 && completion.skippedExercises === 0) {
      throw new Error('Conclua ao menos uma série antes de finalizar o treino.');
    }
    if (completion.incompleteSets > 0 && !allowPartial) {
      return { requiresConfirmation: true, completion };
    }

    markFinishing();
    const exercises = buildSessionExercises(workout, progress, sessionDateKey, safeDay)
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map(normalizeWorkoutSet),
      }));
    const totalVolume = exercises.reduce(
      (sum, exercise) => sum + calculateCompletedVolume(exercise.sets, exercise),
      0,
    );
    const durationSeconds = Math.max(1, workoutTimer.elapsed);
    const editTarget = session.editTarget;
    const historyForMetrics = visibleHistory.filter((entry) => (
      !editTarget || (entry.id !== editTarget.id && entry.localId !== editTarget.localId)
    ));
    const previousSessions = historyForMetrics.filter((entry) => (
      entry.workoutName === safeDay
      && entry.dateKey
      && entry.dateKey <= sessionDateKey
    ));
    const previousVolume = findPreviousComparableVolume(previousSessions);
    const overloadStatus = classifyVolumeProgress({ currentVolume: totalVolume, previousVolume });

    const prsBroken = countLoadPrs(exercises, historyForMetrics);
    const exercisesSwapped = exercises
      .filter((exercise, index) => exercise.name !== workout.exercises[index].name).length;
    const existingEntry = editTarget
      ? visibleHistory.find((entry) => entry.id === editTarget.id || entry.localId === editTarget.localId)
      : null;
    const questEvaluation = existingEntry
      ? { bonusXp: existingEntry.bonusXp || 0, newlyCompleted: [] }
      : evaluateQuests({
          totalVolume,
          duration: durationSeconds,
          hasNote: Boolean(sessionNote.trim()),
          totalSets: completion.totalSets,
          completedSets: completion.completedSets,
          exercisesSwapped,
          prsBroken,
          finished: true,
        }, sessionDateKey);
    const partial = completion.incompleteSets > 0 || completion.skippedExercises > 0;
    const xpGained = calculateSessionXp({
      totalVolume,
      bonusXp: questEvaluation.bonusXp,
      overloadStatus,
    });
    const statsBefore = calculateStats(visibleHistory);
    const badgesBefore = new Set(getUnlockedBadges(visibleHistory).filter((badge) => badge.unlocked).map((badge) => badge.id));
    const bossEncounter = updateBossEncounter(
      session.bossEncounter,
      exercises,
      previousSessions,
      safeDay,
    );
    const reportSnapshot = {
      version: 2,
      sessionId: session.sessionId || createSessionId(),
      dateKey: sessionDateKey,
      workoutName: safeDay,
      workoutTitle: session.workoutTitle || workout.title || safeDay,
      workoutFocus: session.workoutFocus || workout.focus || '',
      duration: durationSeconds,
      volume: totalVolume,
      completedSets: completion.completedSets,
      earnedXp: xpGained,
      prsBroken,
      overloadStatus,
      partial,
      bossEncounter,
    };

    let localEntry = normalizeHistoryEntry({
      id: existingEntry?.id || null,
      localId: existingEntry?.localId,
      sessionId: reportSnapshot.sessionId,
      dateKey: sessionDateKey,
      workoutName: safeDay,
      workoutTitle: reportSnapshot.workoutTitle,
      workoutFocus: reportSnapshot.workoutFocus,
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
      bossEncounter,
      reportSnapshot,
      localRevision: (existingEntry?.localRevision || 0) + 1,
      syncStatus: existingEntry?.id ? HISTORY_SYNC_STATUS.update : HISTORY_SYNC_STATUS.create,
    });
    const localHistory = sortHistoryNewestFirst(existingEntry
      ? history.map((entry) => entry.localId === existingEntry.localId ? localEntry : entry)
      : [localEntry, ...history]);

    writeUserStoredJSON(userId, STORAGE_KEYS.history, localHistory);
    historyRef.current = localHistory;
    setHistory(localHistory);
    questEvaluation.commit?.();
    setLastSessionStats({
      duration: Math.max(1, Math.floor(durationSeconds / 60)),
      volume: totalVolume,
      xp: xpGained,
    });
    const currentPrefix = `${sessionDateKey}-${safeDay}-`;
    setProgress((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(currentPrefix)),
    ));
    progressRef.current = Object.fromEntries(
      Object.entries(progressRef.current).filter(([key]) => !key.startsWith(currentPrefix)),
    );
    setSessionNoteState('');
    setTimerState(getIdleRestTimerState());
    completeSession();

    let savedToCloud = false;
    if (userId && navigator.onLine && !syncInFlight.current) {
      syncInFlight.current = true;
      const submittedRevision = localEntry.localRevision;
      try {
        setSyncStatus('syncing');
        const { data, error } = await writeHistoryWithSchemaFallback(
          (row) => localEntry.id
            ? supabase
                .from('workout_history')
                .update(row)
                .eq('id', localEntry.id)
                .eq('user_id', userId)
                .select()
                .single()
            : supabase.from('workout_history').insert([row]).select().single(),
          localEntry,
          userId,
        );
        if (error) throw error;
        const synced = {
          ...normalizeHistoryEntry(data),
          localId: localEntry.localId,
          partial: localEntry.partial,
          earnedXp: localEntry.earnedXp,
          sessionId: localEntry.sessionId,
          workoutTitle: localEntry.workoutTitle,
          workoutFocus: localEntry.workoutFocus,
          bossEncounter: localEntry.bossEncounter,
          reportSnapshot: localEntry.reportSnapshot,
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

    const finalHistory = sortHistoryNewestFirst(existingEntry
      ? visibleHistory.map((entry) => entry.localId === existingEntry.localId ? localEntry : entry)
      : [localEntry, ...visibleHistory]);
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
      reportSnapshot: {
        ...reportSnapshot,
        streak: calculateStreak(finalHistory),
        level: statsAfter.level || 1,
        newBadges,
        syncStatus: savedToCloud ? 'synced' : (navigator.onLine ? 'pending' : 'offline'),
      },
    };
  }, [activeDay, completeSession, evaluateQuests, history, markFinishing, progress, selectedDate, session, sessionNote, userId, visibleHistory, workoutData, workoutTimer.elapsed]);

  const abandonSession = useCallback(() => {
    const workoutName = session.workoutName || activeDay;
    const dateKey = session.dateKey || selectedDate;
    const prefix = `${dateKey}-${workoutName}-`;
    const nextProgress = Object.fromEntries(
      Object.entries(progressRef.current).filter(([key]) => !key.startsWith(prefix)),
    );
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    setSessionNoteState('');
    setTimerState(getIdleRestTimerState());
    resetSession();
  }, [activeDay, resetSession, selectedDate, session.dateKey, session.workoutName]);

  const reopenHistoryEntry = useCallback((id) => {
    if (sessionActive) throw new Error('Finalize ou descarte o treino atual antes de corrigir outra sessão.');
    const entry = visibleHistory.find((item) => item.id === id || item.localId === id);
    if (!entry) throw new Error('A sessão selecionada não foi encontrada.');
    const workoutSnapshot = {
      title: entry.workoutTitle || entry.workoutName,
      focus: entry.workoutFocus || '',
      exercises: (entry.exercises || []).map((exercise) => ({
        name: exercise.name,
        sets: exercise.actualSets || `${Math.max(1, exercise.sets?.length || 1)}x`,
        note: exercise.note || '',
        alternatives: exercise.alternatives || [],
        loadMode: exercise.loadMode,
        barWeight: exercise.barWeight ?? null,
      })),
    };
    const restoredProgress = Object.fromEntries((entry.exercises || []).map((exercise, index) => [
      `${entry.dateKey}-${entry.workoutName}-${index}`,
      {
        sets: exercise.sets || [],
        actualSets: exercise.actualSets,
        skipped: exercise.skipped === true,
      },
    ]));
    const prefix = `${entry.dateKey}-${entry.workoutName}-`;
    setProgress((current) => {
      const withoutPrevious = Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(prefix)),
      );
      const next = { ...withoutPrevious, ...restoredProgress };
      progressRef.current = next;
      return next;
    });
    setActiveDay(entry.workoutName);
    setSelectedDate(entry.dateKey);
    setSessionNoteState(entry.note || '');
    setTimerState(getIdleRestTimerState());
    reopenSession({
      sessionId: entry.sessionId,
      workoutName: entry.workoutName,
      workoutTitle: entry.workoutTitle,
      workoutFocus: entry.workoutFocus,
      workoutSnapshot,
      dateKey: entry.dateKey,
      elapsedSeconds: entry.duration,
      note: entry.note,
      progress: restoredProgress,
      bossEncounter: entry.bossEncounter,
      editTarget: { id: entry.id, localId: entry.localId },
    });
    return true;
  }, [reopenSession, sessionActive, visibleHistory]);

  const actions = useMemo(() => ({
    updateSetData,
    toggleSetComplete,
    startSession: beginSession,
    pauseSession,
    resumeSession,
    toggleWorkoutTimer,
    resetWorkoutTimer: abandonSession,
    acknowledgeRecovery,
    restoreAfterFailedFinish,
    reopenHistoryEntry,
    finishWorkout,
    syncPendingSessions: syncPendingChanges,
    syncPendingChanges,
    syncPendingWorkoutPlan,
    updateSessionSets: (id, value) => setProgress((current) => {
      const next = { ...current, [id]: { ...current[id], actualSets: value } };
      progressRef.current = next;
      return next;
    }),
    skipExercise: (id, skipped = true) => setProgress((current) => {
      const next = { ...current, [id]: { ...current[id], skipped } };
      progressRef.current = next;
      return next;
    }),
    onSwap: (id, newName, options = {}) => {
      if (hasCompletedExerciseSets(progressRef.current[id])) return false;
      setProgress((current) => {
        const next = { ...current, [id]: { ...current[id], swappedName: newName } };
        progressRef.current = next;
        return next;
      });
      if (options.scope === 'alternative' && Number.isInteger(options.exerciseIndex)) {
        setWorkoutData((currentPlan) => {
          const workoutName = session.workoutName || activeDay;
          const exercises = [...(currentPlan[workoutName]?.exercises || [])];
          exercises[options.exerciseIndex] = addExerciseAlternative(exercises[options.exerciseIndex], newName);
          return { ...currentPlan, [workoutName]: { ...currentPlan[workoutName], exercises } };
        });
      }
      return true;
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
    closeTimer: () => setTimerState(getIdleRestTimerState()),
    adjustRestTimer: (seconds) => setTimerState((current) => ({
      ...current,
      active: true,
      status: 'active',
      endTime: adjustRestTimerEndTime(current.endTime, seconds),
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
            (sum, exercise) => sum + calculateCompletedVolume(exercise.sets, exercise), 0,
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
          exercises: [...current[day].exercises, { name: 'Novo exercício', sets: '3x12', note: '', loadMode: 'total' }],
        },
      })),
      addFromCatalog: (day, exercisesToAdd) => setWorkoutData((current) => ({
        ...current,
        [day]: {
          ...current[day],
          exercises: [
            ...(current[day]?.exercises || []),
            ...exercisesToAdd.map((name) => ({ name, sets: '3x10', note: '', loadMode: 'total' })),
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
    beginSession,
    bodyHistory,
    fetchCloudData,
    finishWorkout,
    pauseSession,
    reopenHistoryEntry,
    restoreAfterFailedFinish,
    resumeSession,
    setSessionNote,
    setWorkoutData,
    syncPendingChanges,
    syncPendingWorkoutPlan,
    toggleSetComplete,
    toggleWorkoutTimer,
    updateSetData,
    userId,
    session.workoutName,
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
      activeWorkout,
      bossEncounter: activeBossEncounter,
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
