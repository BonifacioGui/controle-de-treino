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

  it('gera Critical Hit de 20% quando uma série supera a maior carga histórica', () => {
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
    expect(result).toEqual({
      baseDamage: 1250,
      criticalBonus: 130,
      criticalHits: 1,
      powerBonus: 0,
      powerHits: 0,
      damage: 1380,
    });
  });

  it('não gera golpe especial ao repetir a mesma carga e as mesmas repetições', () => {
    const history = [{ exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }] }] }];
    expect(calculateWorkoutBossDamage([{
      name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }],
    }], history)).toMatchObject({ criticalHits: 0, powerHits: 0, damage: 800 });
  });

  it('gera Power Hit de 10% ao superar as repetições na mesma carga', () => {
    const history = [{ exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }] }] }];
    expect(calculateWorkoutBossDamage([{
      name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 10, completed: true }],
    }], history)).toMatchObject({
      baseDamage: 1000, criticalHits: 0, powerHits: 1, powerBonus: 100, damage: 1100,
    });
  });

  it('prioriza Critical Hit quando carga e repetições aumentam juntas', () => {
    const history = [{ exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }] }] }];
    expect(calculateWorkoutBossDamage([{
      name: 'Supino', loadMode: 'total', sets: [{ weight: 110, reps: 9, completed: true }],
    }], history)).toMatchObject({ criticalHits: 1, criticalBonus: 198, powerHits: 0, powerBonus: 0 });
  });

  it('atualiza a referência de repetições durante a sessão', () => {
    const history = [{ exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }] }] }];
    expect(calculateWorkoutBossDamage([{
      name: 'Supino',
      loadMode: 'total',
      sets: [
        { weight: 100, reps: 9, completed: true },
        { weight: 100, reps: 9, completed: true },
        { weight: 100, reps: 10, completed: true },
      ],
    }], history)).toMatchObject({ powerHits: 2, powerBonus: 190, criticalHits: 0 });
  });

  it('gera Critical Hit a cada novo recorde de carga na mesma sessão', () => {
    const history = [{ exercises: [{ name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }] }] }];
    expect(calculateWorkoutBossDamage([{
      name: 'Supino',
      loadMode: 'total',
      sets: [
        { weight: 110, reps: 8, completed: true },
        { weight: 120, reps: 6, completed: true },
      ],
    }], history)).toMatchObject({ criticalHits: 2, powerHits: 0 });
  });

  it('usa a primeira série sem histórico apenas como referência', () => {
    expect(calculateWorkoutBossDamage([{
      name: 'Supino', loadMode: 'total', sets: [{ weight: 100, reps: 8, completed: true }],
    }], [])).toMatchObject({ criticalHits: 0, powerHits: 0, damage: 800 });
  });

  it('não gera golpes de carga para modos não canônicos', () => {
    const exercises = [
      { name: 'Flexão', loadMode: 'bodyweight', sets: [{ reps: 20, completed: true }] },
      { name: 'Barra assistida', loadMode: 'assisted', sets: [{ weight: 20, reps: 10, completed: true }] },
      { name: 'Prancha', loadMode: 'duration', sets: [{ duration: 60, completed: true }] },
      { name: 'Corrida', loadMode: 'distance', sets: [{ distance: 3, completed: true }] },
      { name: 'Abdominal', loadMode: 'reps_only', sets: [{ reps: 30, completed: true }] },
    ];
    expect(calculateWorkoutBossDamage(exercises, [])).toEqual({
      baseDamage: 0,
      criticalBonus: 0,
      criticalHits: 0,
      powerBonus: 0,
      powerHits: 0,
      damage: 0,
    });
  });

  it('não compara benchmarks de modos de carga incompatíveis', () => {
    const history = [{ exercises: [{
      name: 'Rosca', loadMode: 'total', sets: [{ weight: 40, reps: 8, completed: true }],
    }] }];
    expect(calculateWorkoutBossDamage([{
      name: 'Rosca', loadMode: 'per_hand', sets: [{ weight: 20, reps: 9, completed: true, loadMode: 'per_hand' }],
    }], history)).toMatchObject({ criticalHits: 0, powerHits: 0, baseDamage: 360 });
  });

  it('usa a carga canônica para Power Hit sem perder a semântica por lado', () => {
    const history = [{ exercises: [{
      name: 'Agachamento',
      loadMode: 'per_side',
      barWeight: 20,
      sets: [{ weight: 20, reps: 8, completed: true, loadMode: 'per_side' }],
    }] }];
    expect(calculateWorkoutBossDamage([{
      name: 'Agachamento',
      loadMode: 'per_side',
      barWeight: 20,
      sets: [{ weight: 20, reps: 9, completed: true, loadMode: 'per_side' }],
    }], history)).toMatchObject({ criticalHits: 0, powerHits: 1, baseDamage: 540, powerBonus: 54 });
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

  it('mantém compatibilidade com encontros antigos sem campos de Power Hit', () => {
    const legacyEncounter = {
      encounterId: 'legacy:boss',
      maxHp: 1000,
      damage: 0,
      baseDamage: 0,
      criticalBonus: 0,
      criticalHits: 0,
    };
    expect(updateBossEncounter(legacyEncounter, [{
      name: 'Supino', loadMode: 'total', sets: [{ weight: 50, reps: 10, completed: true }],
    }], [], 'A')).toMatchObject({ powerBonus: 0, powerHits: 0, damage: 500 });
  });
});
