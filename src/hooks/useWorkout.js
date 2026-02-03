import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { initialWorkoutData } from '../workoutData';

export const useWorkout = () => {
  // --- ESTADOS ---
  const [activeDay, setActiveDay] = useState(() => Object.keys(initialWorkoutData)[0]);
  const [sessionNote, setSessionNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [showMeme, setShowMeme] = useState(false);
  const [view, setView] = useState('import');
  
  // NOVO: Estado do Timer
  const [timerState, setTimerState] = useState({ active: false, seconds: 90 });

  // Estados com Cache
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

  // --- PERSISTÊNCIA ---
  useEffect(() => {
    localStorage.setItem('workout_plan', JSON.stringify(workoutData));
    localStorage.setItem('daily_progress', JSON.stringify(progress));
    localStorage.setItem('workout_history', JSON.stringify(history));
    localStorage.setItem('body_history', JSON.stringify(bodyHistory));
  }, [workoutData, progress, history, bodyHistory]);

  // --- HELPERS ---
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

  // --- CLOUD FETCH ---
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

  const saveBiometrics = useCallback(async () => {
    if (!weightInput && !waistInput) return;
    const newEntry = { date: selectedDate, weight: weightInput ? parseFloat(weightInput) : null, waist: waistInput ? parseFloat(waistInput) : null };
    try { await supabase.from('body_stats').upsert(newEntry, { onConflict: 'date' }); } catch (err) { console.error(err); }
  }, [selectedDate, weightInput, waistInput]);

  const finishWorkout = useCallback(async () => {
    await saveBiometrics();
    const siuuuSound = new Audio('https://www.myinstants.com/media/sounds/cr7-siiii.mp3');
    siuuuSound.volume = 1.0; siuuuSound.play().catch(() => {});
    
    const safeActiveDay = workoutData[activeDay] ? activeDay : Object.keys(workoutData)[0];
    const sessionBase = {
      workout_date: selectedDate,
      workout_name: safeActiveDay,
      note: sessionNote,
      exercises: workoutData[safeActiveDay].exercises.map((ex, i) => {
        const key = `${selectedDate}-${safeActiveDay}-${i}`;
        const p = progress[key];
        return { name: ex.name, sets: p?.sets || [], done: p?.done || false };
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
    setShowMeme(true);
    setTimeout(() => { setShowMeme(false); setView('history'); }, 3500);
  }, [saveBiometrics, workoutData, activeDay, selectedDate, sessionNote, progress, formatDateSecure, fetchCloudData]);

  // --- FUNCTIONS MEMORIZADAS ---
  const functions = useMemo(() => ({
    updateSessionSets: (id, val) => setProgress(p => ({ ...p, [id]: { ...p[id], sets: val } })),
    
    updateSetData: (id, i, f, v) => setProgress(p => {
        const c = p[id] || { sets: [] };
        const n = [...(c.sets || [])];
        while (n.length <= i) n.push({ weight: '', reps: '' });
        n[i] = { ...n[i], [f]: v };
        return { ...p, [id]: { ...c, sets: n } };
    }),

    toggleCheck: (id) => {
        // 1. Som
        const clickSound = new Audio('https://www.myinstants.com/media/sounds/mech-keyboard-01.mp3'); 
        clickSound.volume = 0.3; clickSound.play().catch(() => {});

        // 2. State Logic (Sem Side Effects)
        setProgress(currentProgress => {
            const isNowDone = !currentProgress[id]?.done;
            
            // SIDE EFFECT SEGURO: Se virou 'true', ativa o timer FORA daqui
            if (isNowDone) {
                // Usamos setTimeout(0) ou chamamos o setter diretamente fora se estivesse no escopo, 
                // mas como estamos dentro do setState, precisamos garantir que o setTimerState rode.
                // A melhor prática aqui é separar, mas neste escopo, o setTimerState vai funcionar 
                // desde que não dependa do valor anterior de progress.
                setTimerState({ active: true, seconds: 90 });
            }
            
            return { ...currentProgress, [id]: { ...currentProgress[id], done: isNowDone } };
        });
    },

    closeTimer: () => setTimerState(prev => ({ ...prev, active: false })),

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
  }), [fetchCloudData]);

  // --- RETORNO MEMORIZADO ---
  return useMemo(() => ({
    state: { activeDay, sessionNote, selectedDate, weightInput, waistInput, showMeme, view, workoutData, progress, history, bodyHistory, timerState },
    setters: { setActiveDay, setSessionNote, setSelectedDate, setWeightInput, setWaistInput, setShowMeme, setView, setWorkoutData },
    actions: { handleDateChange, saveBiometrics, finishWorkout, fetchCloudData, ...functions, closeTimer: functions.closeTimer },
    stats: { latest: bodyHistory[0] || { weight: '--', waist: '--' } }
  }), [
    activeDay, sessionNote, selectedDate, weightInput, waistInput, showMeme, view, workoutData, progress, history, bodyHistory, timerState,
    handleDateChange, saveBiometrics, finishWorkout, fetchCloudData, functions
  ]);
};