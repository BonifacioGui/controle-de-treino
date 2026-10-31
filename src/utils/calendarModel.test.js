import { describe, expect, it } from 'vitest';
import {
  changeCalendarMonth,
  changeCalendarYear,
  createCalendarViewDate,
  formatCalendarDate,
  isFutureCalendarDate,
} from './calendarModel';

describe('navegação do calendário de nascimento', () => {
  it('preserva ano e mês navegados até a escolha do dia', () => {
    const initial = createCalendarViewDate('1990-05-12');
    const changedYear = changeCalendarYear(initial, 1985);
    expect(changedYear.getFullYear()).toBe(1985);
    expect(changedYear.getMonth()).toBe(4);

    const changedMonth = changeCalendarMonth(changedYear, 7);
    expect(changedMonth.getFullYear()).toBe(1985);
    expect(changedMonth.getMonth()).toBe(7);
    expect(formatCalendarDate(changedMonth, 20)).toBe('1985-08-20');
  });

  it('identifica datas futuras para impedir nascimento inválido', () => {
    const today = new Date(2026, 9, 31);
    expect(isFutureCalendarDate(new Date(2026, 10, 1), today)).toBe(true);
    expect(isFutureCalendarDate(new Date(2026, 9, 31), today)).toBe(false);
  });
});
