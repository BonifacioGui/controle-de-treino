import { daysBetweenLocalDates, getLocalDateKey, parseLocalDateKey } from './dateUtils';
import { getMuscleGroup } from './exerciseParser';

export const NOTIFICATION_CATEGORIES = Object.freeze({
  muscleGaps: 'muscle-gaps',
});

export const NOTIFICATION_COOLDOWN_MS = 4 * 24 * 60 * 60 * 1000;
export const MUSCLE_GAP_DEDUPE_KEY = 'muscle-gap:active-plan';

export const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  muscleGaps: true,
  pauseUntil: null,
});

export const MUSCLE_GROUP_LABELS = Object.freeze({
  PEITO: 'peitoral',
  COSTAS: 'costas',
  PERNAS: 'pernas',
  'BRAÇOS': 'braços',
  OMBROS: 'ombros',
  CORE: 'core',
});

const normalizeExerciseName = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export const getExerciseMuscleTargets = (exerciseName) => {
  const normalized = normalizeExerciseName(exerciseName);
  let primary = getMuscleGroup(normalized);
  if (/terra romen|\brdl\b|stiff|afundo|bulgar|pelvi|glute|extensao de quadril/.test(normalized)) primary = 'PERNAS';
  if (!MUSCLE_GROUP_LABELS[primary]) return { primary: [], secondary: [] };

  const secondary = new Set();
  if (primary === 'PEITO') {
    secondary.add('BRAÇOS');
    secondary.add('OMBROS');
  }
  if (primary === 'COSTAS') secondary.add('BRAÇOS');
  if (primary === 'PERNAS' && /agacha|leg|terra|stiff|afundo|bulgar/.test(normalized)) secondary.add('CORE');
  if (primary === 'OMBROS' && /desenv|frontal/.test(normalized)) secondary.add('BRAÇOS');
  if (primary === 'BRAÇOS' && /paralela|mergulho/.test(normalized)) secondary.add('PEITO');
  secondary.delete(primary);
  return { primary: [primary], secondary: [...secondary] };
};

const completedSetCount = (exercise) => (Array.isArray(exercise?.sets) ? exercise.sets : [])
  .filter((set) => set?.completed === true || set?.done === true || set?.checked === true).length;

export const getPlannedMuscleFrequency = (workoutData = {}) => {
  const stimulus = {};
  const workoutDays = {};

  Object.entries(workoutData || {}).forEach(([day, workout]) => {
    const daily = {};
    (Array.isArray(workout?.exercises) ? workout.exercises : []).forEach((exercise) => {
      const targets = getExerciseMuscleTargets(exercise?.name);
      targets.primary.forEach((group) => { daily[group] = Math.max(daily[group] || 0, 1); });
      targets.secondary.forEach((group) => { daily[group] = Math.max(daily[group] || 0, 0.5); });
    });
    Object.entries(daily).forEach(([group, credit]) => {
      stimulus[group] = (stimulus[group] || 0) + credit;
      if (!workoutDays[group]) workoutDays[group] = [];
      workoutDays[group].push(day);
    });
  });

  return Object.fromEntries(Object.entries(stimulus).map(([group, credit]) => [group, {
    frequency: Math.max(1, Math.round(credit)),
    stimulus: credit,
    workoutDays: workoutDays[group] || [],
  }]));
};

const getSessionMuscleStimulus = (session) => {
  const totals = {};
  (Array.isArray(session?.exercises) ? session.exercises : []).forEach((exercise) => {
    const completedSets = completedSetCount(exercise);
    if (completedSets <= 0 || exercise?.skipped === true) return;
    const targets = getExerciseMuscleTargets(exercise?.performedName || exercise?.name || exercise?.plannedName);
    targets.primary.forEach((group) => { totals[group] = (totals[group] || 0) + completedSets; });
    targets.secondary.forEach((group) => { totals[group] = (totals[group] || 0) + completedSets * 0.5; });
  });
  return totals;
};

const getWeekStartKey = (referenceDateKey) => {
  const date = parseLocalDateKey(referenceDateKey);
  if (!date) return referenceDateKey;
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return getLocalDateKey(date);
};

const formatGroupList = (groups) => {
  const labels = groups.map((group) => MUSCLE_GROUP_LABELS[group] || group.toLowerCase());
  if (labels.length <= 1) return labels[0] || '';
  return `${labels.slice(0, -1).join(', ')} e ${labels.at(-1)}`;
};

export const buildMuscleGapNotification = ({
  workoutData = {},
  history = [],
  preferences = DEFAULT_NOTIFICATION_PREFERENCES,
  referenceDateKey = getLocalDateKey(),
  now = Date.now(),
} = {}) => {
  if (preferences.muscleGaps === false) return null;
  if (preferences.pauseUntil && daysBetweenLocalDates(referenceDateKey, preferences.pauseUntil) >= 0) return null;

  const completedHistory = (Array.isArray(history) ? history : []).filter((session) => (
    session?.dateKey && Object.values(getSessionMuscleStimulus(session)).some((value) => value > 0)
  ));
  if (completedHistory.length < 2) return null;

  const planned = getPlannedMuscleFrequency(workoutData);
  if (Object.keys(planned).length === 0) return null;

  const weekStart = getWeekStartKey(referenceDateKey);
  const weekDayIndex = daysBetweenLocalDates(weekStart, referenceDateKey) ?? 0;
  const observations = Object.fromEntries(Object.keys(planned).map((group) => [group, {
    lastDateKey: null,
    weeklySessions: 0,
  }]));

  completedHistory.forEach((session) => {
    const stimulus = getSessionMuscleStimulus(session);
    Object.keys(observations).forEach((group) => {
      if ((stimulus[group] || 0) < 0.5) return;
      if (!observations[group].lastDateKey || session.dateKey > observations[group].lastDateKey) {
        observations[group].lastDateKey = session.dateKey;
      }
      const daysFromWeekStart = daysBetweenLocalDates(weekStart, session.dateKey);
      if (daysFromWeekStart !== null && daysFromWeekStart >= 0 && daysFromWeekStart <= 6) {
        observations[group].weeklySessions += 1;
      }
    });
  });

  const gaps = Object.entries(planned).map(([group, plan]) => {
    const observation = observations[group];
    const daysSince = observation.lastDateKey
      ? daysBetweenLocalDates(observation.lastDateKey, referenceDateKey)
      : null;
    const expectedInterval = Math.max(1, Math.ceil(7 / plan.frequency));
    const overdue = daysSince === null ? weekDayIndex >= 4 : daysSince > expectedInterval + 2;
    const weeklyShortfall = weekDayIndex >= 5 && observation.weeklySessions < plan.frequency;
    return { group, ...plan, ...observation, daysSince, overdue, weeklyShortfall };
  }).filter((item) => item.overdue || item.weeklyShortfall)
    .sort((left, right) => (right.daysSince ?? 999) - (left.daysSince ?? 999));

  if (gaps.length === 0) return null;

  const highlighted = gaps.slice(0, 3);
  const primaryGap = highlighted[0];
  const groupText = formatGroupList(highlighted.map(({ group }) => group));
  const singleMessage = primaryGap.daysSince === null
    ? `Sua ficha prevê ${MUSCLE_GROUP_LABELS[primaryGap.group]} cerca de ${primaryGap.frequency}x por semana, mas ainda não há séries registradas para esse grupo.`
    : `Nenhuma série para ${MUSCLE_GROUP_LABELS[primaryGap.group]} foi registrada nos últimos ${primaryGap.daysSince} dias. Sua ficha prevê cerca de ${primaryGap.frequency} ${primaryGap.frequency === 1 ? 'estímulo' : 'estímulos'} por semana.`;
  const groupedMessage = `${groupText} estão abaixo da frequência prevista na ficha atual. Abra o treino relacionado e confira as séries pendentes.`;

  return {
    dedupeKey: MUSCLE_GAP_DEDUPE_KEY,
    category: NOTIFICATION_CATEGORIES.muscleGaps,
    title: highlighted.length === 1 ? `Atenção ao treino de ${MUSCLE_GROUP_LABELS[primaryGap.group]}` : 'Grupos abaixo da frequência planejada',
    message: highlighted.length === 1 ? singleMessage : groupedMessage,
    createdAt: new Date(now).toISOString(),
    action: {
      label: 'Abrir treino',
      view: 'workout',
      workoutDay: primaryGap.workoutDays[0] || null,
    },
    context: { groups: highlighted.map(({ group }) => group) },
  };
};

export const normalizeNotificationState = (value = {}) => ({
  items: Array.isArray(value.items) ? value.items : [],
  emissions: value.emissions && typeof value.emissions === 'object' ? value.emissions : {},
  preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(value.preferences || {}) },
});

export const mergeNotificationCandidates = (
  state,
  candidates,
  { now = Date.now(), cooldownMs = NOTIFICATION_COOLDOWN_MS } = {},
) => {
  const normalized = normalizeNotificationState(state);
  const items = [...normalized.items];
  const emissions = { ...normalized.emissions };

  (Array.isArray(candidates) ? candidates : [candidates]).filter(Boolean).forEach((candidate) => {
    const existingIndex = items.findIndex((item) => item.dedupeKey === candidate.dedupeKey);
    if (existingIndex >= 0) {
      items[existingIndex] = {
        ...items[existingIndex],
        ...candidate,
        id: items[existingIndex].id,
        read: items[existingIndex].read,
        createdAt: items[existingIndex].createdAt,
      };
      return;
    }
    const lastEmission = Number(emissions[candidate.dedupeKey]) || 0;
    if (lastEmission > 0 && now - lastEmission < cooldownMs) return;
    items.unshift({
      ...candidate,
      id: `${candidate.dedupeKey}:${now}`,
      read: false,
    });
    emissions[candidate.dedupeKey] = now;
  });

  return { ...normalized, items: items.slice(0, 30), emissions };
};
