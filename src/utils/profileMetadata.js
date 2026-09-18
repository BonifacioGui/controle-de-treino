export const MAX_PROFILE_GOALS = 2;

export const PROFILE_GOALS = Object.freeze([
  Object.freeze({ id: 'hypertrophy', label: 'Ganhar massa muscular', focus: 'Hipertrofia muscular', description: 'Construir massa muscular com progressão de treino.' }),
  Object.freeze({ id: 'weight_loss', label: 'Perder gordura', focus: 'Definição corporal', description: 'Reduzir gordura preservando desempenho e massa magra.' }),
  Object.freeze({ id: 'strength', label: 'Aumentar força', focus: 'Força máxima', description: 'Evoluir cargas e eficiência nos movimentos principais.' }),
  Object.freeze({ id: 'endurance', label: 'Melhorar condicionamento', focus: 'Condicionamento físico', description: 'Aumentar resistência, fôlego e capacidade de trabalho.' }),
]);

export const PROFILE_CLASS_EFFECTS = Object.freeze({
  workouts: false,
  quests: false,
  attributes: false,
  xp: false,
  rewards: false,
  progression: false,
  profileAppearance: true,
});

export const PROFILE_CLASS_EFFECT_SUMMARY = 'A classe é um arquétipo visual. Ela não altera treinos, exercícios, missões, atributos, XP, recompensas ou progressão.';

const CLASS_SELECTION_REASON = 'Foi escolhida manualmente por você no cadastro ou nas configurações do perfil. O SOLO não atribui classes por desempenho.';
const CLASS_CHANGE_HINT = 'Pode ser alterada a qualquer momento em Perfil > Configurações, sem perder dados ou progresso.';

const createProfileClass = (definition) => Object.freeze({
  ...definition,
  assignmentReason: CLASS_SELECTION_REASON,
  effects: PROFILE_CLASS_EFFECTS,
  canChange: true,
  changeHint: CLASS_CHANGE_HINT,
});

export const PROFILE_CLASSES = Object.freeze([
  createProfileClass({
    id: 'warrior', male: 'Mercenário', female: 'Mercenária', neutral: 'Mercenário', icon: '⚔️', theme: 'Versatilidade',
    description: 'Perfil visual equilibrado, inspirado em quem adapta a estratégia a diferentes tipos de treino.',
    goalAffinity: ['hypertrophy', 'strength', 'endurance', 'weight_loss'],
  }),
  createProfileClass({
    id: 'assassin', male: 'Infiltrador', female: 'Sombra', neutral: 'Sombra', icon: '🗡️', theme: 'Precisão',
    description: 'Perfil visual de precisão e movimento discreto, sem alterar exercícios ou velocidade de evolução.',
    goalAffinity: ['weight_loss', 'endurance'],
  }),
  createProfileClass({
    id: 'mage', male: 'Mago Street', female: 'Bruxa Street', neutral: 'Tecnomante', icon: '🔮', theme: 'Estratégia',
    description: 'Perfil visual inspirado em análise, planejamento e uso inteligente dos dados do treino.',
    goalAffinity: ['endurance', 'hypertrophy'],
  }),
  createProfileClass({
    id: 'paladin', male: 'Ciborgue', female: 'Ciborgue', neutral: 'Ciborgue', icon: '🛡️', theme: 'Resiliência',
    description: 'Perfil visual que representa resistência e constância diante de rotinas exigentes.',
    goalAffinity: ['endurance', 'hypertrophy'],
  }),
  createProfileClass({
    id: 'barbarian', male: 'Titã', female: 'Titã', neutral: 'Titã', icon: '🦍', theme: 'Força',
    description: 'Perfil visual que simboliza desenvolvimento de força e aumento progressivo das cargas.',
    goalAffinity: ['strength', 'hypertrophy'],
  }),
  createProfileClass({
    id: 'ranger', male: 'Nômade', female: 'Nômade', neutral: 'Nômade', icon: '🏹', theme: 'Adaptação',
    description: 'Perfil visual inspirado em resistência, mobilidade e adaptação a diferentes ambientes.',
    goalAffinity: ['endurance', 'weight_loss'],
  }),
  createProfileClass({
    id: 'monk', male: 'Biohacker', female: 'Biohacker', neutral: 'Biohacker', icon: '🧬', theme: 'Controle corporal',
    description: 'Perfil visual de atenção ao corpo, técnica e acompanhamento consistente das métricas.',
    goalAffinity: ['weight_loss', 'endurance'],
  }),
  createProfileClass({
    id: 'necromancer', male: 'Ceifador', female: 'Ceifadora', neutral: 'Ceifador', icon: '💀', theme: 'Persistência',
    description: 'Perfil visual que representa recuperação, retomada e persistência depois de pausas.',
    goalAffinity: ['hypertrophy', 'endurance'],
  }),
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

export const getClassGoalRelationship = (classId, metadata = {}) => {
  const definition = getClassDefinition(classId);
  const selectedGoals = getUserGoalIds(metadata);
  const selectedLabels = selectedGoals.map((goalId) => getGoalDefinition(goalId).label);
  const thematicMatches = selectedGoals.filter((goalId) => definition.goalAffinity.includes(goalId));
  const relationship = thematicMatches.length > 0
    ? 'Existe afinidade temática com pelo menos um deles, mas isso não concede bônus.'
    : 'Ela pode ser usada com esses objetivos, mas não possui vínculo automático com eles.';
  return `Seus objetivos são ${selectedLabels.join(' e ')}. ${relationship}`;
};

export const getClassDetails = (metadata = {}) => {
  const definition = getClassDefinition(metadata.class);
  return {
    ...definition,
    label: getClassLabel(definition.id, metadata.gender),
    goalRelationship: getClassGoalRelationship(definition.id, metadata),
  };
};

export const toCompatibleProfileGoals = (goals, legacyGoal) => {
  const normalized = normalizeGoalIds(goals, legacyGoal);
  return { goals: normalized, goal: normalized[0] };
};
