import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getWorkoutCardState, requestWorkoutSelection } from '../../utils/workoutSelectorModel';
import WorkoutSelector from './WorkoutSelector';

const workoutData = {
  A: { title: 'Treino A', focus: 'Peito / Tríceps' },
  B: { title: 'Treino B', focus: 'Costas / Bíceps' },
};

describe('WorkoutSelector', () => {
  it('permite selecionar outro treino quando não existe sessão ativa', () => {
    const state = getWorkoutCardState({ day: 'B', activeDay: 'A', sessionActive: false, status: {} });
    const onSelect = vi.fn();
    expect(state).toMatchObject({ isActive: false, locked: false });
    expect(requestWorkoutSelection({ day: 'B', status: {}, ...state, onSelect })).toBe(true);
    expect(onSelect).toHaveBeenCalledWith('B', {});
  });

  it('bloqueia outros treinos durante a sessão e não chama onSelect', () => {
    const status = { completedOnDate: true };
    const state = getWorkoutCardState({ day: 'B', activeDay: 'A', sessionActive: true, status });
    const onSelect = vi.fn();
    expect(state).toMatchObject({ isActive: false, locked: true, stateLabel: 'Bloqueado' });
    expect(requestWorkoutSelection({ day: 'B', status, ...state, onSelect })).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('mantém o treino atual selecionado e desbloqueado durante a sessão', () => {
    expect(getWorkoutCardState({ day: 'A', activeDay: 'A', sessionActive: true, status: {} }))
      .toEqual({ isActive: true, locked: false, stateLabel: 'Selecionado' });
  });

  it('renderiza cadeado, texto e descrição acessível com prioridade sobre Feito', () => {
    const html = renderToStaticMarkup(
      <WorkoutSelector
        workoutData={workoutData}
        activeDay="A"
        sessionActive
        workoutStatuses={{ B: { completedOnDate: true } }}
        onSelect={() => {}}
      />,
    );

    expect(html).toContain('data-workout-state="locked"');
    expect(html).toContain('Treino B, bloqueado enquanto outro treino está em andamento');
    expect(html).toContain('Bloqueado');
    expect(html).not.toContain('Feito');
    expect(html).toContain('Selecionado');
  });

  it('preserva Feito quando não há bloqueio operacional', () => {
    const html = renderToStaticMarkup(
      <WorkoutSelector
        workoutData={workoutData}
        activeDay="A"
        sessionActive={false}
        workoutStatuses={{ B: { completedOnDate: true } }}
        onSelect={() => {}}
      />,
    );

    expect(html).toContain('data-workout-state="completed"');
    expect(html).toContain('Feito');
    expect(html).not.toContain('Bloqueado');
  });
});
