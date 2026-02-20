import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { initialWorkoutData } from '../workoutData';

// Função auxiliar livre (fora do hook)
const getInitialWorkout = (data) => {
  const keys = Object.keys(data || {});
  return keys[0] || 'A';
};

export const useWorkout = () => {
  const [userId, setUserId] = useState(null);

  // --- 1. DADOS BASE ---
  const [workoutData, setWorkoutData] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_plan');
      return saved ? JSON.parse(saved) : initialWorkoutData;
    } catch { return initialWorkoutData; }
  });

  // O estado nasce no primeiro treino da ficha (ex: A)
  const [activeDay, setActiveDay] = useState(() => getInitialWorkout(workoutData));

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNote, setSessionNote] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [showMeme, setShowMeme] = useState(false);
  const [view, setView] = useState('workout');
  const [timerState, setTimerState] = useState({ active: false, seconds: 90 });

  const [workoutTimer, setWorkoutTimer] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_stopwatch');
      if (saved) {
         const parsed = JSON.parse(saved);
         if (parsed.isRunning) return { ...parsed, elapsed: Math.floor((Date.now() - parsed.startTime) / 1000) };
         return parsed;
      }
      return { isRunning: false, startTime: null, elapsed: 0 };
    } catch { return { isRunning: false, startTime: null, elapsed: 0 }; }
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

  // --- AUTH E CLOUD SYNC ---
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchCloudData = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: bodyData } = await supabase.from('body_stats').select('*').eq('user_id', userId).order('date', { ascending: false });
      if (bodyData) setBodyHistory(bodyData.map(b => ({ ...b, date: b.date.split('T')[0].split('-').reverse().join('/') })));
      
      const { data: trainData } = await supabase.from('workout_history').select('*').eq('user_id', userId).order('workout_date', { ascending: false });
      if (trainData) setHistory(trainData.map(t => ({ ...t, id: t.id, date: t.workout_date.split('T')[0].split('-').reverse().join('/'), dayName: t.workout_name })));

      const { data: planData } = await supabase.from('workout_plans').select('plan_data').eq('user_id', userId).single();
      if (planData) setWorkoutData(planData.plan_data);
    } catch (err) { console.error("Offline:", err); }
  }, [userId]);

  useEffect(() => { fetchCloudData(); }, [fetchCloudData]);

  // --- LÓGICA DE STREAK ---
  const streak = useMemo(() => {
    if (!history || history.length === 0) return 0;
    const uniqueDates = [...new Set(history.map(h => h.date.includes('/') ? h.date.split('/').reverse().join('-') : h.date.split('T')[0]))].sort().reverse();
    if (uniqueDates.length === 0) return 0;
    const createDate = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };
    const today = new Date(); today.setHours(0,0,0,0);
    const lastWorkoutDate = createDate(uniqueDates[0]);
    const diffDays = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
    if (!(diffDays === 0 || diffDays === 1 || (today.getDay() === 1 && diffDays <= 2))) return 0;
    let currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const gap = Math.floor((createDate(uniqueDates[i]) - createDate(uniqueDates[i+1])) / (1000 * 60 * 60 * 24));
        if (gap === 1 || (gap === 2 && createDate(uniqueDates[i]).getDay() === 1)) currentStreak++; 
        else break; 
    }
    return currentStreak;
  }, [history]);

  const playSound = useCallback((type) => {
    const urls = { click: 'mech-keyboard-01.mp3', success: 'level-up-bonus-sequence-2-186891.mp3', start: 'interface-124464.mp3' };
    const audio = new Audio(`https://www.myinstants.com/media/sounds/${urls[type]}`);
    audio.volume = 0.3; audio.play().catch(() => {});
  }, []);

  // --- SYNC LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem('workout_plan', JSON.stringify(workoutData));
    localStorage.setItem('daily_progress', JSON.stringify(progress));
    localStorage.setItem('workout_history', JSON.stringify(history));
    localStorage.setItem('body_history', JSON.stringify(bodyHistory));
    localStorage.setItem('workout_stopwatch', JSON.stringify(workoutTimer)); 
  }, [workoutData, progress, history, bodyHistory, workoutTimer]);

  useEffect(() => {
    let interval = null;
    if (workoutTimer.isRunning) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutTimer.isRunning]);

  const savePlanToCloud = async (newData) => {
    if (!userId) return;
    try { await supabase.from('workout_plans').upsert({ user_id: userId, plan_data: newData, updated_at: new Date() }, { onConflict: 'user_id' }); }
    catch (err) { console.error(err); }
  };

  const saveBiometrics = async (photoBase64 = null) => {
    if (!userId || (!weightInput && !waistInput && !photoBase64)) return;
    const newEntry = { user_id: userId, date: selectedDate, weight: weightInput ? parseFloat(weightInput) : null, waist: waistInput ? parseFloat(waistInput) : null };
    if (photoBase64) newEntry.photo = photoBase64;
    try { await supabase.from('body_stats').upsert(newEntry, { onConflict: 'user_id, date' }); } catch (err) {}
    fetchCloudData();
  };

  // --- ACTIONS ---
  const actions = {
    // 🔥 CALENDÁRIO: Muda apenas a data do registo, NUNCA o treino selecionado
    handleDateChange: (newDate) => {
      setSelectedDate(newDate);
      
      const formattedDate = newDate.split('-').reverse().join('/');
      const entryForDate = bodyHistory.find(h => h.date === formattedDate);
      setWeightInput(entryForDate ? entryForDate.weight : '');
      setWaistInput(entryForDate ? entryForDate.waist : '');
    },
    
    finishWorkout: async () => {
      if (!userId) return;
      await saveBiometrics();
      playSound('success');
      const safeDay = workoutData[activeDay] ? activeDay : Object.keys(workoutData)[0];
      const sessionBase = {
        user_id: userId, workout_date: selectedDate, workout_name: safeDay, note: sessionNote,
        exercises: workoutData[safeDay].exercises.map((ex, i) => {
          const p = progress[`${selectedDate}-${safeDay}-${i}`];
          return { name: ex.name, sets: p?.sets || [], done: p?.done || false };
        })
      };
      try { await supabase.from('workout_history').insert([sessionBase]); } catch (err) {}
      setProgress({}); setSessionNote(''); setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 });
      setShowMeme(true); setTimeout(() => { setShowMeme(false); setView('history'); fetchCloudData(); }, 3500);
    },

    fetchCloudData,
    
    updateSetData: (id, i, f, v) => setProgress(p => {
        const c = p[id] || { sets: [] }; const n = [...(c.sets || [])];
        while (n.length <= i) n.push({ weight: '', reps: '' }); n[i] = { ...n[i], [f]: v };
        return { ...p, [id]: { ...c, sets: n } };
    }),
    toggleCheck: (id) => {
        playSound('click');
        setProgress(p => {
            const isDone = !p[id]?.done;
            if (isDone) setTimerState({ active: true, seconds: 90 });
            return { ...p, [id]: { ...p[id], done: isDone } };
        });
    },
    updateSessionSets: (id, val) => setProgress(p => ({ ...p, [id]: { ...p[id], actualSets: val } })),
    toggleWorkoutTimer: () => {
      playSound('start'); 
      setWorkoutTimer(prev => prev.isRunning ? { ...prev, isRunning: false } : { isRunning: true, startTime: Date.now() - (prev.elapsed * 1000), elapsed: prev.elapsed });
    },
    resetWorkoutTimer: () => window.confirm("Zerar?") && setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 }),
    closeTimer: () => setTimerState(prev => ({ ...prev, active: false })),
    deleteEntry: async (id, type) => {
        if (!window.confirm("Apagar?")) return;
        await supabase.from(type === 'body' ? 'body_stats' : 'workout_history').delete().eq('id', id);
        fetchCloudData();
    },

    manageData: {
      add: (day) => { 
        const n = {...workoutData, [day]: {...workoutData[day], exercises: [...workoutData[day].exercises, {name:"Novo", sets:"3x12", note:""}]}}; 
        setWorkoutData(n); savePlanToCloud(n); 
      },
      remove: (day, i) => { 
        const n = {...workoutData, [day]: {...workoutData[day], exercises: workoutData[day].exercises.filter((_, idx) => idx !== i)}}; 
        setWorkoutData(n); savePlanToCloud(n); 
      },
      edit: (day, i, f, v) => { 
        const n = {...workoutData}; n[day].exercises[i][f] = v; 
        setWorkoutData(n); savePlanToCloud(n); 
      },
      addFromCatalog: (day, exerciseName) => { 
        const n = {...workoutData, [day]: {...workoutData[day], exercises: [...workoutData[day].exercises, {name: exerciseName, sets:"3x12", note:""}]}}; 
        setWorkoutData(n); savePlanToCloud(n); 
      }
    }
  };

  return {
    state: { activeDay, sessionNote, selectedDate, weightInput, waistInput, showMeme, view, workoutData, progress, history, bodyHistory, timerState, workoutTimer, userId },
    setters: { setActiveDay, setSessionNote, setSelectedDate, setWeightInput, setWaistInput, setShowMeme, setView, setWorkoutData },
    actions,
    stats: { latest: bodyHistory[0] || { weight: '--', waist: '--' }, streak }
  };
};