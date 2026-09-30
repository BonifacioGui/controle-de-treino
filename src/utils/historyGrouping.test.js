import { describe, expect, it } from 'vitest';
import { groupHistoryByDate } from './historyGrouping';

describe('groupHistoryByDate', () => {
  it('organiza sessões por ano, mês, semana e dia, da mais recente para a mais antiga', () => {
    const groups = groupHistoryByDate([
      { id: 'older-year', dateKey: '2025-12-31' },
      { id: 'older-month', dateKey: '2026-07-31' },
      { id: 'latest', dateKey: '2026-08-20' },
      { id: 'same-day', date: '20/08/2026' },
      { id: 'same-week', dateKey: '2026-08-18' },
    ]);

    expect(groups.map((year) => year.key)).toEqual(['2026', '2025']);
    expect(groups[0].sessionCount).toBe(4);
    expect(groups[0].months.map((month) => month.label)).toEqual(['Agosto', 'Julho']);
    expect(groups[0].months[0].weeks[0].label).toBe('Semana 34');
    expect(groups[0].months[0].weeks[0].sessionCount).toBe(3);
    expect(groups[0].months[0].weeks[0].days.map((day) => day.dateKey)).toEqual([
      '2026-08-20',
      '2026-08-18',
    ]);
    expect(groups[0].months[0].weeks[0].days[0].sessions.map((session) => session.id)).toEqual([
      'latest',
      'same-day',
    ]);
  });

  it('ignora registros sem uma data válida', () => {
    expect(groupHistoryByDate([{ id: 'invalid', dateKey: 'ontem' }])).toEqual([]);
  });
});
