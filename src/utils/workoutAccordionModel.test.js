import { describe, expect, it } from 'vitest';
import { getNextExpandedExerciseId, toggleExpandedExerciseId } from './workoutAccordionModel';

describe('accordion dos exercícios', () => {
  it('troca o único exercício aberto ao tocar em outro', () => {
    expect(toggleExpandedExerciseId('exercise-1', 'exercise-2')).toBe('exercise-2');
  });

  it('fecha o exercício ao tocar novamente nele', () => {
    expect(toggleExpandedExerciseId('exercise-1', 'exercise-1')).toBeNull();
  });

  it('acompanha o exercício atual quando o anterior estava aberto automaticamente', () => {
    expect(getNextExpandedExerciseId({
      expandedId: 'exercise-1',
      previousCurrentId: 'exercise-1',
      nextCurrentId: 'exercise-2',
    })).toBe('exercise-2');
  });

  it('preserva uma escolha manual recente ao avançar o exercício atual', () => {
    expect(getNextExpandedExerciseId({
      expandedId: 'exercise-3',
      previousCurrentId: 'exercise-1',
      nextCurrentId: 'exercise-2',
    })).toBe('exercise-3');
  });
});
