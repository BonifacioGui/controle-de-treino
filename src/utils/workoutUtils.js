// src/utils/workoutUtils.js
import { getCanonicalName } from './exerciseParser';
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
  if (!currentName || !historyName) return false;

  // Em vez de "chutar" com includes, comparamos os nomes canônicos oficiais
  const currentKey = getCanonicalName(currentName);
  const historyKey = getCanonicalName(historyName);
  
  return currentKey === historyKey;
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

// Calcula o 1RM Ajustado pelo RPE (Reps in Reserve)
export const calculateTrue1RM = (weight, reps, rpe) => {
  const w = parseFloat(weight);
  const r = parseInt(reps);
  const effort = parseFloat(rpe);

  if (!w || !r || w <= 0 || r <= 0) return null;

  // Se não tem RPE preenchido, usa a fórmula padrão (Epley)
  if (!effort || effort < 1 || effort > 10) {
    return Math.round(w * (1 + r / 30));
  }

  // Se tem RPE, calculamos quantas repetições sobraram no tanque (RIR)
  // RPE 10 = 0 sobrando. RPE 8 = 2 sobrando.
  const rir = 10 - effort;
  
  // As repetições "teóricas" que você faria se fosse até a falha
  const theoreticalReps = r + rir;

  // Calcula o 1RM com o potencial máximo daquela série
  return Math.round(w * (1 + theoreticalReps / 30));
};

// Adicione isso ao seu workoutUtils.js
export const parseBrazilianDate = (dateStr) => {
  if (!dateStr) return 0;
  const [day, month, year] = dateStr.split('/');
  // Retorna o timestamp (milissegundos) para comparação numérica direta
  return new Date(year, month - 1, day).getTime();
};