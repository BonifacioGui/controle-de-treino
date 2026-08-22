import { calculateSessionVolume } from './gameLogic';
import { daysBetweenLocalDates, getLocalDateKey } from './dateUtils';
import { parseDecimalInput } from './numberUtils';
import { calculateSessionXp, OVERLOAD_XP_MULTIPLIER } from './xpModel';

// --- CONSTANTES DE BALANCEAMENTO DO JOGO ---
const STAT_XP_MULTIPLIER = 0.05;
const STAT_LEVEL_DIVISOR = 100;

// --- 1. ATRIBUTOS ---
const EXERCISE_STATS = {
  'supino reto': 'STR', 'supino inclinado': 'STR', 'desenvolvimento': 'STR',
  'agachamento hack': 'STR', 'leg press': 'STR', 'remada baixa': 'STR',
  'levantamento terra': 'STR', 'crossover': 'DEX', 'crucifixo inverso': 'DEX',
  'stiff': 'DEX', 'afundo': 'DEX', 'serrote': 'DEX', 'face pull': 'DEX',
  'remada curvada': 'DEX', 'cadeira extensora': 'VIT', 'mesa flexora': 'VIT',
  'cadeira abdutora': 'VIT', 'panturrilha': 'VIT', 'prancha': 'VIT',
  'vacuum': 'VIT', 'abdominal infra': 'VIT', 'caminhada': 'VIT', 'esteira': 'VIT',
  'elevação lateral': 'CHA', 'tríceps francês': 'CHA', 'tríceps corda': 'CHA',
  'tríceps testa': 'CHA', 'tríceps pulley': 'CHA', 'rosca direta': 'CHA',
  'rosca martelo': 'CHA', 'rosca alternada': 'CHA', 'rosca 45º': 'CHA', 'elevação pélvica': 'CHA'
};

// --- 2. MISSÕES DIÁRIAS ---
export const DAILY_QUESTS_POOL = [
  { id: 'vol_beginner', title: 'Aquecimento Pesado', desc: 'Mova 5.000kg totais.', reward: 200, minLevel: 1, maxLevel: 15, check: (s) => calculateSessionVolume(s) >= 5000 },
  { id: 'vol_intermediate', title: 'Caminhão de Mudança', desc: 'Acumule 15.000kg totais.', reward: 450, minLevel: 10, maxLevel: 999, check: (s) => calculateSessionVolume(s) >= 15000 },
  { id: 'vol_pro', title: 'Hércules', desc: 'Mova 25.000kg totais.', reward: 800, minLevel: 25, maxLevel: 999, check: (s) => calculateSessionVolume(s) >= 25000 },
  { id: 'reps_100', title: 'Centenário', desc: 'Faça 100+ repetições.', reward: 150, minLevel: 1, maxLevel: 999, check: (s) => calculateTotalReps(s) >= 100 },
  { id: 'reps_200', title: 'Maratonista', desc: 'Faça 200+ repetições.', reward: 400, minLevel: 15, maxLevel: 999, check: (s) => calculateTotalReps(s) >= 200 },
  { id: 'focus_chest', title: 'Peito de Aço', desc: '8+ séries de empurrar.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.filter(e => /supino|crucifixo|crossover|desenvolvimento/i.test(e.name)).reduce((acc, e) => acc + e.sets.filter(set => set.completed).length, 0) >= 8 },
  { id: 'focus_legs', title: 'Não pule o Leg Day', desc: 'Treino de pernas registrado.', reward: 500, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.some(e => e.sets.some(set => set.completed) && /agachamento|leg|extensora|flexora/i.test(e.name)) },
  { id: 'focus_arms', title: 'Esmaga que Cresce', desc: '4+ exercícios de braço.', reward: 250, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.filter(e => e.sets.some(set => set.completed) && /rosca|tríceps|triceps/i.test(e.name)).length >= 4 },
  { id: 'focus_abs', title: 'Tanque de Guerra', desc: 'Exercícios de core registrados.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.some(e => e.sets.some(set => set.completed) && /prancha|abdominal|vacuum/i.test(e.name)) },
  { id: 'meta_clean', title: 'Perfeccionista', desc: 'Complete tudo hoje.', reward: 600, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.length > 0 && !s.partial && s.exercises.every(ex => ex.skipped || ex.sets.every(set => set.completed)) },
  { id: 'meta_insane', title: 'God Mode', desc: '20ton + 150 Reps.', reward: 1500, minLevel: 30, maxLevel: 999, check: (s) => calculateSessionVolume(s) >= 20000 && calculateTotalReps(s) >= 150 },
  { id: 'time_early', title: 'Clube das 5', desc: 'Treine antes das 12h.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => calculateSessionVolume(s) > 0 && new Date().getHours() < 12 },
  { id: 'time_night', title: 'Morcego', desc: 'Treine após as 19h.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => calculateSessionVolume(s) > 0 && new Date().getHours() >= 19 }
];

// --- 3. LÓGICA DE SORTEIO ---
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export const getDailyQuests = (userLevel = 1) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const todayStr = `${year}-${month}-${day}`;
  const seed = parseInt(`${year}${month}${day}`); 
  const randomFunc = mulberry32(seed);

  const availableQuests = DAILY_QUESTS_POOL.filter(q => userLevel >= q.minLevel && userLevel <= q.maxLevel);
  
  const shuffled = [...availableQuests];
  for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(randomFunc() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3).map(q => ({
      ...q,
      completed: false,
      dateGenerated: todayStr
  }));
};

const calculateTotalReps = (session) => {
  if (!session || !session.exercises) return 0;
  return session.exercises.reduce((acc, ex) => {
     if (!ex.sets || !Array.isArray(ex.sets)) return acc;
     return acc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.reps||0), 0);
  }, 0);
};

// 🎯 FÓRMULA MESTRA
export const getLevelFromXp = (xp) => {
  return Math.floor(Math.sqrt(xp / STAT_LEVEL_DIVISOR)) + 1;
};

export const calculateStats = (history) => {
  const stats = {
    STR: { xp: 0, level: 1, label: "FORÇA" },
    DEX: { xp: 0, level: 1, label: "TÉCNICA" },
    VIT: { xp: 0, level: 1, label: "RESISTÊNCIA" },
    CHA: { xp: 0, level: 1, label: "ESTÉTICA" }
  };
  
  if (!history || !Array.isArray(history)) {
    stats.level = 1; stats.xp = 0; stats.title = "Recruta"; stats.nextLevelProgress = 0;
    return stats;
  }
  
  let totalXp = 0;

  history.forEach(session => {
    totalXp += calculateSessionXp(session);
    const overloadMultiplier = String(session.overloadStatus || '').toUpperCase() === 'OVERLOAD'
      ? OVERLOAD_XP_MULTIPLIER
      : 1;

    if (!session.exercises) return;
    session.exercises.forEach(ex => {
      if (!ex.sets || !Array.isArray(ex.sets) || !ex.name) return;
      
      const vol = ex.sets.reduce((acc, s) => {
        if (!s.completed) return acc; 
        const w = parseDecimalInput(s.weight);
        const r = parseDecimalInput(s.reps);
        if (w === null || r === null) return acc;
        return acc + (w * r);
      }, 0);
      
      const normalizedName = ex.name.trim().toLowerCase();
      const statType = EXERCISE_STATS[normalizedName] || 'STR';
      
      const gainedXp = vol * STAT_XP_MULTIPLIER * overloadMultiplier;
      stats[statType].xp += gainedXp;
    });
  });
  
  Object.keys(stats).forEach(key => {
    if (typeof stats[key] === 'object' && stats[key].xp !== undefined) {
      stats[key].level = getLevelFromXp(stats[key].xp);
    }
  });
  
  // --- CÁLCULO DE STATUS GLOBAL (Otimizado para UI) ---
  
  // 1. Mantemos o XP com decimais para a barra de progresso ter movimento fluido
  stats.xp = totalXp; 
  
  // 2. O nível continua sendo baseado no valor inteiro
  stats.level = getLevelFromXp(Math.floor(totalXp));

  // Títulos de Carreira
  let title = "Recruta";
  if (stats.level >= 5) title = "Soldado";
  if (stats.level >= 15) title = "Veterano";
  if (stats.level >= 30) title = "Operador Tático";
  if (stats.level >= 50) title = "Ciborgue";
  if (stats.level >= 100) title = "Lenda do SOLO";
  stats.title = title;

  // 3. Matemática da Barra de Progresso (Fórmula Exponencial)
  // XP necessário para o nível atual e para o próximo
  const currentLevelThreshold = Math.pow(stats.level - 1, 2) * STAT_LEVEL_DIVISOR;
  const nextLevelThreshold = Math.pow(stats.level, 2) * STAT_LEVEL_DIVISOR;
  
  // XP que o usuário já acumulou DENTRO do nível atual
  const xpInCurrentLevel = stats.xp - currentLevelThreshold;
  const xpRequiredForNextLevel = nextLevelThreshold - currentLevelThreshold;

  // Cálculo da porcentagem (0 a 100)
  const progressPercent = (xpInCurrentLevel / xpRequiredForNextLevel) * 100;
  
  stats.nextLevelProgress = Math.min(100, Math.max(0, progressPercent));
  
  // XP restante (arredondado para o display)
  stats.xpRemaining = Math.ceil(nextLevelThreshold - stats.xp);
  
  return stats;
};

// --- 4. ESTILO DA OFENSIVA ---
export const getFlameStyle = (streak) => {
    if (streak >= 30) return { color: "text-cyan-500", shadow: "shadow-[0_0_20px_rgba(34,211,238,0.4)] border-cyan-500/50 bg-cyan-500/10", iconClass: "fill-cyan-500 animate-pulse" };
    if (streak >= 7) return { color: "text-red-500", shadow: "shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/50 bg-red-500/10", iconClass: "fill-red-500 animate-pulse" };
    if (streak > 0) return { color: "text-orange-500", shadow: "shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-500/50 bg-orange-500/10", iconClass: "fill-orange-500 animate-pulse" };
    return { color: "text-muted", shadow: "border-border bg-card/50", iconClass: "text-muted" };
};

// --- 5. CÁLCULO DE OFENSIVA (Com Tolerância de 3 Dias) ---
export const calculateStreak = (history) => {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const uniqueDates = [...new Set(history.map((entry) => entry?.dateKey).filter(Boolean))]
    .sort((left, right) => right.localeCompare(left));
  if (uniqueDates.length === 0) return 0;
  const toleranceDays = 3; 
  if (daysBetweenLocalDates(uniqueDates[0], getLocalDateKey()) > toleranceDays) {
    return 0;
  }
  let currentStreak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const diffInDays = daysBetweenLocalDates(uniqueDates[i + 1], uniqueDates[i]);
    if (diffInDays <= toleranceDays) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
};
