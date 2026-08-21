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
  toSupabaseHistoryRow,
} from '../utils/historyModel';
import { countLoadPrs } from '../utils/progressionUtils';
import { calculateCompletedVolume, getSessionCompletion, SESSION_STATUS } from '../utils/sessionModel';
import { QUEST_RULES } from '../utils/questRules';
import {
  readStoredJSON,
  readStoredText,
  STORAGE_KEYS,
  writeStoredJSON,
  writeStoredText,
} from '../utils/storage';
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

const sessionFingerprint = (entry) => [
  entry.dateKey,
  entry.workoutName,
  Math.round(entry.totalVolume || 0),
  Math.round(entry.duration || 0),
].join(':');

const mergeCloudAndLocalHistory = (cloudEntries, localEntries) => {
  const cloud = normalizeHistory(cloudEntries);
  const cloudFingerprints = new Set(cloud.map(sessionFingerprint));
  const pending = normalizeHistory(localEntries)
    .filter((entry) => entry.syncStatus !== 'synced' && !cloudFingerprints.has(sessionFingerprint(entry)));
  return sortHistoryNewestFirst([...pending, ...cloud]);
};

export const useWorkout = () => {
  const {
    session,
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
  } = useWorkoutSession();
  const [userId, setUserId] = useState(null);
  const [workoutData, setWorkoutData] = useState(() => normalizeWorkoutPlan(readStoredJSON(
    STORAGE_KEYS.workoutPlan,
    initialWorkoutData,
  )));
  const [activeDay, setActiveDay] = useState(() => {
    const savedDay = readStoredText(STORAGE_KEYS.activeDay, '');
    const plan = normalizeWorkoutPlan(readStoredJSON(STORAGE_KEYS.workoutPlan, initialWorkoutData));
    return savedDay && plan[savedDay] ? savedDay : getInitialWorkout(plan);
  });
  const [selectedDate, setSelectedDate] = useState(
    () => session.dateKey || getLocalDateKey(),
  );
  const [sessionNote, setSessionNoteState] = useState(() => session.note || '');
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [view, setView] = useState('workout');
  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? 'synced' : 'offline');
  const [isCloudSyncReady, setIsCloudSyncReady] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState({ duration: 0, volume: 0, xp: 0 });
  const syncInFlight = useRef(false);

  const [progress, setProgress] = useState(() => readStoredJSON(STORAGE_KEYS.progress, {}));
  const [history, setHistory] = useState(() => normalizeHistory(readStoredJSON(STORAGE_KEYS.history, [])));
  const [bodyHistory, setBodyHistory] = useState(() => normalizeBodyHistory(
    readStoredJSON(STORAGE_KEYS.bodyHistory, []),
  ));
  const [timerState, setTimerState] = useState(() => {
    const saved = readStoredJSON(STORAGE_KEYS.restTimer, null);
    return saved?.endTime > Date.now() ? saved : { active: false, endTime: null, duration: 90 };
  });

  const setSessionNote = useCallback((note) => {
    setSessionNoteState(note);
    updateSessionNote(note);
  }, [updateSessionNote]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchCloudData = useCallback(async () => {
    if (!userId) return;

    try {
      setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
      const [bodyResult, historyResult, planResult] = await Promise.all([
        supabase.from('body_stats').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('workout_history').select('*').eq('user_id', userId).order('workout_date', { ascending: false }),
        supabase.from('workout_plans').select('plan_data').eq('user_id', userId).limit(1),
      ]);
      if (bodyResult.error) throw bodyResult.error;
      if (historyResult.error) throw historyResult.error;
      if (planResult.error) throw planResult.error;

      if (bodyResult.data) {
        setBodyHistory(normalizeBodyHistory(bodyResult.data));
      }

      const cloudHistory = normalizeHistory(historyResult.data || []).map((entry) => ({
        ...entry,
        syncStatus: 'synced',
      }));
      setHistory((current) => mergeCloudAndLocalHistory(cloudHistory, current));

      const planRow = planResult.data?.[0];
      if (planRow?.plan_data) {
        const parsedPlan = normalizeWorkoutPlan(typeof planRow.plan_data === 'string'
          ? JSON.parse(planRow.plan_data)
          : planRow.plan_data);
        setWorkoutData(parsedPlan);
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
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      setIsCloudSyncReady(true);
    }
  }, [session.dateKey, session.status, session.workoutName, userId]);

  useEffect(() => { fetchCloudData(); }, [fetchCloudData]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.workoutPlan, workoutData);
    writeStoredJSON(STORAGE_KEYS.progress, progress);
    writeStoredJSON(STORAGE_KEYS.history, history);
    writeStoredJSON(STORAGE_KEYS.bodyHistory, bodyHistory);
    writeStoredText(STORAGE_KEYS.activeDay, activeDay);
  }, [activeDay, bodyHistory, history, progress, workoutData]);

  useEffect(() => {
    if (timerState.active) writeStoredJSON(STORAGE_KEYS.restTimer, timerState);
    else localStorage.removeItem(STORAGE_KEYS.restTimer);
  }, [timerState]);

  useEffect(() => {
    if (!isCloudSyncReady || !userId || Object.keys(workoutData).length === 0 || !navigator.onLine) return;
    const syncPlan = async () => {
      const { error } = await supabase
        .from('workout_plans')
        .upsert({ user_id: userId, plan_data: workoutData }, { onConflict: 'user_id' });
      if (error) setSyncStatus('error');
    };
    syncPlan();
  }, [isCloudSyncReady, userId, workoutData]);

  const syncPendingSessions = useCallback(async () => {
    if (!userId || !navigator.onLine || syncInFlight.current) return;
    const pending = history.filter((entry) => entry.syncStatus !== 'synced');
    if (pending.length === 0) {
      setSyncStatus('synced');
      return;
    }

    syncInFlight.current = true;
    setSyncStatus('syncing');
    try {
      for (const entry of pending) {
        const { data: possibleMatches, error: queryError } = await supabase
          .from('workout_history')
          .select('*')
          .eq('user_id', userId)
          .eq('workout_date', entry.dateKey)
          .eq('workout_name', entry.workoutName);
        if (queryError) throw queryError;
        const existing = normalizeHistory(possibleMatches || [])
          .find((candidate) => sessionFingerprint(candidate) === sessionFingerprint(entry));
        let syncedEntry = existing;
        if (!syncedEntry) {
          const { data, error } = await supabase
            .from('workout_history')
            .insert([toSupabaseHistoryRow(entry, userId)])
            .select()
            .single();
          if (error) throw error;
          syncedEntry = normalizeHistoryEntry(data);
        }
        setHistory((current) => current.map((item) => (
          item.localId === entry.localId
            ? { ...syncedEntry, localId: entry.localId, partial: entry.partial, syncStatus: 'synced' }
            : item
        )));
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    } finally {
      syncInFlight.current = false;
    }
  }, [history, userId]);

  useEffect(() => {
    const onOnline = () => {
      setSyncStatus('syncing');
      syncPendingSessions();
    };
    const onOffline = () => setSyncStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [syncPendingSessions]);

  useEffect(() => {
    if (history.some((entry) => entry.syncStatus !== 'synced') && navigator.onLine) {
      syncPendingSessions();
    }
  }, [history, syncPendingSessions]);

  const streak = useMemo(() => calculateStreak(history), [history]);
  const globalRPG = useMemo(() => calculateStats(history), [history]);

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
    const quests = readStoredJSON(STORAGE_KEYS.quests, []);
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
        writeStoredJSON(STORAGE_KEYS.quests, updated);
        const questData = readStoredJSON(STORAGE_KEYS.questData, {});
        writeStoredJSON(STORAGE_KEYS.questData, { ...questData, quests: updated });
        window.dispatchEvent(new Event('quest_update'));
      },
    };
  }, []);

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
    const previousSessions = history.filter((entry) => entry.workoutName === safeDay);
    const previousVolume = previousSessions[0]?.totalVolume || 0;
    const overloadStatus = previousVolume > 0 && totalVolume > previousVolume ? 'OVERLOAD' : 'MANUTENÇÃO';
    const xpMultiplier = overloadStatus === 'OVERLOAD' ? 1.2 : 1;

    const prsBroken = countLoadPrs(exercises, history, safeDay);
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
    const xpGained = Math.floor(totalVolume * 0.05 * xpMultiplier) + questEvaluation.bonusXp;
    const statsBefore = calculateStats(history);
    const badgesBefore = new Set(getUnlockedBadges(history).filter((badge) => badge.unlocked).map((badge) => badge.id));

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
      partial: completion.incompleteSets > 0 || completion.skippedExercises > 0,
      syncStatus: 'pending',
    });
    const localHistory = sortHistoryNewestFirst([localEntry, ...history]);

    writeStoredJSON(STORAGE_KEYS.history, localHistory);
    setHistory(localHistory);
    questEvaluation.commit?.();
    setLastSessionStats({
      duration: Math.max(1, Math.floor(durationSeconds / 60)),
      volume: totalVolume,
      xp: xpGained,
    });

    let savedToCloud = false;
    if (userId && navigator.onLine) {
      try {
        setSyncStatus('syncing');
        const { data, error } = await supabase.from('workout_history')
          .insert([toSupabaseHistoryRow(localEntry, userId)]).select().single();
        if (error) throw error;
        const synced = { ...normalizeHistoryEntry(data), localId: localEntry.localId, partial: localEntry.partial, syncStatus: 'synced' };
        localEntry = synced;
        setHistory((current) => current.map((entry) => (entry.localId === synced.localId ? synced : entry)));
        savedToCloud = true;
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    } else {
      setSyncStatus('offline');
    }

    const finalHistory = sortHistoryNewestFirst([localEntry, ...history]);
    const statsAfter = calculateStats(finalHistory);
    const newBadges = getUnlockedBadges(finalHistory)
      .filter((badge) => badge.unlocked && !badgesBefore.has(badge.id));
    const currentPrefix = `${selectedDate}-${safeDay}-`;
    setProgress((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(currentPrefix)),
    ));
    setSessionNoteState('');
    setTimerState({ active: false, endTime: null, duration: 90 });
    completeSession();

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
      partial: completion.incompleteSets > 0 || completion.skippedExercises > 0,
    };
  }, [activeDay, completeSession, evaluateQuests, history, markFinishing, progress, selectedDate, sessionNote, userId, workoutData, workoutTimer.elapsed]);

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
    syncPendingSessions,
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
        if (id) await supabase.from('body_stats').delete().eq('id', id);
        return;
      }
      setHistory((current) => current.filter((entry) => entry.id !== id && entry.localId !== id));
      if (id && !String(id).startsWith('local-')) {
        await supabase.from('workout_history').delete().eq('id', id);
      }
    },
    updateHistoryEntry: async (id, updatedSession) => {
      const normalized = normalizeHistoryEntry(updatedSession);
      const totalVolume = normalized.exercises.reduce(
        (sum, exercise) => sum + calculateCompletedVolume(exercise.sets), 0,
      );
      const next = { ...normalized, totalVolume, syncStatus: normalized.id ? 'synced' : 'pending' };
      setHistory((current) => current.map((entry) => (
        entry.id === id || entry.localId === id ? next : entry
      )));
      if (normalized.id) {
        await supabase.from('workout_history')
          .update(toSupabaseHistoryRow(next, userId)).eq('id', normalized.id);
      }
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
    syncPendingSessions,
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
      history,
      bodyHistory,
      timerState,
      workoutTimer,
      session,
      syncStatus,
      hasPendingChanges: history.some((entry) => entry.syncStatus !== 'synced'),
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
