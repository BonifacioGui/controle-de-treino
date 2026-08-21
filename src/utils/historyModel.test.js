import { describe, expect, it } from 'vitest';
import { normalizeHistoryEntry, toSupabaseHistoryRow } from './historyModel';

describe('modelo canônico do histórico', () => {
  it('normaliza registros antigos e mantém somente séries realmente concluídas', () => {
    const entry = normalizeHistoryEntry({
      workout_date: '2026-08-20T00:00:00.000Z',
      workout_name: 'A',
      total_volume: 1200,
      bonus_xp: 40,
      exercises: [{ name: 'Supino', done: true, sets: [{ weight: '50', reps: '10' }, { weight: '55', reps: '8', checked: true }] }],
    });

    expect(entry.dateKey).toBe('2026-08-20');
    expect(entry.workoutName).toBe('A');
    expect(entry.exercises[0].sets.map((set) => set.completed)).toEqual([false, true]);
    expect(toSupabaseHistoryRow(entry, 'user-1').workout_name).toBe('A');
  });
});
