import { describe, expect, it } from 'vitest';
import { resolveSelectedWorkoutDay } from './workoutSelection';

const plan = { A: {}, B: {}, C: {} };

describe('resolveSelectedWorkoutDay', () => {
  it('preserva o treino escolhido após recarregar os dados da nuvem', () => {
    expect(resolveSelectedWorkoutDay({
      plan,
      currentDay: 'C',
      sessionStatus: 'idle',
      latestSession: { workoutName: 'A', dateKey: '2026-08-20' },
      today: '2026-08-27',
    })).toBe('C');
  });

  it('prioriza a identidade de uma sessão ativa', () => {
    expect(resolveSelectedWorkoutDay({
      plan,
      currentDay: 'C',
      sessionStatus: 'active',
      sessionWorkoutName: 'B',
      today: '2026-08-27',
    })).toBe('B');
  });

  it('sugere o próximo treino apenas quando a seleção salva não existe', () => {
    expect(resolveSelectedWorkoutDay({
      plan,
      currentDay: 'X',
      sessionStatus: 'idle',
      latestSession: { workoutName: 'B', dateKey: '2026-08-20' },
      today: '2026-08-27',
    })).toBe('C');
  });
});
