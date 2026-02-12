// Definição das regras de cada missão baseada no ID
const QUEST_RULES = {
  // Exemplo: Mover 10.000kg no total
  'heavy_lifter': (sessionData) => sessionData.totalVolume >= 10000,
  
  // Exemplo: Completar todos os exercícios sem pular nenhum
  'perfect_focus': (sessionData) => {
     return sessionData.totalSets > 0 && sessionData.completedSets === sessionData.totalSets;
  },

  // Exemplo: Treino em menos de 60min (requer timer)
  'speedrun': (sessionData) => sessionData.duration > 0 && sessionData.duration < 3600 && sessionData.finished
};