import { describe, expect, it } from 'vitest';
import {
  daysBetweenLocalDates,
  formatDayCount,
  formatLocalDate,
  getLocalDateKey,
  isSameLocalDay,
  normalizeLocalDateKey,
  parseLocalDateKey,
} from './dateUtils';

describe('datas locais', () => {
  it('mantém o dia de São Paulo antes e depois das 21h, mesmo após a virada em UTC', () => {
    expect(getLocalDateKey(new Date('2026-08-20T23:59:00.000Z'), 'America/Sao_Paulo')).toBe('2026-08-20');
    expect(getLocalDateKey(new Date('2026-08-21T00:01:00.000Z'), 'America/Sao_Paulo')).toBe('2026-08-20');
    expect(getLocalDateKey(new Date('2026-08-21T03:01:00.000Z'), 'America/Sao_Paulo')).toBe('2026-08-21');
  });

  it('trata viradas de mês e ano sem depender de UTC', () => {
    expect(daysBetweenLocalDates('2026-01-31', '2026-02-01')).toBe(1);
    expect(daysBetweenLocalDates('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('valida fevereiro e anos bissextos', () => {
    expect(normalizeLocalDateKey('29/02/2024')).toBe('2024-02-29');
    expect(normalizeLocalDateKey('29/02/2025')).toBeNull();
    expect(daysBetweenLocalDates('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('interpreta YYYY-MM-DD como calendário local', () => {
    const date = parseLocalDateKey('2026-08-20');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(20);
    expect(formatLocalDate('2026-08-20')).toBe('20/08/2026');
    expect(isSameLocalDay('20/08/2026', '2026-08-20')).toBe(true);
  });

  it('pluraliza sequência em português', () => {
    expect(formatDayCount(0)).toBe('0 dias');
    expect(formatDayCount(1)).toBe('1 dia');
    expect(formatDayCount(2)).toBe('2 dias');
  });
});
