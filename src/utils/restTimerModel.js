export const getRestSecondsRemaining = (endTime, now = Date.now()) => Math.max(
  0,
  Math.ceil((Number(endTime) - now) / 1000),
);

export const REST_TIMER_STATUS = Object.freeze({
  idle: 'idle',
  active: 'active',
  finished: 'finished',
});

export const getIdleRestTimerState = () => ({
  active: false,
  status: REST_TIMER_STATUS.idle,
  timerId: null,
  duration: 90,
  endTime: null,
  finishedAt: null,
});

export const createRestTimerState = (duration = 90, now = Date.now()) => {
  const safeDuration = Math.max(0, Number(duration) || 0);
  return safeDuration > 0
    ? {
        active: true,
        status: REST_TIMER_STATUS.active,
        timerId: `rest-${now}-${safeDuration}`,
        duration: safeDuration,
        endTime: now + safeDuration * 1000,
        finishedAt: null,
      }
    : getIdleRestTimerState();
};

export const restoreRestTimerState = (state, now = Date.now()) => {
  if (!state?.active || Number(state.endTime) <= now) return getIdleRestTimerState();
  return {
    ...state,
    active: true,
    status: REST_TIMER_STATUS.active,
    timerId: state.timerId || `rest-restored-${Number(state.endTime)}`,
    finishedAt: null,
  };
};

export const finishRestTimerState = (state = getIdleRestTimerState(), now = Date.now()) => {
  const canFinish = state.active === true
    && state.status !== REST_TIMER_STATUS.finished
    && Number(state.endTime) <= now;
  if (!canFinish) return { didFinish: false, state };
  return {
    didFinish: true,
    state: {
      ...state,
      active: false,
      status: REST_TIMER_STATUS.finished,
      endTime: null,
      finishedAt: now,
    },
  };
};

export const adjustRestTimerEndTime = (endTime, seconds, now = Date.now()) => Math.max(
  now,
  Math.max(now, Number(endTime) || now) + (Number(seconds) || 0) * 1000,
);

export const shouldStartRestTimer = ({ setCompleted, completion }) => Boolean(
  setCompleted && completion?.incompleteSets > 0,
);
