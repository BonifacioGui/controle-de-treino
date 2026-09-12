import { isSameLocalDay } from './dateUtils';

const ACTIVE_SESSION_STATUSES = new Set(['active', 'paused', 'finishing']);

export const resolveSelectedWorkoutDay = ({
  plan = {},
  currentDay,
  sessionStatus,
  sessionWorkoutName,
  latestSession,
  today,
} = {}) => {
  const planKeys = Object.keys(plan || {});
  if (planKeys.length === 0) return 'A';

  if (ACTIVE_SESSION_STATUSES.has(sessionStatus) && sessionWorkoutName) {
    return sessionWorkoutName;
  }

  if (currentDay && plan[currentDay]) return currentDay;

  if (latestSession && plan[latestSession.workoutName]) {
    const latestIndex = planKeys.indexOf(latestSession.workoutName);
    return isSameLocalDay(latestSession.dateKey, today)
      ? latestSession.workoutName
      : planKeys[(latestIndex + 1) % planKeys.length];
  }

  return planKeys[0];
};
