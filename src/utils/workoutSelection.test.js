import { describe, expect, it } from 'vitest';
import {
  getNextWorkoutDay,
  getWorkoutDayAfterCompletion,
  resolveSelectedWorkoutDay,
} from './workoutSelection';

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

  it('usa a ordem real do plano e volta ao início sem depender do nome', () => {
    const customPlan = { 'Upper 1': {}, 'Lower 1': {}, 'Upper 2': {}, 'Lower 2': {} };

    expect(getNextWorkoutDay(customPlan, 'Upper 1')).toBe('Lower 1');
    expect(getNextWorkoutDay(customPlan, 'Lower 2')).toBe('Upper 1');
  });

  it('mantém o único treino selecionado e trata planos vazios', () => {
    expect(getNextWorkoutDay({ Fullbody: {} }, 'Fullbody')).toBe('Fullbody');
    expect(getNextWorkoutDay({}, 'Fullbody')).toBeNull();
  });

  it('não avança a seleção ao concluir uma edição do histórico', () => {
    expect(getWorkoutDayAfterCompletion({
      plan,
      completedDay: 'A',
      isHistoryEdit: true,
      previousDay: 'C',
    })).toBe('C');
  });

  it('seleciona o próximo treino mesmo quando a última sessão foi hoje', () => {
    expect(resolveSelectedWorkoutDay({
      plan,
      currentDay: 'X',
      sessionStatus: 'idle',
      latestSession: { workoutName: 'C', dateKey: '2026-08-27' },
      today: '2026-08-27',
    })).toBe('A');
  });
});
