export const STORAGE_KEYS = Object.freeze({
  workoutPlan: 'solo:workout-plan',
  history: 'solo:history',
  bodyHistory: 'solo:body-history',
  progress: 'solo:progress',
  activeDay: 'solo:active-day',
  activeSession: 'solo:active-session',
  restTimer: 'solo:rest-timer',
  quests: 'solo:quests',
  questData: 'solo:quest-data',
  settings: 'solo:settings',
  pendingShareCard: 'solo:pending-share-card',
  avatar: 'solo:avatar',
  migrationVersion: 'solo:migration-version',
});
const LEGACY_KEYS = Object.freeze({
  workout_plan: STORAGE_KEYS.workoutPlan,
  workout_history: STORAGE_KEYS.history,
  solo_history: STORAGE_KEYS.history,
  body_history: STORAGE_KEYS.bodyHistory,
  daily_progress: STORAGE_KEYS.progress,
  active_day: STORAGE_KEYS.activeDay,
  workout_stopwatch: STORAGE_KEYS.activeSession,
  daily_quests: STORAGE_KEYS.quests,
  daily_quests_data: STORAGE_KEYS.questData,
  solo_theme: STORAGE_KEYS.settings,
  pending_share_card: STORAGE_KEYS.pendingShareCard,
  soldier_avatar: STORAGE_KEYS.avatar,
});

export const readStoredJSON = (key, fallback, storage = localStorage) => {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const writeStoredJSON = (key, value, storage = localStorage) => {
  storage.setItem(key, JSON.stringify(value));
  return value;
};

export const readStoredText = (key, fallback = '', storage = localStorage) => (
  storage.getItem(key) ?? fallback
);

export const writeStoredText = (key, value, storage = localStorage) => {
  storage.setItem(key, String(value));
  return value;
};

const migrateLegacyStopwatch = (rawValue) => {
  try {
    const oldTimer = JSON.parse(rawValue);
    if (!oldTimer || (!oldTimer.isRunning && !oldTimer.elapsed)) return null;
    return JSON.stringify({
      status: oldTimer.isRunning ? 'active' : 'paused',
      workoutName: null,
      dateKey: null,
      startedAt: oldTimer.isRunning ? oldTimer.startTime : null,
      elapsedSeconds: Number(oldTimer.elapsed) || 0,
      recovered: true,
      updatedAt: Date.now(),
    });
  } catch {
    return null;
  }
};

export const migrateLegacyStorage = (storage = localStorage) => {
  if (storage.getItem(STORAGE_KEYS.migrationVersion) === '1') return [];
  const migrated = [];

  Object.entries(LEGACY_KEYS).forEach(([legacyKey, namespacedKey]) => {
    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue === null) return;

    if (storage.getItem(namespacedKey) === null) {
      let nextValue = legacyValue;
      if (legacyKey === 'workout_stopwatch') nextValue = migrateLegacyStopwatch(legacyValue);
      if (legacyKey === 'solo_theme') nextValue = JSON.stringify({ theme: legacyValue });
      if (nextValue !== null) {
        storage.setItem(namespacedKey, nextValue);
        migrated.push(legacyKey);
      }
    }
    storage.removeItem(legacyKey);
  });

  storage.setItem(STORAGE_KEYS.migrationVersion, '1');
  return migrated;
};

export const getSoloBackup = (storage = localStorage, exportedAt = new Date().toISOString()) => ({
  version: 1,
  exportedAt,
  data: {
    workoutPlan: readStoredJSON(STORAGE_KEYS.workoutPlan, {}, storage),
    history: readStoredJSON(STORAGE_KEYS.history, [], storage),
    bodyHistory: readStoredJSON(STORAGE_KEYS.bodyHistory, [], storage),
    progress: readStoredJSON(STORAGE_KEYS.progress, {}, storage),
    activeDay: readStoredText(STORAGE_KEYS.activeDay, '', storage),
    activeSession: readStoredJSON(STORAGE_KEYS.activeSession, null, storage),
    quests: readStoredJSON(STORAGE_KEYS.quests, [], storage),
    questData: readStoredJSON(STORAGE_KEYS.questData, {}, storage),
    settings: readStoredJSON(STORAGE_KEYS.settings, {}, storage),
  },
});
