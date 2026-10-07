import { describe, expect, it } from 'vitest';
import {
  addAlternativeToWorkout,
  addExerciseAlternative,
  getEffectiveExercise,
  hasCompletedExerciseSets,
  hasRecordedExerciseData,
  resolveSubstitutionMetadata,
  updateWorkoutExerciseAlternatives,
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

  it('permite salvar Supino Inclinado Máquina como alternativa da versão com barra', () => {
    expect(addExerciseAlternative({
      name: 'Supino Inclinado com Barra',
      alternatives: ['Supino Inclinado com Halteres'],
    }, 'Supino Inclinado (máquina)')).toMatchObject({
      alternatives: ['Supino Inclinado com Halteres', 'Supino Inclinado (máquina)'],
    });
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

  it('reflete alternativas do editor no snapshot ativo sem alterar outros campos ou séries', () => {
    const planWorkout = {
      title: 'Treino A',
      exercises: [{ name: 'Supino Inclinado com Barra', sets: '3x10', loadMode: 'total', alternatives: [] }],
    };
    const sessionWorkout = {
      title: 'Treino A iniciado',
      exercises: [{ name: 'Supino Inclinado com Barra', sets: '3x8', loadMode: 'total', note: 'snapshot', alternatives: [] }],
    };
    const progress = { sets: [{ weight: '50', reps: '8', completed: true }] };
    const options = {
      exerciseIndex: 0,
      plannedName: 'Supino Inclinado com Barra',
      alternatives: ['Supino Inclinado (máquina)'],
    };
    const nextPlan = updateWorkoutExerciseAlternatives(planWorkout, options);
    const nextSession = updateWorkoutExerciseAlternatives(sessionWorkout, options);

    expect(nextPlan.exercises[0].alternatives).toEqual(['Supino Inclinado (máquina)']);
    expect(nextSession.exercises[0]).toEqual({
      ...sessionWorkout.exercises[0],
      alternatives: ['Supino Inclinado (máquina)'],
    });
    expect(progress.sets).toEqual([{ weight: '50', reps: '8', completed: true }]);
  });

  it('não sincroniza alternativas com exercício ambíguo ou incompatível', () => {
    const snapshot = {
      exercises: [
        { name: 'Supino Reto', alternatives: [] },
        { name: 'Remada Baixa', alternatives: [] },
        { name: 'Remada Baixa na Polia', alternatives: [] },
      ],
    };
    expect(updateWorkoutExerciseAlternatives(snapshot, {
      exerciseIndex: 0,
      plannedName: 'Remada Baixa',
      alternatives: ['Remada Máquina'],
    })).toBe(snapshot);
  });

  it('usar agora e salvar na ficha atualiza plano e snapshot com a mesma alternativa', () => {
    const planWorkout = { exercises: [{ name: 'Supino Inclinado com Barra', alternatives: [] }] };
    const sessionWorkout = { exercises: [{ name: 'Supino Inclinado com Barra', alternatives: [] }] };
    const options = {
      exerciseIndex: 0,
      plannedName: 'Supino Inclinado com Barra',
      alternative: 'Supino Inclinado (máquina)',
    };
    expect(addAlternativeToWorkout(planWorkout, options).exercises[0].alternatives).toEqual([
      'Supino Inclinado (máquina)',
    ]);
    expect(addAlternativeToWorkout(sessionWorkout, options).exercises[0].alternatives).toEqual([
      'Supino Inclinado (máquina)',
    ]);
  });

  it('mantém arrays antigos de alternativas em string e infere a carga da selecionada', () => {
    const exercise = {
      name: 'Supino Inclinado com Barra',
      loadMode: 'total',
      alternatives: ['Supino Inclinado (máquina)'],
    };
    expect(resolveSubstitutionMetadata(exercise, 'Supino Inclinado (máquina)')).toEqual({
      name: 'Supino Inclinado (máquina)',
      loadMode: 'machine',
      barWeight: null,
    });
    expect(getEffectiveExercise(exercise, {
      swappedName: 'Supino Inclinado (máquina)',
      swappedLoadMode: 'machine',
    })).toMatchObject({ name: 'Supino Inclinado (máquina)', loadMode: 'machine' });
  });
});
