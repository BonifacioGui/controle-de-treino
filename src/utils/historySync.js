import { normalizeHistory, sortHistoryNewestFirst } from './historyModel';

export const HISTORY_SYNC_STATUS = Object.freeze({
  synced: 'synced',
  create: 'pending-create',
  update: 'pending-update',
  delete: 'pending-delete',
});

export const sessionFingerprint = (entry) => entry.sessionId
  ? `session:${entry.sessionId}`
  : [
      entry.dateKey,
      entry.workoutName,
      Math.round(entry.totalVolume || 0),
      Math.round(entry.duration || 0),
    ].join(':');

export const isPendingHistoryEntry = (entry) => entry.syncStatus !== HISTORY_SYNC_STATUS.synced;
export const isVisibleHistoryEntry = (entry) => entry.syncStatus !== HISTORY_SYNC_STATUS.delete;

export const mergeCloudAndLocalHistory = (cloudEntries, localEntries) => {
  const cloud = normalizeHistory(cloudEntries).map((entry) => ({
    ...entry,
    syncStatus: HISTORY_SYNC_STATUS.synced,
  }));
  const pending = normalizeHistory(localEntries).filter(isPendingHistoryEntry);
  const remoteIdsReplacedLocally = new Set(
    pending
      .filter((entry) => entry.id && [HISTORY_SYNC_STATUS.update, HISTORY_SYNC_STATUS.delete].includes(entry.syncStatus))
      .map((entry) => String(entry.id)),
  );
  const deletedFingerprintsWithoutRemoteId = new Set(
    pending
      .filter((entry) => !entry.id && entry.syncStatus === HISTORY_SYNC_STATUS.delete)
      .map(sessionFingerprint),
  );
  const cloudFingerprints = new Set(cloud.map(sessionFingerprint));
  const pendingWithoutAlreadySyncedCreates = pending.filter((entry) => !(
    [HISTORY_SYNC_STATUS.create, 'pending'].includes(entry.syncStatus)
    && cloudFingerprints.has(sessionFingerprint(entry))
  ));
  const untouchedCloud = cloud.filter((entry) => (
    !remoteIdsReplacedLocally.has(String(entry.id))
    && !deletedFingerprintsWithoutRemoteId.has(sessionFingerprint(entry))
  ));

  return sortHistoryNewestFirst([...pendingWithoutAlreadySyncedCreates, ...untouchedCloud]);
};

export const getVisibleHistory = (history) => history.filter(isVisibleHistoryEntry);
