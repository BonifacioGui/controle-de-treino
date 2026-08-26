export const getRestSecondsRemaining = (endTime, now = Date.now()) => Math.max(
  0,
  Math.ceil((Number(endTime) - now) / 1000),
);

export const createRestTimerState = (duration = 90, now = Date.now()) => {
  const safeDuration = Math.max(0, Number(duration) || 0);
  return safeDuration > 0
    ? { active: true, duration: safeDuration, endTime: now + safeDuration * 1000 }
    : { active: false, duration: 90, endTime: null };
};

export const adjustRestTimerEndTime = (endTime, seconds, now = Date.now()) => Math.max(
  now,
  Math.max(now, Number(endTime) || now) + (Number(seconds) || 0) * 1000,
);

export const shouldStartRestTimer = ({ setCompleted, completion }) => Boolean(
  setCompleted && completion?.incompleteSets > 0,
);

