import { describe, expect, it } from 'vitest';
import { buildSessionExercises, calculateCompletedVolume, getSessionCompletion, isExerciseCompleted } from './sessionModel';

describe('conclusão de treino', () => {
  const workout = { exercises: [{ name: 'Supino', sets: '3x10' }, { name: 'Prancha', sets: '60 seg' }] };

  it('não conclui exercício ou sessão pelo check geral legado', () => {
    const progress = {
      '2026-08-20-A-0': { done: true, sets: [{ completed: true }, { completed: false }, { completed: false }] },
    };
    expect(isExerciseCompleted(workout.exercises[0], progress['2026-08-20-A-0'])).toBe(false);
    expect(getSessionCompletion(workout, progress, '2026-08-20', 'A')).toMatchObject({
      totalSets: 4,
      completedSets: 1,
      incompleteSets: 3,
    });
  });

  it('permite pular um exercício explicitamente sem inventar séries concluídas', () => {
    const progress = { '2026-08-20-A-0': { skipped: true, sets: [] } };
    const summary = getSessionCompletion(workout, progress, '2026-08-20', 'A');
    expect(summary.skippedExercises).toBe(1);
    expect(summary.completedSets).toBe(0);
  });

  it('calcula volume somente com séries confirmadas e aceita vírgula', () => {
    expect(calculateCompletedVolume([
      { weight: '12,5', reps: '10', completed: true },
      { weight: '20', reps: '8', completed: false },
    ])).toBe(125);
  });

  it('usa a interpretação canônica do exercício no volume', () => {
    expect(calculateCompletedVolume([
      { weight: '20', reps: '10', completed: true },
    ], { loadMode: 'per_side', barWeight: 20 })).toBe(600);
  });

  it('registra exercício planejado e realmente executado após swap de sessão', () => {
    const sessionWorkout = { exercises: [{ name: 'Remada Máquina', sets: '3x10', loadMode: 'machine' }] };
    const progress = { '2026-08-20-A-0': { swappedName: 'Remada Baixa', sets: [{ weight: 60, reps: 10, completed: true }] } };
    expect(buildSessionExercises(sessionWorkout, progress, '2026-08-20', 'A')[0]).toMatchObject({
      name: 'Remada Baixa',
      plannedName: 'Remada Máquina',
      performedName: 'Remada Baixa',
    });
    expect(sessionWorkout.exercises[0].name).toBe('Remada Máquina');
  });
});
