import { normalizeHistory, sortHistoryNewestFirst } from './historyModel';

export const STORAGE_KEYS = Object.freeze({
  workoutPlan: 'solo:workout-plan',
  planSync: 'solo:plan-sync',
  history: 'solo:history',
  bodyHistory: 'solo:body-history',
  progress: 'solo:progress',
  activeDay: 'solo:active-day',
  activeSession: 'solo:active-session',
  restTimer: 'solo:rest-timer',
  quests: 'solo:quests',
  questData: 'solo:quest-data',
  settings: 'solo:settings',
  bossIntroSeen: 'solo:boss-intro-seen',
  pendingShareCard: 'solo:pending-share-card',
  avatar: 'solo:avatar',
  migrationVersion: 'solo:migration-version',
});

const USER_STORAGE_PREFIX = 'solo:user';
const USER_MIGRATION_VERSION = '3';

const LEGACY_SOURCES = Object.freeze({
  workoutPlan: [STORAGE_KEYS.workoutPlan, 'workout_plan'],
  history: [STORAGE_KEYS.history, 'workout_history', 'solo_history'],
  bodyHistory: [STORAGE_KEYS.bodyHistory, 'body_history'],
  progress: [STORAGE_KEYS.progress, 'daily_progress'],
  activeDay: [STORAGE_KEYS.activeDay, 'active_day'],
  activeSession: [STORAGE_KEYS.activeSession, 'workout_stopwatch'],
  restTimer: [STORAGE_KEYS.restTimer],
  quests: [STORAGE_KEYS.quests, 'daily_quests'],
  questData: [STORAGE_KEYS.questData, 'daily_quests_data'],
  pendingShareCard: [STORAGE_KEYS.pendingShareCard, 'pending_share_card'],
  avatar: [STORAGE_KEYS.avatar, 'soldier_avatar'],
});

const JSON_STORAGE_NAMES = new Set([
  'workoutPlan',
  'history',
  'bodyHistory',
  'progress',
  'activeSession',
  'restTimer',
  'quests',
  'questData',
  'pendingShareCard',
  'bossIntroSeen',
]);

export const getUserStorageKey = (userId, key) => {
  if (!userId) throw new Error('userId é obrigatório para acessar dados privados.');
  const suffix = String(key).replace(/^solo:/, '');
  return `${USER_STORAGE_PREFIX}:${userId}:${suffix}`;
};

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

export const readUserStoredJSON = (userId, key, fallback, storage = localStorage) => (
  readStoredJSON(getUserStorageKey(userId, key), fallback, storage)
);

export const writeUserStoredJSON = (userId, key, value, storage = localStorage) => (
  writeStoredJSON(getUserStorageKey(userId, key), value, storage)
);

export const readUserStoredText = (userId, key, fallback = '', storage = localStorage) => (
  readStoredText(getUserStorageKey(userId, key), fallback, storage)
);

export const writeUserStoredText = (userId, key, value, storage = localStorage) => (
  writeStoredText(getUserStorageKey(userId, key), value, storage)
);

export const removeUserStoredItem = (userId, key, storage = localStorage) => {
  storage.removeItem(getUserStorageKey(userId, key));
};

const parseJSON = (rawValue) => {
  try {
    return { valid: true, value: JSON.parse(rawValue) };
  } catch {
    return { valid: false, value: null };
  }
};

const migrateLegacyStopwatch = (value) => {
  if (!value || (!value.isRunning && !value.elapsed)) return null;
  return {
    status: value.isRunning ? 'active' : 'paused',
    workoutName: null,
    dateKey: null,
    startedAt: value.isRunning ? value.startTime : null,
    elapsedSeconds: Number(value.elapsed) || 0,
    recovered: true,
    updatedAt: Date.now(),
  };
};

const mergeHistorySources = (sources) => {
  const seen = new Set();
  const merged = [];

  normalizeHistory(sources.flat()).forEach((entry) => {
    const fingerprint = JSON.stringify([
      entry.dateKey,
      entry.workoutName,
      Math.round(entry.totalVolume || 0),
      Math.round(entry.duration || 0),
      entry.note || '',
      entry.exercises,
    ]);
    const identities = [
      entry.id ? `id:${entry.id}` : null,
      entry.localId ? `local:${entry.localId}` : null,
      `fingerprint:${fingerprint}`,
    ].filter(Boolean);
    if (identities.some((identity) => seen.has(identity))) return;
    identities.forEach((identity) => seen.add(identity));
    merged.push(entry);
  });

  return sortHistoryNewestFirst(merged);
};

const mergeObjectSources = (sources) => sources
  .slice()
  .reverse()
  .reduce((merged, value) => (
    value && typeof value === 'object' && !Array.isArray(value) ? { ...merged, ...value } : merged
  ), {});

export const migrateLegacyStorage = (userId, storage = localStorage) => {
  if (!userId) return [];
  const migrationKey = getUserStorageKey(userId, STORAGE_KEYS.migrationVersion);
  if (storage.getItem(migrationKey) === USER_MIGRATION_VERSION) return [];

  const migrated = [];
  let migratedWorkoutPlan = false;
  let hasInvalidLegacyData = false;

  Object.entries(LEGACY_SOURCES).forEach(([name, sourceKeys]) => {
    const targetKey = getUserStorageKey(userId, STORAGE_KEYS[name]);
    const scopedRaw = storage.getItem(targetKey);
    const parsedSources = [];
    if (scopedRaw !== null) {
      const parsed = JSON_STORAGE_NAMES.has(name) ? parseJSON(scopedRaw) : { valid: true, value: scopedRaw };
      if (parsed.valid) parsedSources.push(parsed.value);
      else hasInvalidLegacyData = true;
    }

    const removableKeys = [];
    sourceKeys.forEach((sourceKey) => {
      const rawValue = storage.getItem(sourceKey);
      if (rawValue === null) return;
      const parsed = JSON_STORAGE_NAMES.has(name) ? parseJSON(rawValue) : { valid: true, value: rawValue };
      if (!parsed.valid) {
        hasInvalidLegacyData = true;
        return;
      }
      let value = parsed.value;
      if (sourceKey === 'workout_stopwatch') value = migrateLegacyStopwatch(value);
      if (value !== null) parsedSources.push(value);
      removableKeys.push(sourceKey);
      migrated.push(sourceKey);
      if (name === 'workoutPlan') migratedWorkoutPlan = true;
    });

    if (parsedSources.length > 0) {
      let nextValue = parsedSources[0];
      if (name === 'history') nextValue = mergeHistorySources(parsedSources);
      if (name === 'workoutPlan' || name === 'progress') nextValue = mergeObjectSources(parsedSources);
      if (JSON_STORAGE_NAMES.has(name)) writeStoredJSON(targetKey, nextValue, storage);
      else writeStoredText(targetKey, nextValue, storage);
      removableKeys.forEach((sourceKey) => storage.removeItem(sourceKey));
    }
  });

  const legacyTheme = storage.getItem('solo_theme');
  if (legacyTheme !== null) {
    const settings = readStoredJSON(STORAGE_KEYS.settings, {}, storage);
    writeStoredJSON(STORAGE_KEYS.settings, { theme: legacyTheme, ...settings }, storage);
    storage.removeItem('solo_theme');
    migrated.push('solo_theme');
  }

  if (migratedWorkoutPlan && storage.getItem(getUserStorageKey(userId, STORAGE_KEYS.planSync)) === null) {
    writeUserStoredJSON(userId, STORAGE_KEYS.planSync, { dirty: true, revision: 1 }, storage);
  }

  if (!hasInvalidLegacyData) storage.setItem(migrationKey, USER_MIGRATION_VERSION);
  return migrated;
};

export const getSoloBackup = (userId, storage = localStorage, exportedAt = new Date().toISOString()) => ({
  version: 3,
  exportedAt,
  data: {
    workoutPlan: readUserStoredJSON(userId, STORAGE_KEYS.workoutPlan, {}, storage),
    history: readUserStoredJSON(userId, STORAGE_KEYS.history, [], storage),
    bodyHistory: readUserStoredJSON(userId, STORAGE_KEYS.bodyHistory, [], storage),
    progress: readUserStoredJSON(userId, STORAGE_KEYS.progress, {}, storage),
    activeDay: readUserStoredText(userId, STORAGE_KEYS.activeDay, '', storage),
    activeSession: readUserStoredJSON(userId, STORAGE_KEYS.activeSession, null, storage),
    restTimer: readUserStoredJSON(userId, STORAGE_KEYS.restTimer, null, storage),
    quests: readUserStoredJSON(userId, STORAGE_KEYS.quests, [], storage),
    questData: readUserStoredJSON(userId, STORAGE_KEYS.questData, {}, storage),
    settings: readStoredJSON(STORAGE_KEYS.settings, {}, storage),
  },
});
