import { describe, expect, it } from 'vitest';
import { isExtendedHistorySchemaError, normalizeHistoryEntry, toSupabaseHistoryRow } from './historyModel';

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
    expect(entry.syncStatus).toBe('pending-create');
    expect(entry.exercises[0].sets.map((set) => set.completed)).toEqual([false, true]);
    expect(toSupabaseHistoryRow(entry, 'user-1').workout_name).toBe('A');
    expect(toSupabaseHistoryRow(entry, 'user-1')).toMatchObject({ partial: true, earned_xp: 100 });
  });

  it('reconstrói treino parcial quando a coluna ainda não existe no banco', () => {
    const entry = normalizeHistoryEntry({
      workout_date: '2026-08-20',
      workout_name: 'A',
      exercises: [{ name: 'Supino', actualSets: 3, sets: [
        { weight: 50, reps: 10, completed: true },
        { weight: 50, reps: 10, completed: true },
      ] }],
    });

    expect(entry.partial).toBe(true);
  });

  it('mantém o XP oficial recebido do banco', () => {
    expect(normalizeHistoryEntry({
      workout_date: '2026-08-20',
      earned_xp: 777,
      total_volume: 10,
      exercises: [],
    }).earnedXp).toBe(777);
  });

  it('reconhece banco ainda sem as novas colunas para permitir fallback', () => {
    expect(isExtendedHistorySchemaError({ code: 'PGRST204', message: "Could not find the 'earned_xp' column" })).toBe(true);
    expect(isExtendedHistorySchemaError({ code: '42501', message: 'RLS violation' })).toBe(false);
  });
});
