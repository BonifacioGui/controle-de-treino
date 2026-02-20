// src/utils/workoutUtils.js

// --- FORMATADORES DE TEXTO E NÚMEROS ---

export const cleanString = (str) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 
};

export const safeParseFloat = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(',', '.')) || 0;
};

// --- CALCULADORAS DE PERFORMANCE ---

export const calculate1RM = (weight, reps) => {
  const w = safeParseFloat(weight);
  const r = safeParseFloat(reps);
  if (!w || !r || r === 0) return null;
  return Math.round(w * (1 + r / 30)); // Fórmula de Epley padrão ouro
};

export const getSmartSuggestion = (exerciseName, lastWeight) => {
  if (!lastWeight || lastWeight === 0) return null;
  const name = cleanString(exerciseName);
  const isCompound = /agachamento|leg|supino|terra|remada|desenvolvimento/i.test(name);
  const increment = isCompound ? 5 : 2;
  return Math.round(lastWeight + increment);
};

// --- CÉREBRO DO HISTÓRICO (Otimização de Busca) ---

export const isSameExercise = (currentName, historyName) => {
  const currentKey = cleanString(currentName);
  const historyKey = cleanString(historyName);
  
  if (currentKey === historyKey) return true;

  const synonyms = {
    "desenvolvimento": ["desenv", "arnold", "militar", "ompro"],
    "supinoreto": ["supino", "plano", "barrapreto"],
    "supinoinclinado": ["inclinado"],
    "elevacaolateral": ["lateral"],
    "tricepscorda": ["corda", "triceppolia"],
    "tricepsfrances": ["frances"],
    "tricepstesta": ["testa"],
    "roscadireta": ["barraw", "direta"],
    "roscamartelo": ["martelo"],
    "rosca45": ["rosca45", "inclinada"],
    "remadabaixa": ["triangulo", "polia", "baixa"],
    "serrote": ["unilateral", "serrote"],
    "puxada": ["puxada", "pulldown", "frontal"],
    "crucifixoinverso": ["voadorinverso", "crucifixoinv"],
    "crossover": ["cross", "polia"],
    "legpress": ["leg", "leg45", "press"],
    "agachamentohack": ["hack"],
    "elevacaopelvica": ["pelvica", "quadril"],
    "extensora": ["extensora"],
    "flexora": ["flexora"],
    "stiff": ["stiff", "rdl"],
    "abdutora": ["abdu"],
    "adutora": ["adut"],
    "panturrilha": ["panturrilha", "gemeos"],
    "vacuum": ["vacuo", "vacuum"]
  };

  // Verifica se o nome atual ou o nome do histórico pertence a algum grupo de sinônimos
  for (const group in synonyms) {
    const isCurrentInGroup = currentKey.includes(group) || synonyms[group].some(s => currentKey.includes(s));
    const isHistoryInGroup = historyKey.includes(group) || synonyms[group].some(s => historyKey.includes(s));
    
    if (isCurrentInGroup && isHistoryInGroup) return true;
  }

  return historyKey.includes(currentKey) || currentKey.includes(historyKey);
};

// --- UTILITÁRIOS GERAIS DE TEMPO E DATA (Para o WorkoutView não quebrar) ---

export const formatTime = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const parseDateTimestamp = (dateString) => {
  if (!dateString) return new Date().getTime();
  const parsed = new Date(dateString).getTime();
  return isNaN(parsed) ? new Date().getTime() : parsed;
};