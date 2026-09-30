export const getWorkoutCardState = ({ day, activeDay, sessionActive, status }) => {
  const isActive = activeDay === day;
  const locked = sessionActive && !isActive;
  return {
    isActive,
    locked,
    stateLabel: isActive ? 'Selecionado' : locked ? 'Bloqueado' : status?.completedOnDate ? 'Feito' : null,
  };
};

export const requestWorkoutSelection = ({ day, status, isActive, locked, onSelect }) => {
  if (locked || isActive) return false;
  onSelect(day, status);
  return true;
};
