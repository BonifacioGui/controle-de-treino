import { describe, expect, it } from 'vitest';
import {
  calculateBossMaxHp,
  calculateWorkoutBossDamage,
  createBossEncounter,
  getBossEvolutionStage,
  selectBoss,
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

  it('considera sessão parcial com dano base válido na referência do próximo Boss', () => {
    const history = [{
      workoutName: 'C',
      partial: true,
      totalVolume: 10447,
      bossEncounter: { baseDamage: 10447, maxHp: 5000 },
    }];
    expect(calculateBossMaxHp(history, 'C')).toBe(10969);
  });

  it('não deixa uma performance parcial pequena reduzir o HP existente', () => {
    const history = [{
      workoutName: 'C',
      partial: true,
      bossEncounter: { baseDamage: 1000, maxHp: 12000 },
    }];
    expect(calculateBossMaxHp(history, 'C')).toBe(12000);
  });

  it('usa somente as três performances válidas mais recentes do mesmo treino', () => {
    const history = [9000, 6000, 3000, 50000].map((baseDamage) => ({
      workoutName: 'A', bossEncounter: { baseDamage, maxHp: 5000 },
    }));
    history.push({ workoutName: 'B', bossEncounter: { baseDamage: 90000, maxHp: 90000 } });
    expect(calculateBossMaxHp(history, 'A')).toBe(6300);
  });

  it('mantém fallback de 5.000 sem performance e ignora sessão sem volume', () => {
    expect(calculateBossMaxHp([], 'A')).toBe(5000);
    expect(calculateBossMaxHp([{ workoutName: 'A', partial: true, totalVolume: 0 }], 'A')).toBe(5000);
  });

  it('usa totalVolume como fallback para histórico antigo sem encontro do Boss', () => {
    expect(calculateBossMaxHp([{ workoutName: 'A', partial: true, totalVolume: 8000 }], 'A')).toBe(8400);
  });

  it('mantém a família do Boss estável em datas diferentes para o mesmo treino', () => {
    const first = selectBoss({ dateKey: '2026-08-01', workoutName: 'A', workoutTitle: 'Peito' });
    const second = selectBoss({ dateKey: '2026-10-31', workoutName: 'A', workoutTitle: 'Peito atualizado' });
    expect(second.id).toBe(first.id);
  });

  it('permite que treinos diferentes pertençam a famílias diferentes', () => {
    const families = new Set(['A', 'B', 'C', 'D'].map((workoutName) => (
      selectBoss({ workoutName, workoutTitle: `Treino ${workoutName}` }).id
    )));
    expect(families.size).toBeGreaterThan(1);
  });

  it.each([
    [0, 1, 'Forma I'],
    [3, 2, 'Forma II'],
    [6, 3, 'Forma III'],
    [10, 4, 'Forma IV'],
    [15, 5, 'Forma V'],
  ])('evolui para o estágio correto após %i derrotas', (defeats, stage, label) => {
    expect(getBossEvolutionStage(defeats)).toEqual(expect.objectContaining({ stage, label }));
  });

  it('deriva a forma do encontro pelas derrotas anteriores do mesmo treino', () => {
    const history = Array.from({ length: 6 }, () => ({
      workoutName: 'A', bossEncounter: { defeated: true, baseDamage: 6000, maxHp: 6000 },
    }));
    history.push({ workoutName: 'B', bossEncounter: { defeated: true, baseDamage: 9000, maxHp: 9000 } });
    expect(createBossEncounter({ sessionId: 'next', workoutName: 'A', workout, history }))
      .toMatchObject({ evolutionStage: 3, evolutionLabel: 'Forma III' });
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
