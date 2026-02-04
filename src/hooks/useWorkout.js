import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { initialWorkoutData } from '../workoutData';

export const useWorkout = () => {
  // --- ESTADOS BÁSICOS ---
  const [activeDay, setActiveDay] = useState(() => Object.keys(initialWorkoutData)[0]);
  const [sessionNote, setSessionNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [showMeme, setShowMeme] = useState(false);
  const [view, setView] = useState('import');
  
  // Estado do Timer de Descanso (RestTimer)
  const [timerState, setTimerState] = useState({ active: false, seconds: 90 });

  // 🔥 NOVO: Estado do Cronômetro de Treino (Stopwatch)
  const [workoutTimer, setWorkoutTimer] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_stopwatch');
      if (saved) {
         const parsed = JSON.parse(saved);
         if (parsed.isRunning) {
            const now = Date.now();
            const realElapsed = Math.floor((now - parsed.startTime) / 1000);
            return { ...parsed, elapsed: realElapsed };
         }
         return parsed;
      }
      return { isRunning: false, startTime: null, elapsed: 0 };
    } catch { return { isRunning: false, startTime: null, elapsed: 0 }; }
  });

  // Estados de Dados (Cache)
  const [workoutData, setWorkoutData] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_plan');
      return saved ? JSON.parse(saved) : initialWorkoutData;
    } catch { return initialWorkoutData; }
  });

  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_progress');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [bodyHistory, setBodyHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('body_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // --- 🔥 NOVO: CÁLCULO DE STREAK (OFENSIVA) ---
  const streak = useMemo(() => {
    if (!history || history.length === 0) return 0;
    
    // Normaliza datas
    const uniqueDates = [...new Set(history.map(h => {
        if (h.date.includes('/')) return h.date.split('/').reverse().join('-');
        return h.date; 
    }))].sort().reverse();
    
    if (uniqueDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Se não treinou hoje nem ontem, quebrou
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let currentStreak = 1;
    let lastDate = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
        const thisDate = new Date(uniqueDates[i]);
        const diffDays = Math.ceil(Math.abs(lastDate - thisDate) / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) { currentStreak++; lastDate = thisDate; } else { break; }
    }
    return currentStreak;
  }, [history]);

  // --- 🔥 NOVO: GERENCIADOR DE SONS ---
  const playSound = useCallback((type) => {
    let url = '';
    let volume = 0.5;
    switch(type) {
        case 'click': url = 'https://www.myinstants.com/media/sounds/mech-keyboard-01.mp3'; volume = 0.3; break;
        case 'success': url = 'https://www.myinstants.com/media/sounds/level-up-bonus-sequence-2-186891.mp3'; volume = 0.4; break;
        case 'start': url = 'https://www.myinstants.com/media/sounds/interface-124464.mp3'; break;
        default: return;
    }
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {});
  }, []);

  // --- PERSISTÊNCIA ---
  useEffect(() => {
    localStorage.setItem('workout_plan', JSON.stringify(workoutData));
    localStorage.setItem('daily_progress', JSON.stringify(progress));
    localStorage.setItem('workout_history', JSON.stringify(history));
    localStorage.setItem('body_history', JSON.stringify(bodyHistory));
    localStorage.setItem('workout_stopwatch', JSON.stringify(workoutTimer)); 
  }, [workoutData, progress, history, bodyHistory, workoutTimer]);

  // --- EFEITO DO CRONÔMETRO ---
  useEffect(() => {
    let interval = null;
    if (workoutTimer.isRunning && workoutTimer.startTime) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => ({
          ...prev,
          elapsed: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutTimer.isRunning, workoutTimer.startTime]);

  // --- HELPERS E FETCH ---
  const formatDateSecure = useCallback((dateString) => {
    if (!dateString) return '';
    const cleanDate = dateString.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateString;
  }, []);

  const fetchCloudData = useCallback(async () => {
    try {
      const { data: bodyData } = await supabase.from('body_stats').select('*').order('date', { ascending: false });
      if (bodyData) setBodyHistory(bodyData.map(b => ({ ...b, date: formatDateSecure(b.date) })));
      const { data: trainData } = await supabase.from('workout_history').select('*').order('workout_date', { ascending: false });
      if (trainData) setHistory(trainData.map(t => ({ ...t, id: t.id, date: formatDateSecure(t.workout_date), dayName: t.workout_name })));
    } catch (err) { console.error("Offline:", err); }
  }, [formatDateSecure]);

  useEffect(() => { fetchCloudData(); }, [fetchCloudData]);

  // --- ACTIONS ---
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
    const formattedDate = newDate.split('-').reverse().join('/');
    const entryForDate = bodyHistory.find(h => h.date === formattedDate);
    setWeightInput(entryForDate ? entryForDate.weight : '');
    setWaistInput(entryForDate ? entryForDate.waist : '');
  }, [bodyHistory]);

  const saveBiometrics = useCallback(async (photoBase64 = null) => {
    if (!weightInput && !waistInput && !photoBase64) return;
    const newEntry = { date: selectedDate, weight: weightInput ? parseFloat(weightInput) : null, waist: waistInput ? parseFloat(waistInput) : null };
    if (photoBase64) newEntry.photo = photoBase64; // Suporte a foto (requer coluna no banco ou lógica local)
    
    try { await supabase.from('body_stats').upsert(newEntry, { onConflict: 'date' }); } catch (err) { console.error(err); }
    
    // Atualização otimista
    setBodyHistory(prev => {
        const dateStr = formatDateSecure(selectedDate);
        const existsIndex = prev.findIndex(p => p.date === dateStr);
        const formattedEntry = { ...newEntry, date: dateStr };
        if (existsIndex >= 0) {
            const updated = [...prev];
            updated[existsIndex] = { ...updated[existsIndex], ...formattedEntry };
            return updated;
        }
        return [formattedEntry, ...prev];
    });
  }, [selectedDate, weightInput, waistInput, formatDateSecure]);

  const finishWorkout = useCallback(async () => {
    await saveBiometrics();
    playSound('success');
    
    const safeActiveDay = workoutData[activeDay] ? activeDay : Object.keys(workoutData)[0];
    const finalDurationSeconds = workoutTimer.elapsed;
    const hours = Math.floor(finalDurationSeconds / 3600);
    const minutes = Math.floor((finalDurationSeconds % 3600) / 60);
    const durationString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const sessionBase = {
      workout_date: selectedDate,
      workout_name: safeActiveDay,
      note: sessionNote + (finalDurationSeconds > 0 ? ` | Duração: ${durationString}` : ''), 
      exercises: workoutData[safeActiveDay].exercises.map((ex, i) => {
        const key = `${selectedDate}-${safeActiveDay}-${i}`;
        const p = progress[key];
        const setsToSave = Array.isArray(p?.sets) ? p.sets : [];
        return { name: ex.name, sets: setsToSave, done: p?.done || false };
      })
    };

    let finalSession = { ...sessionBase, id: Date.now(), synced: false, date: formatDateSecure(sessionBase.workout_date), dayName: sessionBase.workout_name }; 

    try {
      const { data, error } = await supabase.from('workout_history').insert([sessionBase]).select();
      if (!error && data) {
        finalSession = { ...finalSession, id: data[0].id, synced: true };
        fetchCloudData();
      } else { throw new Error(error?.message); }
    } catch (err) {
      console.warn("Salvo localmente:", err);
      alert("⚠️ Salvo localmente.");
    }

    setHistory(prev => [finalSession, ...prev]); 
    setProgress({});
    setSessionNote('');
    setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 }); // Reseta Timer
    setShowMeme(true);
    setTimeout(() => { setShowMeme(false); setView('history'); }, 3500);
  }, [saveBiometrics, workoutData, activeDay, selectedDate, sessionNote, progress, formatDateSecure, fetchCloudData, workoutTimer, playSound]);

  // --- FUNCTIONS MEMORIZADAS ---
  const functions = useMemo(() => ({
    updateSessionSets: (id, val) => setProgress(p => ({ ...p, [id]: { ...p[id], actualSets: val } })),
    
    updateSetData: (id, i, f, v) => setProgress(p => {
        const c = p[id] || { sets: [] };
        const n = [...(Array.isArray(c.sets) ? c.sets : [])];
        while (n.length <= i) n.push({ weight: '', reps: '' });
        n[i] = { ...n[i], [f]: v };
        return { ...p, [id]: { ...c, sets: n } };
    }),

    toggleCheck: (id) => {
        playSound('click'); 
        setProgress(currentProgress => {
            const isNowDone = !currentProgress[id]?.done;
            if (isNowDone) setTimerState({ active: true, seconds: 90 }); // Dispara descanso
            return { ...currentProgress, [id]: { ...currentProgress[id], done: isNowDone } };
        });
    },

    closeTimer: () => setTimerState(prev => ({ ...prev, active: false })),

    // 🔥 NOVO: Controles do Cronômetro
    toggleWorkoutTimer: () => {
      playSound('start'); 
      setWorkoutTimer(prev => {
        if (prev.isRunning) {
          return { ...prev, isRunning: false }; // Pausa
        } else {
          // Retoma ou Inicia
          return { isRunning: true, startTime: Date.now() - (prev.elapsed * 1000), elapsed: prev.elapsed };
        }
      });
    },
    
    resetWorkoutTimer: () => {
        if (window.confirm("Zerar o cronômetro do treino?")) {
            setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 });
        }
    },

    deleteEntry: async (id, type) => {
        if (!window.confirm("Eliminar?")) return;
        const table = type === 'body' ? 'body_stats' : 'workout_history';
        if (type === 'body') setBodyHistory(p => p.filter(i => i.id !== id));
        else setHistory(p => p.filter(i => i.id !== id));
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) fetchCloudData();
    },

    updateHistoryEntry: async (id, data) => {
        setHistory(h => h.map(x => x.id === id ? { ...x, ...data } : x));
        await supabase.from('workout_history').update({ note: data.note, exercises: data.exercises }).eq('id', id);
    },

    manageData: {
        add: (day) => setWorkoutData(d => ({ ...d, [day]: { ...d[day], exercises: [...d[day].exercises, { name: "Novo", sets: "3x12", note: "" }] } })),
        remove: (day, i) => setWorkoutData(d => ({ ...d, [day]: { ...d[day], exercises: d[day].exercises.filter((_, idx) => idx !== i) } })),
        edit: (day, i, f, v) => setWorkoutData(d => {
            const n = [...d[day].exercises]; n[i][f] = v;
            return { ...d, [day]: { ...d[day], exercises: n } };
        })
    }
  }), [fetchCloudData, playSound]);

  return useMemo(() => ({
    state: { activeDay, sessionNote, selectedDate, weightInput, waistInput, showMeme, view, workoutData, progress, history, bodyHistory, timerState, workoutTimer },
    setters: { setActiveDay, setSessionNote, setSelectedDate, setWeightInput, setWaistInput, setShowMeme, setView, setWorkoutData },
    actions: { handleDateChange, saveBiometrics, finishWorkout, fetchCloudData, ...functions, closeTimer: functions.closeTimer, toggleWorkoutTimer: functions.toggleWorkoutTimer, resetWorkoutTimer: functions.resetWorkoutTimer },
    stats: { latest: bodyHistory[0] || { weight: '--', waist: '--' }, streak } // 🔥 Streak Exportado
  }), [
    activeDay, sessionNote, selectedDate, weightInput, waistInput, showMeme, view, workoutData, progress, history, bodyHistory, timerState, workoutTimer, streak,
    handleDateChange, saveBiometrics, finishWorkout, fetchCloudData, functions
  ]);
};