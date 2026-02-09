// src/utils/gameLogic.js

const DIFFICULTY_FACTOR = 0.02; // Dificuldade: 0.02 (Difícil)

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

// src/utils/gameLogic.js

// ... (Mantenha os imports e funções de XP/Nível iguais) ...

export const BADGES_LIST = [
  // --- NÍVEL 1: INICIANTE ---
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
    desc: 'Treinou antes das 7:00 da manhã.', 
    icon: 'Sun', // Precisa importar Sun do lucide-react
    condition: (history) => history.some(s => {
       // Assume que a data tem horário ou usa o horário atual se for salvar agora. 
       // Se seu histórico não tem hora, essa badge só vai funcionar para novos treinos com timestamp.
       // Por enquanto, vamos deixar como placeholder ou baseada em "nome do treino" se tiver.
       return false; // Desativada até termos horário no histórico
    }) 
  },
  
  // --- NÍVEL 2: CONSISTÊNCIA ---
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
    desc: 'Completou 50 treinos. O sistema reconhece sua dedicação.', 
    icon: 'Medal',
    condition: (history) => history.length >= 50 
  },
  { 
    id: 'consistency_3', 
    title: 'LENDÁRIO', 
    desc: '100 Treinos. Você é uma máquina.', 
    icon: 'Crown', // Importar Crown
    condition: (history) => history.length >= 100 
  },

  // --- NÍVEL 3: CARGA & VOLUME (A GRANDEZA) ---
  { 
    id: 'heavy_lifter_1', 
    title: 'GUINDASTE', 
    desc: 'Moveu 10 Toneladas (Volume) em um único treino.', 
    icon: 'Dumbbell',
    condition: (history) => history.some(session => {
        if (!session.exercises) return false;
        const totalVol = session.exercises.reduce((acc, ex) => {
           return acc + ex.sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
        }, 0);
        return totalVol >= 10000;
    })
  },
  { 
    id: 'heavy_lifter_2', 
    title: 'EMPILHADEIRA', 
    desc: 'Moveu 20 Toneladas em um único treino.', 
    icon: 'Truck', // Importar Truck
    condition: (history) => history.some(session => {
        if (!session.exercises) return false;
        const totalVol = session.exercises.reduce((acc, ex) => {
           return acc + ex.sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
        }, 0);
        return totalVol >= 20000;
    })
  },
  {
    id: 'leg_day_survivor',
    title: 'CADEIRANTE',
    desc: 'Sobreviveu a um treino de pernas com mais de 15 Toneladas.',
    icon: 'Accessibility', // Importar Accessibility
    condition: (history) => history.some(session => {
        // Verifica se o treino tem exercícios de perna E volume alto
        if (!session.exercises) return false;
        const isLegDay = session.day?.includes('PERNA') || session.day?.includes('INFERIOR') || session.exercises.some(e => e.name.toLowerCase().includes('agachamento') || e.name.toLowerCase().includes('leg'));
        
        if (!isLegDay) return false;

        const totalVol = session.exercises.reduce((acc, ex) => {
           return acc + ex.sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
        }, 0);
        return totalVol >= 15000;
    })
  },

  // --- NÍVEL 4: XP HUNTER ---
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
    icon: 'Flame', // Importar Flame
    condition: (history) => calculateTotalXP(history) >= 500000
  }
];

// ... (Função getUnlockedBadges continua igual) ...
// --- FUNÇÕES AUXILIARES ---

// Calcula Volume de UMA sessão (Peso * Reps de tudo)
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