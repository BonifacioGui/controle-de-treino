import { describe, expect, it } from 'vitest';
import {
  calculateDisciplineLevel,
  calculateFocusLevel,
  getExerciseAttribute,
  getAttributeKeyFromSubject,
  getRpgLevelFromXp,
  getRpgLevelProgress,
  RPG_ATTRIBUTE_INFO,
  RPG_XP_INFO,
} from './rpgProgressionModel';

describe('modelo explicável de progressão RPG', () => {
  it.each([
    ['Supino reto', 'STR'],
    ['Elevação Lateral (Halter)', 'CHA'],
    ['Tríceps Pulley (Corda)', 'CHA'],
    ['Crucifixo no Crossover', 'DEX'],
    ['Crucifixo Invertido', 'DEX'],
    ['Elevação lateral no crossover', 'CHA'],
    ['Afundo búlgaro', 'DEX'],
    ['Mesa flexora unilateral', 'VIT'],
    ['Giro Russo (Russian Twist)', 'VIT'],
    ['Exercício personalizado', 'STR'],
  ])('classifica %s em %s', (name, expected) => {
    expect(getExerciseAttribute(name)).toBe(expected);
  });

  it('usa a mesma curva quadrática no nível e no detalhamento da barra', () => {
    expect(getRpgLevelFromXp(399)).toBe(2);
    expect(getRpgLevelFromXp(400)).toBe(3);
    expect(getRpgLevelProgress(250)).toMatchObject({
      currentThreshold: 100,
      nextThreshold: 400,
      progress: 50,
      xpRemaining: 150,
    });
  });

  it('calcula foco e disciplina com as regras exibidas na interface', () => {
    expect(calculateFocusLevel(4)).toBe(8);
    expect(calculateDisciplineLevel([
      { dateKey: '2026-08-20' },
      { dateKey: '2026-08-19' },
      { dateKey: '2026-08-18' },
      { dateKey: '2026-08-17' },
    ], '2026-08-30')).toBe(1);
    expect(calculateDisciplineLevel([
      { dateKey: '2026-08-20' },
      { dateKey: '2026-08-19' },
      { dateKey: '2026-08-18' },
      { dateKey: '2026-08-17' },
    ], '2026-08-21')).toBe(2);
  });

  it('mantém explicações para todos os atributos e para XP total', () => {
    Object.values(RPG_ATTRIBUTE_INFO).forEach((info) => {
      expect(info.howToEarn.length).toBeGreaterThan(20);
      expect(info.calculation.length).toBeGreaterThan(15);
    });
    expect(RPG_XP_INFO.howToEarn).toContain('missões');
    expect(RPG_XP_INFO.calculation).toContain('5%');
  });

  it.each([
    ['FOR', 'STR'],
    ['DES', 'DEX'],
    ['VIT', 'VIT'],
    ['CAR', 'CHA'],
    ['FOCO', 'FOCUS'],
    ['DISCIPLINA', 'DISCIPLINE'],
  ])('resolve o rótulo %s para a métrica %s', (subject, expected) => {
    expect(getAttributeKeyFromSubject(subject)).toBe(expected);
  });
});
