export const MAX_PROFILE_GOALS = 2;

export const PROFILE_GOALS = Object.freeze([
  Object.freeze({ id: 'hypertrophy', label: 'Ganhar massa muscular', focus: 'Hipertrofia muscular', description: 'Construir massa muscular com progressão de treino.' }),
  Object.freeze({ id: 'weight_loss', label: 'Perder gordura', focus: 'Definição corporal', description: 'Reduzir gordura preservando desempenho e massa magra.' }),
  Object.freeze({ id: 'strength', label: 'Aumentar força', focus: 'Força máxima', description: 'Evoluir cargas e eficiência nos movimentos principais.' }),
  Object.freeze({ id: 'endurance', label: 'Melhorar condicionamento', focus: 'Condicionamento físico', description: 'Aumentar resistência, fôlego e capacidade de trabalho.' }),
]);

export const PROFILE_CLASSES = Object.freeze([
  Object.freeze({ id: 'warrior', male: 'Mercenário', female: 'Mercenária', neutral: 'Mercenário', icon: '⚔️', description: 'Arquétipo tático e versátil.' }),
  Object.freeze({ id: 'assassin', male: 'Infiltrador', female: 'Sombra', neutral: 'Sombra', icon: '🗡️', description: 'Arquétipo ágil e discreto.' }),
  Object.freeze({ id: 'mage', male: 'Mago Street', female: 'Bruxa Street', neutral: 'Tecnomante', icon: '🔮', description: 'Arquétipo ligado a estratégia e tecnologia.' }),
  Object.freeze({ id: 'paladin', male: 'Ciborgue', female: 'Ciborgue', neutral: 'Ciborgue', icon: '🛡️', description: 'Arquétipo blindado e resiliente.' }),
  Object.freeze({ id: 'barbarian', male: 'Titã', female: 'Titã', neutral: 'Titã', icon: '🦍', description: 'Arquétipo de força bruta.' }),
  Object.freeze({ id: 'ranger', male: 'Nômade', female: 'Nômade', neutral: 'Nômade', icon: '🏹', description: 'Arquétipo resistente e adaptável.' }),
  Object.freeze({ id: 'monk', male: 'Biohacker', female: 'Biohacker', neutral: 'Biohacker', icon: '🧬', description: 'Arquétipo de controle corporal.' }),
  Object.freeze({ id: 'necromancer', male: 'Ceifador', female: 'Ceifadora', neutral: 'Ceifador', icon: '💀', description: 'Arquétipo de recuperação e persistência.' }),
]);

const validGoalIds = new Set(PROFILE_GOALS.map(({ id }) => id));
const validClassIds = new Set(PROFILE_CLASSES.map(({ id }) => id));

export const normalizeGender = (gender) => {
  if (gender === 'female') return 'female';
  if (gender === 'male') return 'male';
  return 'neutral';
};

export const normalizeGoalIds = (goals, legacyGoal) => {
  const candidates = Array.isArray(goals) ? goals : [];
  const normalized = [...new Set(candidates.filter((goal) => validGoalIds.has(goal)))].slice(0, MAX_PROFILE_GOALS);
  if (normalized.length > 0) return normalized;
  if (validGoalIds.has(legacyGoal)) return [legacyGoal];
  return [PROFILE_GOALS[0].id];
};

export const getUserGoalIds = (metadata = {}) => normalizeGoalIds(metadata.goals, metadata.goal);

export const toggleGoalSelection = (currentGoals, goalId) => {
  const current = normalizeGoalIds(currentGoals, null);
  if (!validGoalIds.has(goalId)) return current;
  if (current.includes(goalId)) {
    const next = current.filter((id) => id !== goalId);
    return next.length > 0 ? next : current;
  }
  if (current.length >= MAX_PROFILE_GOALS) return current;
  return [...current, goalId];
};

export const getGoalDefinition = (goalId) => PROFILE_GOALS.find(({ id }) => id === goalId) || PROFILE_GOALS[0];

export const getGoalLabels = (metadata = {}) => getUserGoalIds(metadata).map((goalId) => getGoalDefinition(goalId).label);

export const getProfileFocus = (metadata = {}) => getGoalDefinition(getUserGoalIds(metadata)[0]).focus;

export const getClassDefinition = (classId) => PROFILE_CLASSES.find(({ id }) => id === classId) || PROFILE_CLASSES[0];

export const getClassLabel = (classId, gender) => {
  const definition = getClassDefinition(validClassIds.has(classId) ? classId : PROFILE_CLASSES[0].id);
  return definition[normalizeGender(gender)] || definition.neutral;
};

export const toCompatibleProfileGoals = (goals, legacyGoal) => {
  const normalized = normalizeGoalIds(goals, legacyGoal);
  return { goals: normalized, goal: normalized[0] };
};
