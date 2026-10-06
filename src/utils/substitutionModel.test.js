import { describe, expect, it } from 'vitest';
import {
  addAlternativeToWorkout,
  addExerciseAlternative,
  hasCompletedExerciseSets,
  hasRecordedExerciseData,
} from './substitutionModel';

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

  it('bloqueia a troca quando uma série ainda não concluída já possui dados', () => {
    expect(hasRecordedExerciseData({ sets: [{ weight: '40', reps: '10', completed: false }] })).toBe(true);
    expect(hasRecordedExerciseData({ sets: [{ weight: '', reps: '', completed: false }] })).toBe(false);
  });

  it('adiciona a alternativa à cópia da sessão sem remover séries ou outros exercícios', () => {
    const workout = {
      title: 'A',
      exercises: [
        { name: 'Supino Reto', alternatives: [], sets: '3x10' },
        { name: 'Remada Baixa', alternatives: [], sets: '3x12' },
      ],
    };
    const updated = addAlternativeToWorkout(workout, {
      exerciseIndex: 0,
      plannedName: 'Supino reto (barra)',
      alternative: 'Supino Reto com Halteres',
    });
    expect(updated.exercises[0]).toMatchObject({
      name: 'Supino Reto',
      sets: '3x10',
      alternatives: ['Supino Reto com Halteres'],
    });
    expect(updated.exercises[1]).toEqual(workout.exercises[1]);
  });

  it('não altera exercício errado quando o índice e a identidade não conferem', () => {
    const workout = {
      exercises: [
        { name: 'Supino Reto', alternatives: [] },
        { name: 'Remada Baixa', alternatives: [] },
        { name: 'Remada Baixa na Polia', alternatives: [] },
      ],
    };
    expect(addAlternativeToWorkout(workout, {
      exerciseIndex: 0,
      plannedName: 'Remada Baixa',
      alternative: 'Remada Articulada',
    })).toBe(workout);
  });
});
