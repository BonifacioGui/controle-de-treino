// src/utils/rpgSystem.js

import { Dumbbell, Scroll, Trophy, Zap, Clock, Flame, Target } from 'lucide-react';

// --- 1. ATRIBUTOS (Mantido) ---
const EXERCISE_STATS = {
  'Supino Reto': 'STR', 'Supino Inclinado': 'STR', 'Desenvolvimento': 'STR',
  'Agachamento Hack': 'STR', 'Leg Press': 'STR', 'Remada Baixa': 'STR',
  'Levantamento Terra': 'STR', 'Crossover': 'DEX', 'Crucifixo Inverso': 'DEX',
  'Stiff': 'DEX', 'Afundo': 'DEX', 'Serrote': 'DEX', 'Face Pull': 'DEX',
  'Remada Curvada': 'DEX', 'Cadeira Extensora': 'VIT', 'Mesa Flexora': 'VIT',
  'Cadeira Abdutora': 'VIT', 'Panturrilha': 'VIT', 'Prancha': 'VIT',
  'Vacuum': 'VIT', 'Abdominal Infra': 'VIT', 'Caminhada': 'VIT', 'Esteira': 'VIT',
  'Elevação Lateral': 'CHA', 'Tríceps Francês': 'CHA', 'Tríceps Corda': 'CHA',
  'Tríceps Testa': 'CHA', 'Tríceps Pulley': 'CHA', 'Rosca Direta': 'CHA',
  'Rosca Martelo': 'CHA', 'Rosca Alternada': 'CHA', 'Rosca 45º': 'CHA', 'Elevação Pélvica': 'CHA'
};

// --- 2. MISSÕES (CORRIGIDAS) ---
export const DAILY_QUESTS_POOL = [
  { id: 'vol_beginner', title: 'Aquecimento Pesado', desc: 'Mova 5.000kg totais.', reward: 200, check: (s) => calculateSessionVolume(s) >= 5000 },
  { id: 'vol_intermediate', title: 'Caminhão de Mudança', desc: 'Acumule 15.000kg totais.', reward: 450, check: (s) => calculateSessionVolume(s) >= 15000 },
  { id: 'vol_pro', title: 'Hércules', desc: 'Mova 25.000kg totais.', reward: 800, check: (s) => calculateSessionVolume(s) >= 25000 },
  { id: 'reps_100', title: 'Centenário', desc: 'Faça 100+ repetições.', reward: 150, check: (s) => calculateTotalReps(s) >= 100 },
  { id: 'reps_200', title: 'Maratonista', desc: 'Faça 200+ repetições.', reward: 400, check: (s) => calculateTotalReps(s) >= 200 },
  
  // 🔥 CORREÇÃO: Adicionado "e.done" nas missões de foco abaixo 🔥
  { 
    id: 'focus_chest', 
    title: 'Peito de Aço', 
    desc: '8+ séries de empurrar.', 
    reward: 300, 
    check: (s) => s.exercises.filter(e => e.done && /supino|crucifixo|crossover|desenvolvimento/i.test(e.name)).reduce((acc, e) => acc + (e.sets.length || 0), 0) >= 8 
  },
  { 
    id: 'focus_legs', 
    title: 'Não pule o Leg Day', 
    desc: 'Treino de Pernas.', 
    reward: 500, 
    check: (s) => s.exercises.some(e => e.done && /agachamento|leg|extensora|flexora/i.test(e.name)) 
  },
  { 
    id: 'focus_arms', 
    title: 'Esmaga que Cresce', 
    desc: '4+ exercícios de braço.', 
    reward: 250, 
    check: (s) => s.exercises.filter(e => e.done && /rosca|tríceps|triceps/i.test(e.name)).length >= 4 
  },
  { 
    id: 'focus_abs', 
    title: 'Tanque de Guerra', 
    desc: 'Exercícios de Core.', 
    reward: 300, 
    check: (s) => s.exercises.some(e => e.done && /prancha|abdominal|vacuum/i.test(e.name)) 
  },

  { id: 'meta_clean', title: 'Perfeccionista', desc: 'Complete tudo hoje.', reward: 600, check: (s) => s.exercises.length > 0 && s.exercises.every(ex => ex.done === true) },
  { id: 'meta_insane', title: 'God Mode', desc: '20ton + 150 Reps.', reward: 1500, check: (s) => calculateSessionVolume(s) >= 20000 && calculateTotalReps(s) >= 150 },
  // 🔥 CORREÇÃO: Agora exige que o volume do treino seja maior que ZERO antes de olhar a hora 🔥
  { 
    id: 'time_early', 
    title: 'Clube das 5', 
    desc: 'Treine antes das 12h.', 
    reward: 300, 
    check: (s) => calculateSessionVolume(s) > 0 && new Date().getHours() < 12 
  },
  { 
    id: 'time_night', 
    title: 'Morcego', 
    desc: 'Treine após as 19h.', 
    reward: 300, 
    check: (s) => calculateSessionVolume(s) > 0 && new Date().getHours() >= 19 
  }
];

// --- 3. LÓGICA DE SORTEIO COM SEMENTE (LOCAL TIME FIX) ---

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

export const getDailyQuests = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const todayStr = `${year}-${month}-${day}`;
    const seed = parseInt(`${year}${month}${day}`); 
    
    const randomFunc = mulberry32(seed);

    const shuffled = [...DAILY_QUESTS_POOL];
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

// --- 4. CÁLCULOS AUXILIARES ---

const calculateSessionVolume = (session) => {
    if (!session || !session.exercises) return 0;
    return session.exercises.reduce((acc, ex) => {
       if (!ex.sets || !Array.isArray(ex.sets)) return acc;
       return acc + ex.sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
    }, 0);
};

const calculateTotalReps = (session) => {
    if (!session || !session.exercises) return 0;
    return session.exercises.reduce((acc, ex) => {
       if (!ex.sets || !Array.isArray(ex.sets)) return acc;
       return acc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.reps||0), 0);
    }, 0);
};

export const calculateStats = (history) => {
  const stats = {
    STR: { xp: 0, level: 1, label: "FORÇA" },
    DEX: { xp: 0, level: 1, label: "TÉCNICA" },
    VIT: { xp: 0, level: 1, label: "RESISTÊNCIA" },
    CHA: { xp: 0, level: 1, label: "ESTÉTICA" }
  };
  if (!history || !Array.isArray(history)) return stats;
  history.forEach(session => {
    if (!session.exercises) return;
    session.exercises.forEach(ex => {
      if (!ex.sets || !Array.isArray(ex.sets)) return;
      const vol = ex.sets.reduce((acc, s) => acc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
      const statType = EXERCISE_STATS[ex.name] || 'STR';
      stats[statType].xp += (vol * 0.05); 
    });
  });
  Object.keys(stats).forEach(key => {
    stats[key].level = Math.floor(Math.sqrt(stats[key].xp / 100)) + 1;
  });
  return stats;
};