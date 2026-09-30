import { daysBetweenLocalDates, getLocalDateKey } from './dateUtils';
import { getMuscleGroup } from './exerciseParser';
import { calculateCompletedVolume } from './sessionModel';

const CORE_MUSCLE_GROUPS = ['PEITO', 'COSTAS', 'PERNAS', 'BRAÇOS', 'OMBROS', 'CORE'];
const FALLBACK_MUSCLE_GROUP = 'OUTROS';

const getVolumeMuscleGroup = (exerciseName) => {
  const normalizedName = String(exerciseName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Variações comuns de cadeia posterior precisam vencer a regra genérica de
  // "terra" (costas). Esta classificação é exclusiva da distribuição de volume
  // e não altera a finalidade do MuscleHeatmap.
  if (/terra romen|\brdl\b|stiff|afundo|bulgar|pelvi|glute|extensao de quadril/.test(normalizedName)) {
    return 'PERNAS';
  }
  return getMuscleGroup(normalizedName);
};

export const getMuscleVolumeDistribution = (
  history = [],
  { referenceDateKey = getLocalDateKey(), windowDays = 30 } = {},
) => {
  const totals = Object.fromEntries(
    [...CORE_MUSCLE_GROUPS, FALLBACK_MUSCLE_GROUP].map((group) => [group, 0]),
  );
  const normalizedWindowDays = Number.isFinite(Number(windowDays))
    ? Math.max(0, Number(windowDays))
    : 30;

  (Array.isArray(history) ? history : []).forEach((session) => {
    const daysAgo = daysBetweenLocalDates(session?.dateKey, referenceDateKey);
    if (daysAgo === null || daysAgo < 0 || daysAgo > normalizedWindowDays) return;

    (Array.isArray(session?.exercises) ? session.exercises : []).forEach((exercise) => {
      const canonicalVolume = calculateCompletedVolume(exercise?.sets || [], exercise);
      if (!Number.isFinite(canonicalVolume) || canonicalVolume <= 0) return;

      const exerciseName = exercise?.performedName || exercise?.name || exercise?.plannedName || '';
      const group = exerciseName ? getVolumeMuscleGroup(exerciseName) : FALLBACK_MUSCLE_GROUP;
      totals[group in totals ? group : FALLBACK_MUSCLE_GROUP] += canonicalVolume;
    });
  });

  const groups = totals[FALLBACK_MUSCLE_GROUP] > 0
    ? [...CORE_MUSCLE_GROUPS, FALLBACK_MUSCLE_GROUP]
    : CORE_MUSCLE_GROUPS;
  const totalVolume = groups.reduce((sum, group) => sum + totals[group], 0);

  return groups.map((name) => ({
    name,
    volume: totals[name],
    percentage: totalVolume > 0 ? Math.round((totals[name] / totalVolume) * 100) : 0,
  }));
};
