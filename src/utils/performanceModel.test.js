import { describe, expect, it } from 'vitest';
import { getExercisePerformance } from './performanceModel';

describe('resumo de performance do exercício', () => {
  it('resume todas as séries da última sessão em vez de apenas a primeira', () => {
    const performance = getExercisePerformance([{ dateKey: '2026-08-20', exercises: [{
      name: 'Rosca Direta (Barra)',
      loadMode: 'total',
      sets: [
        { weight: '10', reps: '8', completed: true },
        { weight: '10', reps: '8', completed: true },
        { weight: '12', reps: '6', completed: true },
      ],
    }] }], 'Rosca Direta', { loadMode: 'total' });
    expect(performance.lastSummary).toBe('10 kg total × 8 · 10 kg total × 8 · 12 kg total × 6');
    expect(performance.pr.primary).toBe('12 kg total');
  });

  it('mostra semântica por halter e total canônico separadamente', () => {
    const performance = getExercisePerformance([{ dateKey: '2026-08-20', exercises: [{
      name: 'Rosca Alternada',
      loadMode: 'per_hand',
      sets: [{ weight: '24', reps: '8', completed: true, loadMode: 'per_hand' }],
    }] }], 'Rosca Alternada (Halter)', { loadMode: 'per_hand' });
    expect(performance.pr).toEqual({ primary: '24 kg por halter', secondary: 'Total canônico: 48 kg' });
  });

  it('não cria PR falso quando não há histórico', () => {
    expect(getExercisePerformance([], 'Supino', { loadMode: 'total' })).toMatchObject({ lastSummary: '', pr: null });
  });
});
