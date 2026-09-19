import { describe, expect, it } from 'vitest';
import {
  calculateBossMaxHp,
  calculateWorkoutBossDamage,
  createBossEncounter,
  updateBossEncounter,
} from './bossModel';

describe('BossEncounter canônico', () => {
  const workout = {
    title: 'Peito + Tríceps',
    exercises: [{ name: 'Supino', sets: '3x10', loadMode: 'total' }],
  };

  it('usa a média das três sessões completas com desafio de 5%', () => {
    const history = [5800, 6100, 6400].map((totalVolume, index) => ({
      workoutName: 'A', dateKey: `2026-08-${20 - index}`, totalVolume, partial: false,
    }));
    expect(calculateBossMaxHp(history, 'A')).toBe(6405);
  });

  it('causa dano apenas com séries concluídas e bônus somente no set de PR', () => {
    const history = [{
      workoutName: 'A',
      exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 60, reps: 10, completed: true }] }],
    }];
    const result = calculateWorkoutBossDamage([{
      name: 'Supino',
      loadMode: 'total',
      sets: [
        { weight: 60, reps: 10, completed: true },
        { weight: 65, reps: 10, completed: true },
        { weight: 200, reps: 1, completed: false },
      ],
    }], history, 'A');
    expect(result).toEqual({ baseDamage: 1250, criticalBonus: 130, criticalHits: 1, damage: 1380 });
  });

  it('reconhece aliases canônicos no recorde usado pelo Boss', () => {
    const result = calculateWorkoutBossDamage([{
      name: 'Tríceps Pulley (Corda)',
      loadMode: 'machine',
      sets: [{ weight: 42, reps: 10, completed: true }],
    }], [{
      workoutName: 'A',
      exercises: [{
        name: 'triceps corda',
        loadMode: 'machine',
        sets: [{ weight: 40, reps: 10, completed: true }],
      }],
    }], 'A');

    expect(result).toMatchObject({ criticalHits: 1, baseDamage: 420, criticalBonus: 84 });
  });

  it('recalcula dano, derrota e overkill sem acumular eventos duplicados', () => {
    const encounter = { ...createBossEncounter({ sessionId: 's1', dateKey: '2026-08-26', workoutName: 'A', workout, history: [] }), maxHp: 500 };
    const exercises = [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 60, reps: 10, completed: true }] }];
    const first = updateBossEncounter(encounter, exercises, [], 'A');
    const second = updateBossEncounter(first, [{ ...exercises[0], sets: [{ weight: 50, reps: 10, completed: true }] }], [], 'A');
    expect(first).toMatchObject({ damage: 600, defeated: true, remainingHp: 0, overkill: 100 });
    expect(second).toMatchObject({ damage: 500, defeated: true, remainingHp: 0, overkill: 0 });
  });
});
