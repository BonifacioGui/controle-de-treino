import { describe, expect, it } from 'vitest';
import {
  getClassLabel,
  getClassDetails,
  getGoalLabels,
  getProfileFocus,
  getUserGoalIds,
  normalizeGoalIds,
  toCompatibleProfileGoals,
  toggleGoalSelection,
} from './profileMetadata';

describe('metadata compatível de perfil', () => {
  it('migra em leitura o objetivo único das contas antigas', () => {
    expect(getUserGoalIds({ goal: 'weight_loss' })).toEqual(['weight_loss']);
    expect(getGoalLabels({ goal: 'weight_loss' })).toEqual(['Perder gordura']);
  });

  it('preserva no máximo dois objetivos válidos e sem duplicatas', () => {
    expect(normalizeGoalIds(['strength', 'strength', 'endurance', 'hypertrophy'])).toEqual(['strength', 'endurance']);
  });

  it('impede remover o último objetivo ou selecionar um terceiro', () => {
    expect(toggleGoalSelection(['hypertrophy'], 'hypertrophy')).toEqual(['hypertrophy']);
    expect(toggleGoalSelection(['hypertrophy', 'strength'], 'endurance')).toEqual(['hypertrophy', 'strength']);
  });

  it('grava o array novo e mantém o campo legado como objetivo primário', () => {
    expect(toCompatibleProfileGoals(['strength', 'endurance'])).toEqual({
      goals: ['strength', 'endurance'],
      goal: 'strength',
    });
  });

  it('separa classe, objetivos e foco', () => {
    const metadata = { class: 'assassin', gender: 'female', goals: ['weight_loss', 'hypertrophy'] };
    expect(getClassLabel(metadata.class, metadata.gender)).toBe('Sombra');
    expect(getGoalLabels(metadata)).toEqual(['Perder gordura', 'Ganhar massa muscular']);
    expect(getProfileFocus(metadata)).toBe('Definição corporal');
  });

  it('explica a classe sem inventar efeitos de progressão', () => {
    const details = getClassDetails({ class: 'barbarian', gender: 'male', goals: ['strength'] });
    expect(details).toMatchObject({
      label: 'Titã',
      canChange: true,
      effects: {
        workouts: false,
        quests: false,
        attributes: false,
        xp: false,
        rewards: false,
        progression: false,
        profileAppearance: true,
      },
    });
    expect(details.assignmentReason).toContain('escolhida manualmente');
    expect(details.goalRelationship).toContain('não concede bônus');
  });
});
