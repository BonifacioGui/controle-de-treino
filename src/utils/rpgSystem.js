// src/utils/rpgSystem.js

// --- 1. CONFIGURAÇÃO DE ATRIBUTOS ---
// Define qual atributo cada exercício treina
const EXERCISE_STATS = {
  // FORÇA (STR): Compostos e Carga
  'Supino Reto': 'STR',
  'Supino Inclinado': 'STR',
  'Desenvolvimento': 'STR',
  'Agachamento Hack': 'STR',
  'Leg Press': 'STR',
  'Remada Baixa': 'STR',
  'Levantamento Terra': 'STR',

  // AGILIDADE (DEX): Controle e Unilaterais
  'Crossover': 'DEX',
  'Crucifixo Inverso': 'DEX',
  'Stiff': 'DEX',
  'Afundo': 'DEX',
  'Serrote': 'DEX',
  'Face Pull': 'DEX',
  'Remada Curvada': 'DEX',

  // CONSTITUIÇÃO (VIT): Resistência, Core e Pernas (Volume)
  'Cadeira Extensora': 'VIT',
  'Mesa Flexora': 'VIT',
  'Cadeira Abdutora': 'VIT',
  'Panturrilha': 'VIT',
  'Prancha': 'VIT',
  'Vacuum': 'VIT',
  'Abdominal Infra': 'VIT',
  'Caminhada': 'VIT',
  'Esteira': 'VIT',

  // CARISMA (CHA): Braços e Isoladores (O Pump)
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
  // --- TIPO: VOLUME (Carga Total) ---
  { 
    id: 'vol_beginner', 
    title: 'Aquecimento Pesado', 
    desc: 'Mova pelo menos 5.000kg totais hoje.', 
    reward: 200, 
    check: (s) => calculateSessionVolume(s) >= 5000 
  },
  { 
    id: 'vol_intermediate', 
    title: 'Caminhão de Mudança', 
    desc: 'Acumule 15.000kg de volume total no treino.', 
    reward: 450, 
    check: (s) => calculateSessionVolume(s) >= 15000 
  },
  { 
    id: 'vol_pro', 
    title: 'Hércules', 
    desc: 'Mova 25.000kg em uma única sessão.', 
    reward: 800, 
    check: (s) => calculateSessionVolume(s) >= 25000 
  },

  // --- TIPO: REPETIÇÕES (Resistência) ---
  { 
    id: 'reps_100', 
    title: 'Centenário', 
    desc: 'Faça mais de 100 repetições totais.', 
    reward: 150, 
    check: (s) => calculateTotalReps(s) >= 100 
  },
  { 
    id: 'reps_200', 
    title: 'Maratonista', 
    desc: 'Faça mais de 200 repetições totais.', 
    reward: 400, 
    check: (s) => calculateTotalReps(s) >= 200 
  },

  // --- TIPO: FOCO (Grupos Musculares) ---
  { 
    id: 'focus_chest', 
    title: 'Peito de Aço', 
    desc: 'Realize pelo menos 8 séries de exercícios de empurrar (Supino/Crucifixo).', 
    reward: 300, 
    check: (s) => s.exercises.filter(e => /supino|crucifixo|crossover|desenvolvimento/i.test(e.name)).reduce((acc, e) => acc + (e.sets.length || 0), 0) >= 8
  },
  { 
    id: 'focus_legs', 
    title: 'Não pule o Leg Day', 
    desc: 'Realize um treino com foco em Pernas (Agachamento, Leg, Extensora).', 
    reward: 500, 
    check: (s) => s.exercises.some(e => /agachamento|leg|extensora|flexora/i.test(e.name))
  },
  { 
    id: 'focus_arms', 
    title: 'Esmaga que Cresce', 
    desc: 'Faça pelo menos 4 exercícios de braço (Bíceps/Tríceps).', 
    reward: 250, 
    check: (s) => s.exercises.filter(e => /rosca|tríceps|triceps/i.test(e.name)).length >= 4
  },
  {
    id: 'focus_abs',
    title: 'Tanque de Guerra',
    desc: 'Complete exercícios de Core (Prancha, Abdominal ou Vacuum).',
    reward: 300,
    check: (s) => s.exercises.some(e => /prancha|abdominal|vacuum/i.test(e.name))
  },

  // --- TIPO: HARDCORE / META ---
  { 
    id: 'meta_clean', 
    title: 'Perfeccionista', 
    desc: 'Complete TODOS os exercícios planejados do dia.', 
    reward: 600, 
    check: (s) => s.exercises.length > 0 && s.exercises.every(ex => ex.done === true)
  },
  { 
    id: 'meta_insane', 
    title: 'God Mode', 
    desc: 'Volume > 20ton E +150 Repetições no mesmo treino.', 
    reward: 1500, 
    check: (s) => calculateSessionVolume(s) >= 20000 && calculateTotalReps(s) >= 150
  },
  
  // --- TIPO: HORÁRIO ---
  {
    id: 'time_early',
    title: 'Clube das 5',
    desc: 'Treine pela manhã (antes do meio-dia).',
    reward: 300,
    check: (s) => new Date().getHours() < 12
  },
  {
    id: 'time_night',
    title: 'Morcego',
    desc: 'Treine à noite (após as 19h).',
    reward: 300,
    check: (s) => new Date().getHours() >= 19
  }
];

// --- 3. FUNÇÕES AUXILIARES E LÓGICA ---

// Calcula Volume de UMA sessão (Peso * Reps de tudo)
const calculateSessionVolume = (session) => {
    if (!session || !session.exercises) return 0;
    return session.exercises.reduce((acc, ex) => {
       if (!ex.sets || !Array.isArray(ex.sets)) return acc;
       return acc + ex.sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
    }, 0);
};

// Calcula Total de Repetições
const calculateTotalReps = (session) => {
    if (!session || !session.exercises) return 0;
    return session.exercises.reduce((acc, ex) => {
       if (!ex.sets || !Array.isArray(ex.sets)) return acc;
       return acc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.reps||0), 0);
    }, 0);
};

// Sorteia 3 missões aleatórias
export const getDailyQuests = () => {
    const shuffled = [...DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
};

// Calcula os atributos (STR, DEX, VIT, CHA) baseados no histórico
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
      // Validação de segurança
      if (!ex.sets || !Array.isArray(ex.sets)) return;
      
      const vol = ex.sets.reduce((acc, s) => acc + (parseFloat(s.weight||0) * parseFloat(s.reps||0)), 0);
      
      // Descobre qual atributo o exercício treina (Default: STR se não achar)
      const statType = EXERCISE_STATS[ex.name] || 'STR';
      
      // Fator de XP: 0.05 XP por Kg movido
      stats[statType].xp += (vol * 0.05); 
    });
  });

  // Calcula Nível de cada atributo (Curva Logarítmica Suave)
  // Nível = Raiz Quadrada do (XP / 100)
  Object.keys(stats).forEach(key => {
    stats[key].level = Math.floor(Math.sqrt(stats[key].xp / 100)) + 1;
  });

  return stats;
};