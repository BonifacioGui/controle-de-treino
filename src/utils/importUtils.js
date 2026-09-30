const makeUniqueDayName = (name, existing) => {
  let suffix = 2;
  let candidate = `${name} (importado)`;
  while (existing[candidate]) {
    candidate = `${name} (importado ${suffix})`;
    suffix += 1;
  }
  return candidate;
};

export const getImportConflicts = (existingPlan = {}, importedPlan = {}) => (
  Object.keys(importedPlan).filter((day) => Boolean(existingPlan[day]))
);

export const mergeImportedWorkoutPlan = (existingPlan = {}, importedPlan = {}, strategy = '') => {
  const conflicts = getImportConflicts(existingPlan, importedPlan);
  if (conflicts.length > 0 && !['keep', 'replace'].includes(strategy)) {
    throw new Error('Escolha como tratar os treinos que já existem.');
  }

  const plan = { ...existingPlan };
  let firstImportedDay = Object.keys(importedPlan)[0] || null;
  Object.entries(importedPlan).forEach(([day, workout]) => {
    if (!plan[day] || strategy === 'replace') {
      plan[day] = workout;
      return;
    }
    const uniqueDay = makeUniqueDayName(day, plan);
    plan[uniqueDay] = workout;
    if (day === firstImportedDay) firstImportedDay = uniqueDay;
  });
  if (plan['INÍCIO'] && Object.keys(plan).length > 1) delete plan['INÍCIO'];
  return { plan, firstImportedDay, conflicts };
};
