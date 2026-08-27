import { describe, expect, it } from 'vitest';
import { addExerciseAlternative, hasCompletedExerciseSets } from './substitutionModel';

describe('substituição segura de exercício', () => {
  it('permite adicionar alternativa sem alterar o exercício principal', () => {
    expect(addExerciseAlternative({ name: 'Remada Máquina', alternatives: [] }, 'Remada Baixa')).toEqual({
      name: 'Remada Máquina',
      alternatives: ['Remada Baixa'],
    });
  });

  it('não duplica aliases canônicos na lista de alternativas', () => {
    const exercise = { name: 'Supino Reto', alternatives: ['Remada Baixa'] };
    expect(addExerciseAlternative(exercise, 'Remada Baixa (Polia)')).toBe(exercise);
  });

  it('detecta séries concluídas antes de permitir troca de identidade', () => {
    expect(hasCompletedExerciseSets({ sets: [{ completed: false }, { completed: true }] })).toBe(true);
    expect(hasCompletedExerciseSets({ sets: [{ completed: false }] })).toBe(false);
  });
});
