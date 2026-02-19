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
  if (historyKey.includes(currentKey)) return true;
  if (currentKey.includes(historyKey) && historyKey.length > 4) return true; 

  // Dicionário de Sinônimos e Variações
  const synonyms = {
    "rosca45": ["incline", "banco", "inclinada", "45"],
    "roscadireta": ["barra", "w", "polia", "biceps", "stand", "direta", "alternada"],
    "crossover": ["poliaalta", "napoliaalta", "alta", "escapulas", "crossoverpoliaalta", "crossovernapoliaalta", "cross"],
    "elevacaopelvica": ["quadril", "pelvica", "elevacao"],
    "cadeiraabdutora": ["abducao", "abdutora"],
    "mesaflexora": ["flexora"],
    "cadeiraextensora": ["extensora"],
    "serrote": ["remadaunilateral", "unilateral"],
    "tricepspulley": ["tricepsnapolia", "tricepscorda", "barrareta", "volume", "polia"],
    "tricepscorda": ["tricepsnapolia", "tricepspulley"],
    "agachamentolivre": ["agachamento"],
    "legpress": ["legpress45", "pesafastados"],
    "abdominalinfra": ["abdominal"],
    "vacuum": ["stomachvacuum"],
    "supinoinclinado": ["supinoinclinado", "controlar", "halter"],
    "crucifixoinverso": ["halter", "postural", "cifose", "substituto"],
    "crucifixo": ["maquina", "peck", "deck", "fly", "reto", "inclinado", "peckdeck", "voador"]
  };

  if (synonyms[currentKey]) return synonyms[currentKey].some(syn => historyKey.includes(syn));
  if (synonyms[historyKey]) return synonyms[historyKey].some(syn => currentKey.includes(syn));
  
  return false;
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