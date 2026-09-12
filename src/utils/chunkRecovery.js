export const CHUNK_RECOVERY_STORAGE_KEY = 'solo:chunk-recovery';
export const CHUNK_RECOVERY_WINDOW_MS = 60_000;

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /unable to preload css/i,
];

export const getChunkFailureMessage = (payload) => {
  if (typeof payload === 'string') return payload;
  if (payload instanceof Error) return payload.message;
  return typeof payload?.message === 'string' ? payload.message : '';
};

export const isChunkLoadError = (payload) => {
  const message = getChunkFailureMessage(payload);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

export const parseChunkRecoveryAttempt = (serializedAttempt) => {
  if (!serializedAttempt) return null;

  try {
    const attempt = typeof serializedAttempt === 'string'
      ? JSON.parse(serializedAttempt)
      : serializedAttempt;
    const attemptedAt = Number(attempt?.attemptedAt);

    if (!Number.isFinite(attemptedAt) || attemptedAt < 0) return null;
    return {
      attemptedAt,
      failedResource: typeof attempt.failedResource === 'string' ? attempt.failedResource : '',
    };
  } catch {
    return null;
  }
};

export const getChunkRecoveryDecision = ({
  previousAttempt,
  failedResource = '',
  now = Date.now(),
  recoveryWindowMs = CHUNK_RECOVERY_WINDOW_MS,
} = {}) => {
  const normalizedAttempt = parseChunkRecoveryAttempt(previousAttempt);
  const elapsedSinceAttempt = normalizedAttempt ? now - normalizedAttempt.attemptedAt : null;
  const attemptedRecently = normalizedAttempt
    && (elapsedSinceAttempt < 0 || elapsedSinceAttempt < recoveryWindowMs);

  if (attemptedRecently) {
    return { shouldReload: false, nextAttempt: normalizedAttempt };
  }

  return {
    shouldReload: true,
    nextAttempt: {
      attemptedAt: now,
      failedResource: typeof failedResource === 'string' ? failedResource : '',
    },
  };
};
