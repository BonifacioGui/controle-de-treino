const ACTIVE_SESSION_STATUSES = new Set(['active', 'paused', 'finishing']);

export const getNextWorkoutDay = (plan = {}, completedDay) => {
  const planKeys = Object.keys(plan || {});
  if (planKeys.length === 0) return null;
  const completedIndex = planKeys.indexOf(completedDay);
  if (completedIndex < 0) return planKeys[0];
  return planKeys[(completedIndex + 1) % planKeys.length];
};

export const getWorkoutDayAfterCompletion = ({
  plan = {},
  completedDay,
  isHistoryEdit = false,
  previousDay,
} = {}) => {
  const planKeys = Object.keys(plan || {});
  if (planKeys.length === 0) return null;
  if (isHistoryEdit) return previousDay && plan[previousDay] ? previousDay : planKeys[0];
  return getNextWorkoutDay(plan, completedDay);
};

export const resolveSelectedWorkoutDay = ({
  plan = {},
  currentDay,
  sessionStatus,
  sessionWorkoutName,
  latestSession,
} = {}) => {
  const planKeys = Object.keys(plan || {});
  if (planKeys.length === 0) return 'A';

  if (ACTIVE_SESSION_STATUSES.has(sessionStatus) && sessionWorkoutName) {
    return sessionWorkoutName;
  }

  if (currentDay && plan[currentDay]) return currentDay;

  if (latestSession && plan[latestSession.workoutName]) {
    const latestIndex = planKeys.indexOf(latestSession.workoutName);
    return planKeys[(latestIndex + 1) % planKeys.length];
  }

  return planKeys[0];
};
