import { describe, expect, it } from 'vitest';
import { getCanonicalName } from './exerciseParser';
import { isSameExercise } from './workoutUtils';

describe('identidade conservadora de exercícios', () => {
  it('tolera diferenças pequenas de acento, caixa e anotação de barra', () => {
    expect(isSameExercise('Supino Reto', 'SUPINO reto (barra)')).toBe(true);
    expect(isSameExercise('Tríceps Pulley com Corda', 'triceps corda')).toBe(true);
  });

  it('não confunde unilateral de pernas com remada serrote', () => {
    expect(getCanonicalName('Cadeira Extensora Unilateral')).toBe('Cadeira Extensora Unilateral');
    expect(isSameExercise('Cadeira Extensora Unilateral', 'Remada Unilateral')).toBe(false);
  });

  it('preserva equipamento no fallback para não unir exercícios distintos', () => {
    expect(getCanonicalName('Pullover (Cabo)')).toBe('Pullover Cabo');
    expect(getCanonicalName('Pullover - Halter')).toBe('Pullover Halter');
    expect(isSameExercise('Pullover (Cabo)', 'Pullover - Halter')).toBe(false);
  });

  it('mantém variações biomecanicamente diferentes separadas', () => {
    expect(isSameExercise('Supino Reto', 'Supino Inclinado')).toBe(false);
    expect(isSameExercise('Panturrilha Sentada', 'Panturrilha em Pé')).toBe(false);
  });
});
