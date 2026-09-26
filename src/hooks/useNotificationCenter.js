import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLocalDateKey, parseLocalDateKey } from '../utils/dateUtils';
import {
  buildMuscleGapNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationCandidates,
  MUSCLE_GAP_DEDUPE_KEY,
  normalizeNotificationState,
} from '../utils/notificationModel';
import { readUserStoredJSON, STORAGE_KEYS, writeUserStoredJSON } from '../utils/storage';

const EMPTY_CENTER = Object.freeze({
  items: [],
  emissions: {},
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
});

const getFutureDateKey = (days) => {
  const date = parseLocalDateKey(getLocalDateKey()) || new Date();
  date.setDate(date.getDate() + Math.max(0, Number(days) || 0));
  return getLocalDateKey(date);
};

export const useNotificationCenter = (userId, { workoutData, history } = {}) => {
  const [center, setCenter] = useState(() => normalizeNotificationState(EMPTY_CENTER));
  const [hydratedUserId, setHydratedUserId] = useState(null);
  const referenceDateKey = getLocalDateKey();
  const muscleGapsEnabled = center.preferences.muscleGaps;
  const pauseUntil = center.preferences.pauseUntil;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!userId) {
        setCenter(normalizeNotificationState(EMPTY_CENTER));
        setHydratedUserId(null);
        return;
      }
      setCenter(normalizeNotificationState(
        readUserStoredJSON(userId, STORAGE_KEYS.notifications, EMPTY_CENTER),
      ));
      setHydratedUserId(userId);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const candidate = useMemo(() => buildMuscleGapNotification({
    workoutData,
    history,
    preferences: { muscleGaps: muscleGapsEnabled, pauseUntil },
    referenceDateKey,
  }), [history, muscleGapsEnabled, pauseUntil, referenceDateKey, workoutData]);

  useEffect(() => {
    if (!userId || hydratedUserId !== userId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCenter((current) => {
        if (candidate) return mergeNotificationCandidates(current, candidate);
        if (!muscleGapsEnabled || pauseUntil) return current;
        const items = current.items.filter((item) => item.dedupeKey !== MUSCLE_GAP_DEDUPE_KEY);
        return items.length === current.items.length ? current : { ...current, items };
      });
    });
    return () => { cancelled = true; };
  }, [candidate, hydratedUserId, muscleGapsEnabled, pauseUntil, userId]);

  useEffect(() => {
    if (!userId || hydratedUserId !== userId) return;
    writeUserStoredJSON(userId, STORAGE_KEYS.notifications, center);
  }, [center, hydratedUserId, userId]);

  const markRead = useCallback((id) => {
    setCenter((current) => ({
      ...current,
      items: current.items.map((item) => item.id === id ? { ...item, read: true } : item),
    }));
  }, []);

  const markAllRead = useCallback(() => {
    setCenter((current) => ({
      ...current,
      items: current.items.map((item) => ({ ...item, read: true })),
    }));
  }, []);

  const dismiss = useCallback((id) => {
    setCenter((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  }, []);

  const setCategoryEnabled = useCallback((key, enabled) => {
    setCenter((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: enabled },
    }));
  }, []);

  const pauseForDays = useCallback((days) => {
    setCenter((current) => ({
      ...current,
      preferences: { ...current.preferences, pauseUntil: days > 0 ? getFutureDateKey(days) : null },
    }));
  }, []);

  const unreadCount = useMemo(() => center.items.filter((item) => !item.read).length, [center.items]);

  return {
    items: center.items,
    preferences: center.preferences,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    setCategoryEnabled,
    pauseForDays,
  };
};
