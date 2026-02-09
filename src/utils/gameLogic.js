// src/utils/gameLogic.js

// --- CONFIGURAÇÃO ---
// 0.1 = Fácil (Nível 28 com 80k XP)
// 0.05 = Médio
// 0.02 = Difícil (Nível 5 com 80k XP) <- SEU ATUAL
const DIFFICULTY_FACTOR = 0.02; 

export const RANKS = [
  { level: 1, title: "NOOB" },
  { level: 5, title: "PILATES" },
  { level: 10, title: "SABOR TREINO" },
  { level: 20, title: "BESTA ENJAULADA COM ÓDIO" },
  { level: 35, title: "MONSTRO" },
  { level: 50, title: "TOJI" },
  { level: 75, title: "GOD OF WAR" },
  { level: 100, title: "CRISTIANO RONALDO" }
];

// Calcula o XP total baseado no histórico de treinos
export const calculateTotalXP = (history) => {
  if (!history || !Array.isArray(history)) return 0;

  return history.reduce((total, session) => {
    // Proteção contra sessões vazias
    if (!session.exercises) return total;

    const sessionXP = session.exercises.reduce((acc, ex) => {
      if (!ex.sets) return acc;

      const setXP = ex.sets.reduce((sAcc, set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseFloat(set.reps) || 0;
        // Bônus: Se for peso do corpo (0kg), damos 10XP por repetição
        const load = weight > 0 ? weight : 10; 
        return sAcc + (load * reps);
      }, 0);
      return acc + setXP;
    }, 0);
    return total + sessionXP;
  }, 0);
};

// Calcula o Nível atual baseado no XP (Curva de dificuldade)
export const calculateLevel = (xp) => {
  // Fórmula: Nível = Fator * Raiz(XP)
  const level = Math.floor(DIFFICULTY_FACTOR * Math.sqrt(xp)) || 1;
  return level;
};

// Pega o título atual baseado no nível
export const getRankTitle = (level) => {
  const rank = [...RANKS].reverse().find(r => level >= r.level);
  return rank ? rank.title : "NOOB";
};

// Calcula quanto falta para o próximo nível
export const getNextLevelProgress = (xp, currentLevel) => {
  // Agora usamos a CONSTANTE, então a matemática sempre bate!
  // XP Necessário = (Nível / Fator)²
  
  const currentLevelXP = Math.pow(currentLevel / DIFFICULTY_FACTOR, 2);
  const nextLevelXP = Math.pow((currentLevel + 1) / DIFFICULTY_FACTOR, 2);
  
  const xpInThisLevel = xp - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  
  // Proteção para não passar de 100% ou ficar negativo
  const percentage = Math.min(100, Math.max(0, (xpInThisLevel / xpNeededForNext) * 100));
  
  return {
    percentage: percentage.toFixed(1),
    xpMissing: Math.ceil(nextLevelXP - xp),
    nextLevelXP: Math.ceil(nextLevelXP)
  };
};