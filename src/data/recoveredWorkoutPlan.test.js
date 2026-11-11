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

  it('usa uma meta padrão editável para Panturrilha Sentada', () => {
    const plan = createRecoveredWorkoutPlan();
    expect(plan.C.exercises.find((exercise) => exercise.name === 'Panturrilha Sentada')).toMatchObject({
      sets: '3x12-15',
    });
    expect(RECOVERED_PLAN_EVIDENCE.note).toContain('editáveis');
  });

  it('preserva máquina e halteres como alternativas distintas do supino inclinado com barra', () => {
    const plan = createRecoveredWorkoutPlan();
    const supinoInclinado = plan.A.exercises.find((exercise) => exercise.name === 'Supino Inclinado com Barra');
    expect(supinoInclinado.alternatives).toEqual([
      'Supino Inclinado com Halteres',
      'Supino Inclinado (máquina)',
    ]);
  });
});
