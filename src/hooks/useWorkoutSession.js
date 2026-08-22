import { useCallback, useEffect, useMemo, useState } from 'react';
import { SESSION_STATUS } from '../utils/sessionModel';
import {
  readUserStoredJSON,
  removeUserStoredItem,
  STORAGE_KEYS,
  writeUserStoredJSON,
} from '../utils/storage';

const EMPTY_SESSION = Object.freeze({
  status: SESSION_STATUS.idle,
  workoutName: null,
  dateKey: null,
  startedAt: null,
  elapsedSeconds: 0,
  note: '',
  recovered: false,
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

  const startSession = useCallback(({ workoutName, dateKey }) => {
    setNow(Date.now());
    setSession({
      ...EMPTY_SESSION,
      status: SESSION_STATUS.active,
      workoutName,
      dateKey,
      startedAt: Date.now(),
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

  const elapsed = calculateElapsed(session, now);
  const workoutTimer = useMemo(() => ({
    isRunning: session.status === SESSION_STATUS.active,
    startTime: session.startedAt,
    elapsed,
    status: session.status,
    recovered: session.recovered,
    workoutName: session.workoutName,
    dateKey: session.dateKey,
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
    pauseSession,
    resumeSession,
    toggleWorkoutTimer,
    markFinishing,
    restoreAfterFailedFinish,
    completeSession,
    resetSession,
    acknowledgeRecovery,
    updateSessionNote,
  };
};
