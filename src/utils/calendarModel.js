export const createCalendarViewDate = (selectedDate, fallback = new Date()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(selectedDate || ''))) return fallback;
  const [year, month, day] = selectedDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const changeCalendarYear = (viewDate, year) => new Date(
  Number(year),
  viewDate.getMonth(),
  1,
);

export const changeCalendarMonth = (viewDate, month) => new Date(
  viewDate.getFullYear(),
  Number(month),
  1,
);

export const formatCalendarDate = (viewDate, day) => (
  `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

export const isFutureCalendarDate = (date, today = new Date()) => {
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return candidate > current;
};
