export const PLAN_SYNC_STATUS = Object.freeze({
  CLEAN: 'clean',
  PENDING: 'pending',
  LEGACY: 'legacy',
  CONFLICT: 'conflict',
  SCHEMA_REQUIRED: 'schema-required',
});

export const DEFAULT_PLAN_SYNC = Object.freeze({
  dirty: false,
  revision: 0,
  status: PLAN_SYNC_STATUS.CLEAN,
  baseVersionId: null,
  remoteRevision: 0,
  remoteUpdatedAt: null,
  pendingSource: null,
  conflict: null,
});

const clone = (value) => {
  if (value == null) return value;
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
};

const sortValue = (value) => {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = sortValue(value[key]);
      return result;
    }, {});
};

export const plansEqual = (left, right) =>
  JSON.stringify(sortValue(left ?? null)) === JSON.stringify(sortValue(right ?? null));

export const normalizePlanSync = (value) => {
  const dirty = value?.dirty === true;
  const explicitStatus = Object.values(PLAN_SYNC_STATUS).includes(value?.status)
    ? value.status
    : null;

  return {
    ...DEFAULT_PLAN_SYNC,
    dirty,
    revision: Math.max(0, Number(value?.revision) || 0),
    status: explicitStatus || (dirty ? PLAN_SYNC_STATUS.PENDING : PLAN_SYNC_STATUS.CLEAN),
    baseVersionId: value?.baseVersionId || null,
    remoteRevision: Math.max(0, Number(value?.remoteRevision) || 0),
    remoteUpdatedAt: value?.remoteUpdatedAt || null,
    pendingSource: value?.pendingSource || (dirty ? 'legacy-pending' : null),
    conflict: value?.conflict ? clone(value.conflict) : null,
  };
};

export const markPlanDirty = (current, source = 'user-edit') => {
  const normalized = normalizePlanSync(current);
  return {
    ...normalized,
    dirty: true,
    revision: normalized.revision + 1,
    status: PLAN_SYNC_STATUS.PENDING,
    pendingSource: source,
    conflict: null,
  };
};

export const markPlanAsLegacy = (current) => ({
  ...normalizePlanSync(current),
  dirty: false,
  status: PLAN_SYNC_STATUS.LEGACY,
  pendingSource: 'legacy-migration',
  baseVersionId: null,
  conflict: null,
});

export const markSchemaRequired = (current) => ({
  ...normalizePlanSync(current),
  status: PLAN_SYNC_STATUS.SCHEMA_REQUIRED,
});

export const markPlanSynced = (current, syncedRevision, remote = {}) => {
  const normalized = normalizePlanSync(current);
  if (normalized.revision !== syncedRevision) return normalized;

  return {
    ...normalized,
    dirty: false,
    status: PLAN_SYNC_STATUS.CLEAN,
    baseVersionId: remote.versionId || remote.version_id || normalized.baseVersionId,
    remoteRevision: Math.max(
      normalized.remoteRevision,
      Number(remote.revision ?? remote.remoteRevision) || 0,
    ),
    remoteUpdatedAt: remote.updatedAt || remote.updated_at || normalized.remoteUpdatedAt,
    pendingSource: null,
    conflict: null,
  };
};

export const acceptRemotePlan = (current, remote = {}) => ({
  ...normalizePlanSync(current),
  dirty: false,
  status: PLAN_SYNC_STATUS.CLEAN,
  baseVersionId: remote.versionId || remote.version_id || null,
  remoteRevision: Math.max(0, Number(remote.revision) || 0),
  remoteUpdatedAt: remote.updatedAt || remote.updated_at || null,
  pendingSource: null,
  conflict: null,
});

export const createPlanConflict = (current, localPlan, remote, reason) => ({
  ...normalizePlanSync(current),
  dirty: false,
  status: PLAN_SYNC_STATUS.CONFLICT,
  conflict: {
    reason,
    detectedAt: new Date().toISOString(),
    localPlan: clone(localPlan),
    remotePlan: clone(remote?.planData),
    remoteVersionId: remote?.versionId || null,
    remoteRevision: Math.max(0, Number(remote?.revision) || 0),
    remoteUpdatedAt: remote?.updatedAt || null,
  },
});

export const reconcileWorkoutPlan = ({ localPlan, syncState, remote, schemaReady = true }) => {
  const normalized = normalizePlanSync(syncState);

  if (!schemaReady) {
    if (remote && (!localPlan || plansEqual(localPlan, remote.planData) || (!normalized.dirty && normalized.status === PLAN_SYNC_STATUS.CLEAN))) {
      return {
        action: 'remote',
        plan: remote.planData,
        sync: markSchemaRequired(acceptRemotePlan(normalized, remote)),
      };
    }
    return { action: 'blocked', plan: localPlan, sync: markSchemaRequired(normalized) };
  }

  if (!remote) {
    if (!localPlan) return { action: 'none', plan: localPlan, sync: normalized };
    if (normalized.dirty && normalized.status === PLAN_SYNC_STATUS.PENDING) {
      return { action: 'upload', plan: localPlan, sync: normalized };
    }
    return {
      action: 'conflict',
      plan: localPlan,
      sync: createPlanConflict(normalized, localPlan, null, 'remote-missing'),
    };
  }

  if (plansEqual(localPlan, remote.planData)) {
    return { action: 'remote', plan: remote.planData, sync: acceptRemotePlan(normalized, remote) };
  }

  if (normalized.status === PLAN_SYNC_STATUS.CLEAN && !normalized.dirty) {
    return { action: 'remote', plan: remote.planData, sync: acceptRemotePlan(normalized, remote) };
  }

  if (
    normalized.status === PLAN_SYNC_STATUS.PENDING &&
    normalized.dirty &&
    normalized.baseVersionId &&
    normalized.baseVersionId === remote.versionId
  ) {
    return { action: 'upload', plan: localPlan, sync: normalized };
  }

  return {
    action: 'conflict',
    plan: localPlan,
    sync: createPlanConflict(
      normalized,
      localPlan,
      remote,
      normalized.status === PLAN_SYNC_STATUS.LEGACY ? 'legacy-local-plan' : 'remote-changed',
    ),
  };
};

export const resolvePlanConflict = (current, choice) => {
  const normalized = normalizePlanSync(current);
  if (!normalized.conflict) return { plan: null, sync: normalized };

  if (choice === 'remote') {
    const remote = {
      versionId: normalized.conflict.remoteVersionId,
      revision: normalized.conflict.remoteRevision,
      updatedAt: normalized.conflict.remoteUpdatedAt,
    };
    return {
      plan: clone(normalized.conflict.remotePlan),
      sync: acceptRemotePlan(normalized, remote),
    };
  }

  if (choice === 'local') {
    return {
      plan: clone(normalized.conflict.localPlan),
      sync: {
        ...normalized,
        dirty: true,
        revision: normalized.revision + 1,
        status: PLAN_SYNC_STATUS.PENDING,
        baseVersionId: normalized.conflict.remoteVersionId,
        remoteRevision: normalized.conflict.remoteRevision,
        remoteUpdatedAt: normalized.conflict.remoteUpdatedAt,
        pendingSource: 'conflict-resolution-local',
        conflict: null,
      },
    };
  }

  return { plan: null, sync: normalized };
};

export const canAutoSyncPlan = (value) => {
  const normalized = normalizePlanSync(value);
  return normalized.dirty && normalized.status === PLAN_SYNC_STATUS.PENDING && !normalized.conflict;
};
