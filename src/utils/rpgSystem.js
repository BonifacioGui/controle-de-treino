// src/utils/rpgSystem.js
import { calculateSessionVolume } from './gameLogic'; // <-- Importando para não duplicar código

// --- CONSTANTES DE BALANCEAMENTO DO JOGO ---
const STAT_XP_MULTIPLIER = 0.05;
const STAT_LEVEL_DIVISOR = 100;

// --- 1. ATRIBUTOS (Blindado contra erros de digitação) ---
// Transformei todas as chaves em minúsculas para facilitar a busca exata
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

// --- 2. MISSÕES DIÁRIAS (Agora com escala de Nível) ---
export const DAILY_QUESTS_POOL = [
  // Volume (Escalado por nível)
  { id: 'vol_beginner', title: 'Aquecimento Pesado', desc: 'Mova 5.000kg totais.', reward: 200, minLevel: 1, maxLevel: 15, check: (s) => calculateSessionVolume(s) >= 5000 },
  { id: 'vol_intermediate', title: 'Caminhão de Mudança', desc: 'Acumule 15.000kg totais.', reward: 450, minLevel: 10, maxLevel: 999, check: (s) => calculateSessionVolume(s) >= 15000 },
  { id: 'vol_pro', title: 'Hércules', desc: 'Mova 25.000kg totais.', reward: 800, minLevel: 25, maxLevel: 999, check: (s) => calculateSessionVolume(s) >= 25000 },
  
  // Repetições
  { id: 'reps_100', title: 'Centenário', desc: 'Faça 100+ repetições.', reward: 150, minLevel: 1, maxLevel: 999, check: (s) => calculateTotalReps(s) >= 100 },
  { id: 'reps_200', title: 'Maratonista', desc: 'Faça 200+ repetições.', reward: 400, minLevel: 15, maxLevel: 999, check: (s) => calculateTotalReps(s) >= 200 },
  
  // Foco (Disponível para todos)
  { id: 'focus_chest', title: 'Peito de Aço', desc: '8+ séries de empurrar.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.filter(e => e.done && /supino|crucifixo|crossover|desenvolvimento/i.test(e.name)).reduce((acc, e) => acc + (e.sets.length || 0), 0) >= 8 },
  { id: 'focus_legs', title: 'Não pule o Leg Day', desc: 'Treino de Pernas.', reward: 500, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.some(e => e.done && /agachamento|leg|extensora|flexora/i.test(e.name)) },
  { id: 'focus_arms', title: 'Esmaga que Cresce', desc: '4+ exercícios de braço.', reward: 250, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.filter(e => e.done && /rosca|tríceps|triceps/i.test(e.name)).length >= 4 },
  { id: 'focus_abs', title: 'Tanque de Guerra', desc: 'Exercícios de Core.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.some(e => e.done && /prancha|abdominal|vacuum/i.test(e.name)) },

  // Desafios Especiais
  { id: 'meta_clean', title: 'Perfeccionista', desc: 'Complete tudo hoje.', reward: 600, minLevel: 1, maxLevel: 999, check: (s) => s.exercises.length > 0 && s.exercises.every(ex => ex.done === true) },
  { id: 'meta_insane', title: 'God Mode', desc: '20ton + 150 Reps.', reward: 1500, minLevel: 30, maxLevel: 999, check: (s) => calculateSessionVolume(s) >= 20000 && calculateTotalReps(s) >= 150 },
  
  // Horários
  { id: 'time_early', title: 'Clube das 5', desc: 'Treine antes das 12h.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => calculateSessionVolume(s) > 0 && new Date().getHours() < 12 },
  { id: 'time_night', title: 'Morcego', desc: 'Treine após as 19h.', reward: 300, minLevel: 1, maxLevel: 999, check: (s) => calculateSessionVolume(s) > 0 && new Date().getHours() >= 19 }
];

// --- 3. LÓGICA DE SORTEIO COM SEMENTE ---
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// O SORTEIO AGORA RECEBE O NÍVEL DO USUÁRIO
export const getDailyQuests = (userLevel = 1) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const todayStr = `${year}-${month}-${day}`;
    const seed = parseInt(`${year}${month}${day}`); 
    const randomFunc = mulberry32(seed);

    // Filtra apenas as missões compatíveis com o nível do soldado
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

// --- 4. CÁLCULOS AUXILIARES LOCAIS ---
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
      if (!ex.sets || !Array.isArray(ex.sets) || !ex.name) return;
      
      const vol = ex.sets.reduce((acc, s) => acc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
      
      // BLINDAGEM: Normaliza o nome do exercício (minúsculo e sem espaços extras) para achar no dicionário
      const normalizedName = ex.name.trim().toLowerCase();
      
      // Se não achar o exercício exato, joga o XP para Força por padrão
      const statType = EXERCISE_STATS[normalizedName] || 'STR';
      
      stats[statType].xp += (vol * STAT_XP_MULTIPLIER); 
    });
  });
  
  Object.keys(stats).forEach(key => {
    stats[key].level = Math.floor(Math.sqrt(stats[key].xp / STAT_LEVEL_DIVISOR)) + 1;
  });
  
  return stats;
};