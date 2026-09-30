import { calculateSetCanonicalVolume, getCanonicalLoad, getSetLoadMode, isCanonicalLoadMode } from './loadModel';
import { parsePositiveInteger } from './numberUtils';
import { getCompletedLoadBenchmarks } from './progressionUtils';

export const BOSS_CATALOG = Object.freeze([
  { id: 'scavenger-unit', name: 'SCAVENGER UNIT', tier: 1, rarity: 'common', assetKey: 'scavenger', aura: '#8b9bb4' },
  { id: 'neon-revenant', name: 'NEON REVENANT', tier: 2, rarity: 'uncommon', assetKey: 'revenant', aura: '#00f3ff' },
  { id: 'void-colossus', name: 'VOID COLOSSUS', tier: 3, rarity: 'rare', assetKey: 'colossus', aura: '#6e7bff' },
  { id: 'iron-titan', name: 'IRON TITAN', tier: 4, rarity: 'epic', assetKey: 'iron-titan', aura: '#d946ef' },
  { id: 'redline-warden', name: 'REDLINE WARDEN', tier: 5, rarity: 'legendary', assetKey: 'warden', aura: '#ff3d81' },
]);

const hashSeed = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const selectBoss = ({ dateKey, workoutName, workoutTitle = '' }) => {
  const index = hashSeed(`${dateKey}:${workoutName}:${workoutTitle}`) % BOSS_CATALOG.length;
  return BOSS_CATALOG[index];
};

export const isBossEligibleWorkout = (workout = {}) => (workout.exercises || []).some(
  (exercise) => isCanonicalLoadMode(getSetLoadMode({}, exercise)),
);

export const calculateBossMaxHp = (history = [], workoutName) => {
  const recentVolumes = history
    .filter((entry) => entry.workoutName === workoutName && entry.partial !== true)
    .map((entry) => Number(entry.totalVolume) || 0)
    .filter((volume) => volume > 0)
    .slice(0, 3);
  if (recentVolumes.length === 0) return 5000;
  const average = recentVolumes.reduce((sum, volume) => sum + volume, 0) / recentVolumes.length;
  return Math.max(2000, Math.round(average * 1.05));
};

export const createBossEncounter = ({ sessionId, dateKey, workoutName, workout, history = [] }) => {
  if (!sessionId || !isBossEligibleWorkout(workout)) return null;
  const boss = selectBoss({ dateKey, workoutName, workoutTitle: workout?.title });
  const maxHp = calculateBossMaxHp(history, workoutName);
  return {
    encounterId: `${sessionId}:boss`,
    sessionId,
    bossId: boss.id,
    bossName: boss.name,
    bossTier: boss.tier,
    bossRarity: boss.rarity,
    bossAssetKey: boss.assetKey,
    bossAura: boss.aura,
    maxHp,
    damage: 0,
    baseDamage: 0,
    criticalBonus: 0,
    criticalHits: 0,
    powerBonus: 0,
    powerHits: 0,
    remainingHp: maxHp,
    overkill: 0,
    defeated: false,
    metricType: 'canonical_volume_kg',
    createdAt: Date.now(),
  };
};

export const calculateWorkoutBossDamage = (exercises = [], history = []) => {
  let baseDamage = 0;
  let criticalBonus = 0;
  let criticalHits = 0;
  let powerBonus = 0;
  let powerHits = 0;
  const historicalExercises = history.flatMap((entry) => entry.exercises || []);

  exercises.forEach((exercise) => {
    const currentMode = getSetLoadMode({}, exercise);
    if (!isCanonicalLoadMode(currentMode)) return;
    const benchmarks = getCompletedLoadBenchmarks(historicalExercises, exercise.name, currentMode);
    let runningBest = benchmarks.bestLoad;
    const runningBestRepsByLoad = new Map(benchmarks.bestRepsByLoad);
    (exercise.sets || []).forEach((set) => {
      if (!set.completed) return;
      if (getSetLoadMode(set, exercise) !== currentMode) return;
      const setDamage = calculateSetCanonicalVolume(set, exercise);
      const canonicalLoad = getCanonicalLoad(set, exercise) ?? 0;
      const reps = parsePositiveInteger(set.reps);
      if (setDamage <= 0 || reps === null) return;
      baseDamage += setDamage;

      if (runningBest > 0 && canonicalLoad > runningBest) {
        criticalBonus += setDamage * 0.2;
        criticalHits += 1;
      } else {
        const previousBestReps = runningBestRepsByLoad.get(canonicalLoad) || 0;
        if (previousBestReps > 0 && reps > previousBestReps) {
          powerBonus += setDamage * 0.1;
          powerHits += 1;
        }
      }

      runningBest = Math.max(runningBest, canonicalLoad);
      runningBestRepsByLoad.set(canonicalLoad, Math.max(
        runningBestRepsByLoad.get(canonicalLoad) || 0,
        reps,
      ));
    });
  });

  const round = (value) => Math.round(value * 100) / 100;
  return {
    baseDamage: round(baseDamage),
    criticalBonus: round(criticalBonus),
    criticalHits,
    powerBonus: round(powerBonus),
    powerHits,
    damage: round(baseDamage + criticalBonus + powerBonus),
  };
};

export const updateBossEncounter = (encounter, exercises = [], history = [], workoutName) => {
  if (!encounter) return null;
  const damageReport = calculateWorkoutBossDamage(exercises, history, workoutName);
  const maxHp = Math.max(1, Number(encounter.maxHp) || 1);
  const remainingHp = Math.max(0, maxHp - damageReport.damage);
  return {
    ...encounter,
    ...damageReport,
    remainingHp,
    defeated: damageReport.damage >= maxHp,
    overkill: Math.max(0, damageReport.damage - maxHp),
  };
};

export const getBossBattleReport = (encounter, prsBroken = 0) => {
  if (!encounter) return 'Sessão registrada com métricas reais.';
  const ratio = encounter.maxHp > 0 ? encounter.damage / encounter.maxHp : 0;
  if (ratio >= 1 && prsBroken > 0) return 'Alvo neutralizado com novo recorde de carga.';
  if (ratio >= 1) return 'Alvo neutralizado.';
  if (ratio >= 0.8) return 'Alvo em estado crítico.';
  if (ratio >= 0.5) return 'Dano significativo. Progresso registrado.';
  return 'O alvo permanece ativo. Sessão registrada.';
};
