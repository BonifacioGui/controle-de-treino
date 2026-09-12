import { daysBetweenLocalDates, getLocalDateKey } from './dateUtils';
import { OVERLOAD_XP_MULTIPLIER, VOLUME_XP_RATE } from './xpModel';

export const RPG_LEVEL_DIVISOR = 100;

const volumePercent = Math.round(VOLUME_XP_RATE * 100);
const overloadPercent = Math.round((OVERLOAD_XP_MULTIPLIER - 1) * 100);

export const RPG_ATTRIBUTE_INFO = Object.freeze({
  STR: Object.freeze({
    short: 'FOR',
    name: 'Força',
    summary: 'Carga e potência nos movimentos básicos.',
    howToEarn: 'Confirme séries com carga em supinos, desenvolvimentos, leg press, remadas baixas e levantamentos terra. Exercícios sem uma categoria específica também entram aqui.',
    calculation: `XP = volume confirmado × ${volumePercent}%. Quando a sessão inteira é classificada como sobrecarga, o ganho recebe +${overloadPercent}%. Missões contam somente no XP total.`,
  }),
  DEX: Object.freeze({
    short: 'DES',
    name: 'Destreza',
    summary: 'Técnica e controle em movimentos de precisão.',
    howToEarn: 'Confirme séries com carga em crossover, crucifixo inverso ou invertido, stiff, afundos, serrote, face pull e remada curvada.',
    calculation: `XP = volume confirmado × ${volumePercent}%. Quando a sessão inteira é classificada como sobrecarga, o ganho recebe +${overloadPercent}%. Missões contam somente no XP total.`,
    pattern: /\b(crossover|crucifixo (?:inverso|invertido)|stiff|rdl|terra romeno|romeno|afundo|bulgaro|serrote|face pull|remada curvada)\b/,
  }),
  VIT: Object.freeze({
    short: 'VIT',
    name: 'Vitalidade',
    summary: 'Capacidade de sustentar o trabalho de pernas, core e cardio.',
    howToEarn: 'Confirme séries com carga em extensora, flexora, abdutora e panturrilha. Core e cardio entram em VIT, mas atividades sem volume de carga ainda não somam XP de atributo.',
    calculation: `XP = volume confirmado × ${volumePercent}%. Quando a sessão inteira é classificada como sobrecarga, o ganho recebe +${overloadPercent}%. Missões contam somente no XP total.`,
    pattern: /\b(extensora|flexora|abdutora|adutora|panturrilha|gemeos|prancha|vacuum|abdominal|giro russo|russian twist|cardio|caminhada|esteira|bicicleta|spinning|eliptico|escada|pular corda|remo seco|corrida)\b/,
  }),
  CHA: Object.freeze({
    short: 'CAR',
    name: 'Carisma',
    summary: 'Progressão dos movimentos de acabamento muscular.',
    howToEarn: 'Confirme séries com carga em elevação lateral, tríceps, roscas e elevação pélvica.',
    calculation: `XP = volume confirmado × ${volumePercent}%. Quando a sessão inteira é classificada como sobrecarga, o ganho recebe +${overloadPercent}%. Missões contam somente no XP total.`,
    pattern: /\b(elevacao lateral|elevacao frontal|elevacao pelvica|encolhimento|triceps|rosca)\b/,
  }),
  FOCUS: Object.freeze({
    short: 'FOCO',
    name: 'Foco',
    summary: 'Mantém sua sequência recente de treinos.',
    howToEarn: 'Mantenha no máximo 3 dias entre as datas dos treinos — isso permite até 2 dias completos de descanso. A sequência zera quando o intervalo é maior.',
    calculation: 'FOCO = máx(1, 2 × quantidade de datas na sequência atual).',
  }),
  DISCIPLINE: Object.freeze({
    short: 'DISCIPLINA',
    name: 'Disciplina',
    summary: 'Traduz o histórico acumulado e a frequência recente.',
    howToEarn: 'A cada 2 sessões registradas você ganha 1 ponto. Depois de 7 dias sem treino, perde 1 ponto a cada 3 dias extras, com mínimo de 1.',
    calculation: 'DISCIPLINA = ⌊sessões ÷ 2⌋ − penalidade por inatividade.',
  }),
});

export const RPG_XP_INFO = Object.freeze({
  name: 'XP total',
  summary: 'Soma a experiência salva em todas as sessões.',
  howToEarn: `Confirme séries para gerar volume, supere o volume do último treino da mesma ficha para receber +${overloadPercent}% e conclua missões para ganhar bônus.`,
  calculation: `XP do treino = ⌊volume confirmado × ${volumePercent}% × multiplicador⌋ + bônus de missões. O multiplicador é ${OVERLOAD_XP_MULTIPLIER.toLocaleString('pt-BR')}× somente em sobrecarga.`,
});

const normalizeExerciseName = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const getExerciseAttribute = (exerciseName) => {
  const normalizedName = normalizeExerciseName(exerciseName);
  // Movimentos nomeados vencem acessórios/equipamentos citados depois no nome.
  // Ex.: "elevação lateral no crossover" continua sendo CAR, não DES.
  return ['CHA', 'VIT', 'DEX']
    .find((key) => RPG_ATTRIBUTE_INFO[key].pattern.test(normalizedName)) || 'STR';
};

export const getRpgLevelFromXp = (xp) => {
  const safeXp = Math.max(0, Number(xp) || 0);
  return Math.floor(Math.sqrt(safeXp / RPG_LEVEL_DIVISOR)) + 1;
};

export const getRpgLevelProgress = (xp) => {
  const safeXp = Math.max(0, Number(xp) || 0);
  const level = getRpgLevelFromXp(safeXp);
  const currentThreshold = Math.pow(level - 1, 2) * RPG_LEVEL_DIVISOR;
  const nextThreshold = Math.pow(level, 2) * RPG_LEVEL_DIVISOR;
  const xpForLevel = Math.max(1, nextThreshold - currentThreshold);
  const xpIntoLevel = Math.max(0, safeXp - currentThreshold);

  return {
    level,
    currentThreshold,
    nextThreshold,
    progress: Math.min(100, Math.max(0, (xpIntoLevel / xpForLevel) * 100)),
    xpRemaining: Math.max(0, Math.ceil(nextThreshold - safeXp)),
  };
};

export const calculateFocusLevel = (streak) => Math.max(1, (Math.max(0, Number(streak) || 0) * 2));

export const calculateDisciplineLevel = (history, referenceDateKey = getLocalDateKey()) => {
  if (!Array.isArray(history) || history.length === 0) return 1;
  const baseDiscipline = Math.floor(history.length / 2);
  const latestDateKey = history
    .map((entry) => entry?.dateKey)
    .filter(Boolean)
    .sort((left, right) => right.localeCompare(left))[0];
  const daysInactive = latestDateKey ? daysBetweenLocalDates(latestDateKey, referenceDateKey) : 0;
  const penalty = Number.isFinite(daysInactive) && daysInactive > 7
    ? Math.floor((daysInactive - 7) / 3)
    : 0;
  return Math.max(1, baseDiscipline - penalty);
};

export const getAttributeKeyFromSubject = (subject) => Object.entries(RPG_ATTRIBUTE_INFO)
  .find(([, info]) => info.short === subject)?.[0] || null;
