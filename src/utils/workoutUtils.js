// src/utils/workoutUtils.js

// 1. Limpa strings para comparação (remove acentos e espaços)
export const cleanString = (str) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 
};

// 2. Converte valores para float de forma segura
export const safeParseFloat = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(',', '.')) || 0;
};

// 3. Calcula a estimativa de 1 Repetição Máxima (Fórmula de Brzycki)
export const calculate1RM = (weight, reps) => {
  const w = safeParseFloat(weight);
  const r = safeParseFloat(reps);
  if (!w || !r || r === 0) return null;
  return Math.round(w * (1 + r / 30));
};

// 4. Lógica de progressão de carga inteligente (Composto vs Isolado)
export const getSmartSuggestion = (exerciseName, lastWeight) => {
  if (!lastWeight || lastWeight === 0) return null;
  const name = cleanString(exerciseName);
  const isCompound = /agachamento|leg|supino|terra|remada|desenvolvimento/i.test(name);
  const increment = isCompound ? 5 : 2;
  return Math.round(lastWeight + increment);
};

// 5. Verifica se dois nomes de exercícios se referem ao mesmo movimento
export const isSameExercise = (currentName, historyName) => {
  const currentKey = cleanString(currentName);
  const historyKey = cleanString(historyName);
  if (currentKey === historyKey) return true;
  if (historyKey.includes(currentKey)) return true;
  if (currentKey.includes(historyKey) && historyKey.length > 4) return true; 

  const synonyms = {
    "rosca45": ["incline", "banco", "inclinada", "45"],
    "roscadireta": ["barra", "w", "polia", "biceps", "stand", "direta", "alternada"],
    "crossover": ["poliaalta", "napoliaalta", "alta", "escapulas", "cross"],
    "elevacaopelvica": ["quadril", "pelvica"],
    "serrote": ["remadaunilateral", "unilateral"],
    "legpress": ["legpress45"]
  };

  if (synonyms[currentKey]) return synonyms[currentKey].some(syn => historyKey.includes(syn));
  if (synonyms[historyKey]) return synonyms[historyKey].some(syn => currentKey.includes(syn));
  return false;
};

// 6. Formata segundos em string de tempo (HH:MM:SS) 🔥 IMPORTANTE: O QUE FALTAVA
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// 7. Converte string de data para timestamp para ordenação 🔥 IMPORTANTE: O QUE FALTAVA
export const parseDateTimestamp = (dateStr) => {
  if (!dateStr) return 0;
  try {
      if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
      }
      return new Date(dateStr).getTime();
  } catch (e) { return 0; }
};