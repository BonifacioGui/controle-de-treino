import { normalizeLocalDateKey } from './dateUtils';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const getWeekOfYear = (year, month, day) => {
  const firstDay = new Date(year, 0, 1, 12);
  const currentDay = new Date(year, month - 1, day, 12);
  const elapsedDays = Math.round((currentDay - firstDay) / 86_400_000);
  return Math.ceil((elapsedDays + firstDay.getDay() + 1) / 7);
};

export const groupHistoryByDate = (history) => {
  const years = new Map();

  history.forEach((session) => {
    const dateKey = normalizeLocalDateKey(session.dateKey || session.date);
    if (!dateKey) return;

    const [year, month, day] = dateKey.split('-').map(Number);
    const yearKey = String(year);
    const monthKey = `${yearKey}-${String(month).padStart(2, '0')}`;
    const weekNumber = getWeekOfYear(year, month, day);
    const weekKey = `${monthKey}-w${weekNumber}`;

    if (!years.has(yearKey)) {
      years.set(yearKey, { key: yearKey, label: yearKey, sessionCount: 0, months: new Map() });
    }
    const yearGroup = years.get(yearKey);

    if (!yearGroup.months.has(monthKey)) {
      yearGroup.months.set(monthKey, {
        key: monthKey,
        label: MONTH_NAMES[month - 1],
        month,
        sessionCount: 0,
        weeks: new Map(),
      });
    }
    const monthGroup = yearGroup.months.get(monthKey);

    if (!monthGroup.weeks.has(weekKey)) {
      monthGroup.weeks.set(weekKey, {
        key: weekKey,
        label: `Semana ${weekNumber}`,
        weekNumber,
        sessionCount: 0,
        days: new Map(),
      });
    }
    const weekGroup = monthGroup.weeks.get(weekKey);

    if (!weekGroup.days.has(dateKey)) {
      weekGroup.days.set(dateKey, { key: dateKey, dateKey, sessionCount: 0, sessions: [] });
    }
    const dayGroup = weekGroup.days.get(dateKey);

    dayGroup.sessions.push({ ...session, dateKey });
    dayGroup.sessionCount += 1;
    weekGroup.sessionCount += 1;
    monthGroup.sessionCount += 1;
    yearGroup.sessionCount += 1;
  });

  return [...years.values()]
    .sort((left, right) => right.key.localeCompare(left.key))
    .map((year) => ({
      ...year,
      months: [...year.months.values()]
        .sort((left, right) => right.month - left.month)
        .map((month) => ({
          ...month,
          weeks: [...month.weeks.values()]
            .sort((left, right) => right.weekNumber - left.weekNumber)
            .map((week) => ({
              ...week,
              days: [...week.days.values()].sort((left, right) => right.dateKey.localeCompare(left.dateKey)),
            })),
        })),
    }));
};
