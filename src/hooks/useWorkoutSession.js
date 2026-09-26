import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSessionId, SESSION_STATUS } from '../utils/sessionModel';
import {
  readUserStoredJSON,
  removeUserStoredItem,
  STORAGE_KEYS,
  writeUserStoredJSON,
} from '../utils/storage';

const EMPTY_SESSION = Object.freeze({
  status: SESSION_STATUS.idle,
  sessionId: null,
  workoutName: null,
  workoutTitle: '',
  workoutFocus: '',
  workoutSnapshot: null,
  dateKey: null,
  startedAt: null,
  elapsedSeconds: 0,
  note: '',
  recovered: false,
  progress: {},
  substitutions: {},
  bossEncounter: null,
  editTarget: null,
  updatedAt: null,
});

const calculateElapsed = (session, now = Date.now()) => {
  const stored = Number(session?.elapsedSeconds) || 0;
  if (session?.status !== SESSION_STATUS.active || !session.startedAt) return stored;
  return stored + Math.max(0, Math.floor((now - session.startedAt) / 1000));
};

export const useWorkoutSession = (userId) => {
  const [session, setSession] = useState({ ...EMPTY_SESSION });
  const [hydratedUserId, setHydratedUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!userId) {
        setSession({ ...EMPTY_SESSION });
        setHydratedUserId(null);
        return;
      }
      const saved = readUserStoredJSON(userId, STORAGE_KEYS.activeSession, null);
      setSession(!saved || saved.status === SESSION_STATUS.completed
        ? { ...EMPTY_SESSION }
        : { ...EMPTY_SESSION, ...saved, recovered: saved.status !== SESSION_STATUS.idle });
      setHydratedUserId(userId);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!userId || hydratedUserId !== userId) return;
    if (session.status === SESSION_STATUS.idle || session.status === SESSION_STATUS.completed) {
      removeUserStoredItem(userId, STORAGE_KEYS.activeSession);
      return;
    }
    writeUserStoredJSON(userId, STORAGE_KEYS.activeSession, { ...session, recovered: false });
  }, [hydratedUserId, session, userId]);

  useEffect(() => {
    if (session.status !== SESSION_STATUS.active) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session.status]);

  const startSession = useCallback(({
    workoutName,
    dateKey,
    workoutSnapshot,
    progress = {},
    bossEncounter = null,
    sessionId = createSessionId(),
  }) => {
    const timestamp = Date.now();
    setNow(timestamp);
    setSession({
      ...EMPTY_SESSION,
      status: SESSION_STATUS.active,
      sessionId,
      workoutName,
      workoutTitle: workoutSnapshot?.title || workoutName,
      workoutFocus: workoutSnapshot?.focus || '',
      workoutSnapshot: workoutSnapshot ? structuredClone(workoutSnapshot) : null,
      dateKey,
      progress,
      bossEncounter,
      startedAt: timestamp,
      updatedAt: timestamp,
    });
  }, []);

  const reopenSession = useCallback(({
    sessionId,
    workoutName,
    workoutTitle,
    workoutFocus,
    workoutSnapshot,
    dateKey,
    elapsedSeconds,
    note,
    progress,
    bossEncounter,
    editTarget,
  }) => {
    setSession({
      ...EMPTY_SESSION,
      status: SESSION_STATUS.paused,
      sessionId: sessionId || createSessionId(),
      workoutName,
      workoutTitle: workoutTitle || workoutSnapshot?.title || workoutName,
      workoutFocus: workoutFocus || workoutSnapshot?.focus || '',
      workoutSnapshot: workoutSnapshot ? structuredClone(workoutSnapshot) : null,
      dateKey,
      elapsedSeconds: Math.max(0, Number(elapsedSeconds) || 0),
      note: note || '',
      progress: progress || {},
      bossEncounter: bossEncounter || null,
      editTarget: editTarget || null,
      recovered: false,
      updatedAt: Date.now(),
    });
  }, []);

  const pauseSession = useCallback(() => {
    setSession((current) => {
      if (current.status !== SESSION_STATUS.active) return current;
      return {
        ...current,
        status: SESSION_STATUS.paused,
        elapsedSeconds: calculateElapsed(current),
        startedAt: null,
        updatedAt: Date.now(),
      };
    });
  }, []);

  const resumeSession = useCallback(() => {
    setNow(Date.now());
    setSession((current) => {
      if (current.status !== SESSION_STATUS.paused) return current;
      return { ...current, status: SESSION_STATUS.active, startedAt: Date.now(), updatedAt: Date.now() };
    });
  }, []);

  const markFinishing = useCallback(() => {
    setSession((current) => ({
      ...current,
      status: SESSION_STATUS.finishing,
      elapsedSeconds: calculateElapsed(current),
      startedAt: null,
      updatedAt: Date.now(),
    }));
  }, []);

  const restoreAfterFailedFinish = useCallback(() => {
    setSession((current) => ({
      ...current,
      status: SESSION_STATUS.paused,
      startedAt: null,
      updatedAt: Date.now(),
    }));
  }, []);

  const completeSession = useCallback(() => {
    setSession({ ...EMPTY_SESSION, status: SESSION_STATUS.completed, updatedAt: Date.now() });
  }, []);

  const resetSession = useCallback(() => setSession({ ...EMPTY_SESSION }), []);

  const acknowledgeRecovery = useCallback(() => {
    setSession((current) => ({ ...current, recovered: false }));
  }, []);

  const updateSessionNote = useCallback((note) => {
    setSession((current) => (
      current.status === SESSION_STATUS.idle ? current : { ...current, note, updatedAt: Date.now() }
    ));
  }, []);

  const updateSessionSnapshot = useCallback((patch) => {
    setSession((current) => {
      if ([SESSION_STATUS.idle, SESSION_STATUS.completed].includes(current.status)) return current;
      const nextPatch = typeof patch === 'function' ? patch(current) : patch;
      return { ...current, ...nextPatch, updatedAt: Date.now() };
    });
  }, []);

  const elapsed = calculateElapsed(session, now);
  const workoutTimer = useMemo(() => ({
    isRunning: session.status === SESSION_STATUS.active,
    startTime: session.startedAt,
    elapsed,
    status: session.status,
    recovered: session.recovered,
    workoutName: session.workoutName,
    dateKey: session.dateKey,
    sessionId: session.sessionId,
  }), [elapsed, session]);

  const toggleWorkoutTimer = useCallback(() => {
    if (session.status === SESSION_STATUS.active) pauseSession();
    else if (session.status === SESSION_STATUS.paused) resumeSession();
  }, [pauseSession, resumeSession, session.status]);

  return {
    session,
    isHydrated: Boolean(userId && hydratedUserId === userId),
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
  };
};
