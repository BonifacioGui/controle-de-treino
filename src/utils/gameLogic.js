// src/utils/gameLogic.js

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

// --- FUNÇÕES AUXILIARES DE CÁLCULO ---

const calculateSessionVolume = (session) => {
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

// --- LISTA DE BADGES (ATUALIZADA) ---

export const BADGES_LIST = [
  { 
    id: 'first_blood', 
    title: 'PRIMEIRO SANGUE', 
    desc: 'Completou o primeiro treino.', 
    icon: 'Sword',
    condition: (history) => history.length >= 1 
  },
  { 
    id: 'early_bird', 
    title: 'CLUBE DAS 6', 
    desc: 'Treinou no período da madrugada/manhã (até às 08:00).', 
    icon: 'Sun', 
    condition: (history) => history.some(s => {
        // Verifica se existe timestamp ou extrai da data (se você começar a salvar com hora)
        if (!s.created_at) return false;
        const hour = new Date(s.created_at).getHours();
        return hour >= 4 && hour <= 8;
    }) 
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
    desc: 'Completou 50 treinos.', 
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

  // --- PROGRESSÃO DE CARGA (NOVA!) ---
  { 
    id: 'pr_hunter', 
    title: 'ESCAVADOR DE PRs', 
    desc: 'Bateu o seu primeiro recorde pessoal (PR).', 
    icon: 'Trophy',
    condition: (history) => {
        // Lógica: se o volume de um treino foi maior que o anterior do mesmo tipo
        return history.length > 5; // Placeholder simples ou lógica de PR real
    }
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
        // Agora checa pelo nome do treino (A,B,C) ou pelos exercícios contidos
        const hasLegExercises = session.exercises.some(e => 
            /leg|agachamento|extensora|flexora|stiff/i.test(e.name)
        );
        return hasLegExercises && calculateSessionVolume(session) >= 12000;
    })
  },

  // --- XP ---
  { 
    id: 'xp_hunter_1', 
    title: 'CAÇADOR DE XP', 
    desc: 'Acumulou 100.000 XP totais.', 
    icon: 'Zap',
    condition: (history) => calculateTotalXP(history) >= 100000
  },
  { 
    id: 'xp_hunter_2', 
    title: 'PREDADOR', 
    desc: 'Acumulou 500.000 XP totais.', 
    icon: 'Flame', 
    condition: (history) => calculateTotalXP(history) >= 500000
  }
];

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