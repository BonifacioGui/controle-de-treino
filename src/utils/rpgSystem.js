// src/utils/rpgSystem.js

import { Dumbbell, Scroll, Trophy, Zap, Clock, Flame, Target } from 'lucide-react';

// --- 1. CONFIGURAÇÃO DE ATRIBUTOS ---
const EXERCISE_STATS = {
  'Supino Reto': 'STR',
  'Supino Inclinado': 'STR',
  'Desenvolvimento': 'STR',
  'Agachamento Hack': 'STR',
  'Leg Press': 'STR',
  'Remada Baixa': 'STR',
  'Levantamento Terra': 'STR',
  'Crossover': 'DEX',
  'Crucifixo Inverso': 'DEX',
  'Stiff': 'DEX',
  'Afundo': 'DEX',
  'Serrote': 'DEX',
  'Face Pull': 'DEX',
  'Remada Curvada': 'DEX',
  'Cadeira Extensora': 'VIT',
  'Mesa Flexora': 'VIT',
  'Cadeira Abdutora': 'VIT',
  'Panturrilha': 'VIT',
  'Prancha': 'VIT',
  'Vacuum': 'VIT',
  'Abdominal Infra': 'VIT',
  'Caminhada': 'VIT',
  'Esteira': 'VIT',
  'Elevação Lateral': 'CHA',
  'Tríceps Francês': 'CHA',
  'Tríceps Corda': 'CHA',
  'Tríceps Testa': 'CHA',
  'Tríceps Pulley': 'CHA',
  'Rosca Direta': 'CHA',
  'Rosca Martelo': 'CHA',
  'Rosca Alternada': 'CHA',
  'Rosca 45º': 'CHA',
  'Elevação Pélvica': 'CHA'
};

// --- 2. POOL DE MISSÕES (DAILY QUESTS) ---
export const DAILY_QUESTS_POOL = [
  { id: 'vol_beginner', title: 'Aquecimento Pesado', desc: 'Mova pelo menos 5.000kg totais hoje.', reward: 200, check: (s) => calculateSessionVolume(s) >= 5000 },
  { id: 'vol_intermediate', title: 'Caminhão de Mudança', desc: 'Acumule 15.000kg de volume total.', reward: 450, check: (s) => calculateSessionVolume(s) >= 15000 },
  { id: 'vol_pro', title: 'Hércules', desc: 'Mova 25.000kg em uma única sessão.', reward: 800, check: (s) => calculateSessionVolume(s) >= 25000 },
  { id: 'reps_100', title: 'Centenário', desc: 'Faça mais de 100 repetições totais.', reward: 150, check: (s) => calculateTotalReps(s) >= 100 },
  { id: 'reps_200', title: 'Maratonista', desc: 'Faça mais de 200 repetições totais.', reward: 400, check: (s) => calculateTotalReps(s) >= 200 },
  { id: 'focus_chest', title: 'Peito de Aço', desc: 'Realize 8+ séries de empurrar.', reward: 300, check: (s) => s.exercises.filter(e => /supino|crucifixo|crossover|desenvolvimento/i.test(e.name)).reduce((acc, e) => acc + (e.sets.length || 0), 0) >= 8 },
  { id: 'focus_legs', title: 'Não pule o Leg Day', desc: 'Realize um treino com foco em Pernas.', reward: 500, check: (s) => s.exercises.some(e => /agachamento|leg|extensora|flexora/i.test(e.name)) },
  { id: 'focus_arms', title: 'Esmaga que Cresce', desc: 'Faça pelo menos 4 exercícios de braço.', reward: 250, check: (s) => s.exercises.filter(e => /rosca|tríceps|triceps/i.test(e.name)).length >= 4 },
  { id: 'focus_abs', title: 'Tanque de Guerra', desc: 'Complete exercícios de Core.', reward: 300, check: (s) => s.exercises.some(e => /prancha|abdominal|vacuum/i.test(e.name)) },
  { id: 'meta_clean', title: 'Perfeccionista', desc: 'Complete TODOS os exercícios do dia.', reward: 600, check: (s) => s.exercises.length > 0 && s.exercises.every(ex => ex.done === true) },
  { id: 'meta_insane', title: 'God Mode', desc: 'Volume > 20ton E +150 Repetições.', reward: 1500, check: (s) => calculateSessionVolume(s) >= 20000 && calculateTotalReps(s) >= 150 },
  { id: 'time_early', title: 'Clube das 5', desc: 'Treine pela manhã (antes das 12h).', reward: 300, check: (s) => new Date().getHours() < 12 },
  { id: 'time_night', title: 'Morcego', desc: 'Treine à noite (após as 19h).', reward: 300, check: (s) => new Date().getHours() >= 19 }
];

// --- 3. LÓGICA DE SORTEIO DETERMINÍSTICO (SEED) ---

// Função matemática que gera números "aleatórios" previsíveis baseados em uma semente
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// Sorteia 3 missões baseadas na data atual (Sincronizado entre dispositivos)
export const getDailyQuests = () => {
    const today = new Date().toISOString().split('T')[0]; // Ex: "2026-02-12"
    const seed = parseInt(today.replace(/-/g, '')); // Transforma em número: 20260212
    const randomFunc = mulberry32(seed);

    // Criamos uma cópia do pool e embaralhamos usando a função previsível
    const shuffled = [...DAILY_QUESTS_POOL];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(randomFunc() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 3).map(q => ({
        ...q,
        completed: false,
        dateGenerated: today
    }));
};

// --- 4. FUNÇÕES AUXILIARES DE CÁLCULO ---

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
    STR: { xp: 0, level: 1, label: "FORÇA (Power)" },
    DEX: { xp: 0, level: 1, label: "TÉCNICA (Control)" },
    VIT: { xp: 0, level: 1, label: "RESISTÊNCIA (Stamina)" },
    CHA: { xp: 0, level: 1, label: "ESTÉTICA (Pump)" }
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