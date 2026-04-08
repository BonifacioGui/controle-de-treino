
// Converte a data do seu histórico (DD/MM/YYYY ou ISO) para um objeto Date real
const parseSessionDate = (session) => {
  if (session.created_at) return new Date(session.created_at);
  if (session.date && session.date.includes('/')) {
    const [day, month, year] = session.date.split('/');
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const DIFFICULTY_FACTOR = 0.02; 

export const RANKS = [
  { level: 1, title: "NOOB" },
  { level: 5, title: "PILATES" },
  { level: 10, title: "SABOR TREINO" },
  { level: 20, title: "BESTA ENJAULADA" },
  { level: 35, title: "MONSTRO" },
  { level: 50, title: "TOJI" },
  { level: 75, title: "GOD OF WAR" },
  { level: 100, title: "CRISTIANO RONALDO" }
];

// ============================================================================
// --- FUNÇÕES DE CÁLCULO E LÓGICA CORE ---
// ============================================================================

export const calculateSessionVolume = (session) => {
    if (!session.exercises) return 0;
    return session.exercises.reduce((acc, ex) => {
       if (!ex.sets) return acc;
       return acc + ex.sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
    }, 0);
};

export const calculateTotalXP = (history) => {
  if (!history || !Array.isArray(history)) return 0;
  return history.reduce((total, session) => total + calculateSessionVolume(session), 0);
};

export const calculateLevel = (xp) => {
  const level = Math.floor(DIFFICULTY_FACTOR * Math.sqrt(xp)) || 1;
  return level;
};

// --- LÓGICA DE STREAK (OFENSIVA BIOLÓGICA) ---
// O usuário pode descansar até 2 dias seguidos sem perder a ofensiva.
// --- LÓGICA DE STREAK (OFENSIVA BIOLÓGICA) ---
// O usuário pode descansar até 2 dias seguidos sem perder a ofensiva.
export const calculateStreak = (history) => {
  if (!history || history.length === 0) return 0;

  // 🔥 CORREÇÃO 1: Usando parseSessionDate no Sort
  const sortedHistory = [...history].sort((a, b) => parseSessionDate(b) - parseSessionDate(a));

  let streak = 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 🔥 CORREÇÃO 2: Usando parseSessionDate para pegar o último treino
  const dataUltimoTreino = parseSessionDate(sortedHistory[0]);
  dataUltimoTreino.setHours(0, 0, 0, 0);

  // Calcula a diferença em dias do último treino até HOJE
  const diasDesdeUltimo = Math.floor((hoje - dataUltimoTreino) / (1000 * 60 * 60 * 24));

  // Se faz mais de 2 dias de descanso (3 dias completos ou mais sem treinar), perdeu o streak
  if (diasDesdeUltimo > 2) {
    return 0; 
  }

  streak = 1; // Já conta o último treino válido

  // Navega para trás no tempo para somar os dias
  for (let i = 0; i < sortedHistory.length - 1; i++) {
    // 🔥 CORREÇÃO 3: Usando parseSessionDate dentro do Loop
    const treinoAtual = parseSessionDate(sortedHistory[i]);
    treinoAtual.setHours(0, 0, 0, 0);
    
    const treinoAnterior = parseSessionDate(sortedHistory[i+1]);
    treinoAnterior.setHours(0, 0, 0, 0);

    const diferencaDias = Math.floor((treinoAtual - treinoAnterior) / (1000 * 60 * 60 * 24));

    if (diferencaDias === 0) {
       continue; 
    } else if (diferencaDias <= 3) { 
       streak++;
    } else {
       break; 
    }
  }

  return streak;
};

// ============================================================================
// --- LISTA DE BADGES (SISTEMA DE CONQUISTAS) ---
// ============================================================================

export const BADGES_LIST = [
  { 
    id: 'first_blood', 
    title: 'PRIMEIRO SANGUE', 
    desc: 'Sincronizou o primeiro treino no sistema.', 
    icon: 'Sword',
    condition: (history) => history.length >= 1 
  },
  
  // --- OFENSIVA (STREAKS INTELIGENTES) ---
  { 
    id: 'streak_fire', 
    title: 'MÁQUINA QUENTE', 
    desc: 'Ofensiva de 5 treinos mantendo a consistência.', 
    icon: 'Flame',
    condition: (history) => calculateStreak(history) >= 5 
  },
  
  // --- CONSISTÊNCIA ---
  { 
    id: 'consistency_1', 
    title: 'DISCIPLINADO', 
    desc: 'Completou 10 treinos no total.', 
    icon: 'CalendarCheck',
    condition: (history) => history.length >= 10 
  },
  { 
    id: 'consistency_2', 
    title: 'VETERANO', 
    desc: 'Completou 50 treinos registrados.', 
    icon: 'Medal',
    condition: (history) => history.length >= 50 
  },
  { 
    id: 'consistency_3', 
    title: 'LENDÁRIO', 
    desc: '100 Treinos. Você é uma máquina.', 
    icon: 'Crown',
    condition: (history) => history.length >= 100 
  },

  // --- VOLUME (PESO TOTAL) ---
  { 
    id: 'heavy_lifter_1', 
    title: 'GUINDASTE', 
    desc: 'Moveu 10 Toneladas em um único treino.', 
    icon: 'Dumbbell',
    condition: (history) => history.some(s => calculateSessionVolume(s) >= 10000)
  },
  { 
    id: 'heavy_lifter_2', 
    title: 'EMPILHADEIRA', 
    desc: 'Moveu 20 Toneladas em um único treino.', 
    icon: 'Truck', 
    condition: (history) => history.some(s => calculateSessionVolume(s) >= 20000)
  },
  {
    id: 'leg_day_survivor',
    title: 'CADEIRANTE',
    desc: 'Treino de pernas pesado (Volume > 12t).',
    icon: 'Accessibility',
    condition: (history) => history.some(session => {
        if (!session.exercises) return false;
        const hasLegExercises = session.exercises.some(e => 
            /leg|agachamento|extensora|flexora|stiff|panturrilha/i.test(e.name)
        );
        return hasLegExercises && calculateSessionVolume(session) >= 12000;
    })
  },

  // --- XP GERAL ---
  { 
    id: 'xp_hunter_1', 
    title: 'CAÇADOR DE XP', 
    desc: 'Acumulou 100.000 XP totais no sistema.', 
    icon: 'Zap',
    condition: (history) => calculateTotalXP(history) >= 100000
  }
];

// ============================================================================
// --- FUNÇÕES DE EXPORTAÇÃO DE DADOS ---
// ============================================================================

export const getRankTitle = (level) => {
  const rank = [...RANKS].reverse().find(r => level >= r.level);
  return rank ? rank.title : "NOOB";
};

export const getNextLevelProgress = (xp, currentLevel) => {
  const currentLevelXP = Math.pow(currentLevel / DIFFICULTY_FACTOR, 2);
  const nextLevelXP = Math.pow((currentLevel + 1) / DIFFICULTY_FACTOR, 2);
  const xpInThisLevel = xp - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const percentage = Math.min(100, Math.max(0, (xpInThisLevel / xpNeededForNext) * 100));
  
  return {
    percentage: percentage.toFixed(1),
    xpMissing: Math.max(0, Math.ceil(nextLevelXP - xp)),
    nextLevelXP: Math.ceil(nextLevelXP)
  };
};

export const getUnlockedBadges = (history) => {
  return BADGES_LIST.map(badge => ({
    ...badge,
    unlocked: badge.condition(history || [])
  }));
};