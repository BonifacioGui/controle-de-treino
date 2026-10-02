import { describe, expect, it } from 'vitest';
import { createRecoveredWorkoutPlan, RECOVERED_PLAN_EVIDENCE } from './recoveredWorkoutPlan';

describe('ficha A/B/C recuperada', () => {
  it('recupera somente os três dias confirmados, sem alterar os dados entre chamadas', () => {
    const first = createRecoveredWorkoutPlan();
    const second = createRecoveredWorkoutPlan();
    expect(Object.keys(first)).toEqual(['A', 'B', 'C']);
    expect(first.A.exercises).toHaveLength(7);
    expect(first.B.exercises).toHaveLength(6);
    expect(first.C.exercises).toHaveLength(9);
    first.A.focus = 'alterado';
    expect(second.A.focus).toBe('PEITO, OMBROS E TRÍCEPS');
  });

  it('mantém explícita a única meta que o histórico não permite deduzir', () => {
    const plan = createRecoveredWorkoutPlan();
    expect(plan.C.exercises.find((exercise) => exercise.name === 'Panturrilha Sentada')).toMatchObject({
      sets: '3x?',
      recoveryNote: expect.stringContaining('não recuperada'),
    });
    expect(RECOVERED_PLAN_EVIDENCE.uncertainties).toHaveLength(1);
  });
});
