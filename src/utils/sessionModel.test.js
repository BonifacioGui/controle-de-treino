import { describe, expect, it } from 'vitest';
import { normalizeHistoryEntry } from './historyModel';
import {
  buildSessionExercises,
  calculateCompletedVolume,
  getActiveSessionSets,
  getExpectedSetCount,
  getSessionCompletion,
  isExerciseCompleted,
  MAX_SETS_PER_EXERCISE,
  normalizeSessionSetCountInput,
} from './sessionModel';

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

  it('permite limpar a quantidade antes de digitar outra e limita valores capazes de travar a interface', () => {
    expect(normalizeSessionSetCountInput('')).toBe('');
    expect(normalizeSessionSetCountInput('5')).toBe('5');
    expect(normalizeSessionSetCountInput('999999999999999999')).toBe(String(MAX_SETS_PER_EXERCISE));
    expect(getExpectedSetCount({ sets: '3x10' }, '999999999999999999')).toBe(MAX_SETS_PER_EXERCISE);
    expect(getExpectedSetCount({ sets: '999999999999999999x10' })).toBe(MAX_SETS_PER_EXERCISE);
  });

  it('preserva séries excedentes no estado, mas não as serializa nem inclui no volume ativo', () => {
    const reducedWorkout = { exercises: [{ name: 'Supino', sets: '3x10' }] };
    const exerciseProgress = {
      actualSets: '2',
      sets: [
        { weight: '10', reps: '10', completed: true },
        { weight: '10', reps: '10', completed: true },
        { weight: '100', reps: '10', completed: true },
      ],
    };
    const progress = { '2026-08-20-A-0': exerciseProgress };

    expect(getActiveSessionSets(reducedWorkout.exercises[0], exerciseProgress)).toHaveLength(2);
    expect(exerciseProgress.sets).toHaveLength(3);
    expect(getSessionCompletion(reducedWorkout, progress, '2026-08-20', 'A')).toMatchObject({
      totalSets: 2,
      completedSets: 2,
      incompleteSets: 0,
    });

    const serialized = buildSessionExercises(reducedWorkout, progress, '2026-08-20', 'A')[0];
    expect(serialized.actualSets).toBe(2);
    expect(serialized.sets).toHaveLength(2);
    expect(calculateCompletedVolume(serialized.sets, serialized)).toBe(200);
    expect(normalizeHistoryEntry({
      dateKey: '2026-08-20', workoutName: 'A', exercises: [serialized],
    }).partial).toBe(false);
  });

  it('serializa de forma canônica um limite seguro para quantidades legadas enormes', () => {
    const legacyWorkout = { exercises: [{ name: 'Supino', sets: '3x10' }] };
    const sets = Array.from({ length: MAX_SETS_PER_EXERCISE + 1 }, () => ({
      weight: '10', reps: '10', completed: true,
    }));
    const progress = {
      '2026-08-20-A-0': { actualSets: '999999999999999999', sets },
    };

    const serialized = buildSessionExercises(legacyWorkout, progress, '2026-08-20', 'A')[0];
    expect(serialized.actualSets).toBe(MAX_SETS_PER_EXERCISE);
    expect(serialized.sets).toHaveLength(MAX_SETS_PER_EXERCISE);
    expect(getSessionCompletion(legacyWorkout, progress, '2026-08-20', 'A')).toMatchObject({
      totalSets: MAX_SETS_PER_EXERCISE,
      completedSets: MAX_SETS_PER_EXERCISE,
      incompleteSets: 0,
    });
    expect(normalizeHistoryEntry({
      dateKey: '2026-08-20', workoutName: 'A', exercises: [serialized],
    }).partial).toBe(false);
  });
});
