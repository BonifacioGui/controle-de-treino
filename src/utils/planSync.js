export const DEFAULT_PLAN_SYNC = Object.freeze({ dirty: false, revision: 0 });

export const normalizePlanSync = (value) => ({
  dirty: value?.dirty === true,
  revision: Math.max(0, Number(value?.revision) || 0),
});

export const markPlanDirty = (current) => {
  const normalized = normalizePlanSync(current);
  return { dirty: true, revision: normalized.revision + 1 };
};

export const markPlanSynced = (current, syncedRevision) => {
  const normalized = normalizePlanSync(current);
  return normalized.revision === syncedRevision ? { ...normalized, dirty: false } : normalized;
};
