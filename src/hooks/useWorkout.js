import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { initialWorkoutData } from '../workoutData';

const getInitialWorkout = (data) => {
  const keys = Object.keys(data || {});
  return keys[0] || 'A';
};

export const useWorkout = () => {
  const [userId, setUserId] = useState(null);
  const [workoutData, setWorkoutData] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_plan');
      return saved ? JSON.parse(saved) : initialWorkoutData;
    } catch { return initialWorkoutData; }
  });

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

  // --- AUTH ---
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

  // --- STREAK LOGIC ---
  const streak = useMemo(() => {
    if (!history || history.length === 0) return 0;
    const uniqueDates = [...new Set(history.map(h => h.date.includes('/') ? h.date.split('/').reverse().join('-') : h.date.split('T')[0]))].sort().reverse();
    const createDate = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };
    const today = new Date(); today.setHours(0,0,0,0);
    if (uniqueDates.length === 0) return 0;
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

  // --- PERSISTENCE SYNC ---
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

  // --- STABLE UPDATE FUNCTIONS ---
  const updateSetData = useCallback((id, i, f, v) => {
    setProgress(p => {
      const c = p[id] || { sets: [] };
      const n = [...(c.sets || [])];
      while (n.length <= i) n.push({ weight: '', reps: '', completed: false });
      n[i] = { ...n[i], [f]: v };
      return { ...p, [id]: { ...c, sets: n } };
    });
  }, []);

  const toggleWorkoutTimer = useCallback(() => {
    playSound('start'); 
    setWorkoutTimer(prev => prev.isRunning 
      ? { ...prev, isRunning: false } 
      : { isRunning: true, startTime: Date.now() - (prev.elapsed * 1000), elapsed: prev.elapsed }
    );
  }, [playSound]);

  const toggleCheck = useCallback((id) => {
    playSound('click');
    setProgress(p => {
      const isDone = !p[id]?.done;
      if (isDone) setTimerState({ active: true, seconds: 90 });
      return { ...p, [id]: { ...p[id], done: isDone } };
    });
  }, [playSound]);

  // --- CORE ACTIONS (Memoized) ---
  const actions = useMemo(() => ({
    updateSetData,
    toggleWorkoutTimer,
    toggleCheck,
    
    // Atualiza o input de "Ciclos" ou "Tempo" (Linha 104 do seu ExerciseCard)
    updateSessionSets: (id, value) => {
      setProgress(p => ({
        ...p,
        [id]: { ...p[id], actualSets: value }
      }));
    },

    // Alterna o status de uma série individual (Linha 111 do seu ExerciseCard)
    toggleSetComplete: (id, setIdx) => {
      playSound('click');
      setProgress(p => {
        const current = p[id] || { sets: [] };
        const newSets = [...(current.sets || [])];
        while (newSets.length <= setIdx) newSets.push({ weight: '', reps: '', completed: false });
        
        newSets[setIdx] = { ...newSets[setIdx], completed: !newSets[setIdx].completed };
        
        // Se marcou como feito, inicia o descanso
        if (newSets[setIdx].completed) {
          setTimerState({ active: true, seconds: 90 });
        }
        return { ...p, [id]: { ...current, sets: newSets } };
      });
    },

    // Troca o exercício por uma alternativa (Sua lógica de Swap)
    onSwap: (id, newName) => {
      setProgress(p => ({
        ...p,
        [id]: { ...p[id], swappedName: newName }
      }));
    },

    setWeight: (val) => setWeightInput(val),
    setWaist: (val) => setWaistInput(val),
    setNote: (val) => setSessionNote(val),

    handleDateChange: (newDate) => {
      setSelectedDate(newDate);
      const formattedDate = newDate.split('-').reverse().join('/');
      const entryForDate = bodyHistory.find(h => h.date === formattedDate);
      setWeightInput(entryForDate ? entryForDate.weight : '');
      setWaistInput(entryForDate ? entryForDate.waist : '');
    },

    finishWorkout: async () => {
      setShowMeme(true); 
      playSound('success');
      
      const safeDay = workoutData[activeDay] ? activeDay : Object.keys(workoutData)[0];
      const sessionBase = {
        user_id: userId,
        workout_date: selectedDate,
        workout_name: safeDay,
        note: sessionNote,
        exercises: workoutData[safeDay].exercises.map((ex, i) => {
          const id = `${selectedDate}-${safeDay}-${i}`;
          const p = progress[id];
          return { 
            name: p?.swappedName || ex.name, 
            sets: p?.sets || [], 
            done: p?.done || false,
            actualSets: p?.actualSets || ex.sets
          };
        })
      };

      if (userId) {
        try { await supabase.from('workout_history').insert([sessionBase]); } catch (err) { console.error(err); }
      }

      setTimeout(() => { 
        setProgress({}); 
        setSessionNote(''); 
        setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 });
        setShowMeme(false); 
        setView('history'); 
        fetchCloudData();
      }, 3500);
    },

    resetWorkoutTimer: () => window.confirm("Zerar?") && setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 }),
    closeTimer: () => setTimerState(prev => ({ ...prev, active: false })),
    fetchCloudData,
    
    deleteEntry: async (id, type) => {
        if (!window.confirm("Apagar?")) return;
        await supabase.from(type === 'body' ? 'body_stats' : 'workout_history').delete().eq('id', id);
        fetchCloudData();
    },

    manageData: {
      add: (day) => { 
        setWorkoutData(prev => ({
          ...prev, 
          [day]: { ...prev[day], exercises: [...prev[day].exercises, {name:"Novo", sets:"3x12", note:""}] }
        }));
      },
      remove: (day, i) => { 
        setWorkoutData(prev => ({
          ...prev, 
          [day]: { ...prev[day], exercises: prev[day].exercises.filter((_, idx) => idx !== i) }
        }));
      },
      edit: (day, i, f, v) => { 
        setWorkoutData(prev => {
          const n = JSON.parse(JSON.stringify(prev)); // Deep copy para evitar mutação
          n[day].exercises[i][f] = v;
          return n;
        });
      }
    }
  }), [userId, activeDay, workoutData, selectedDate, sessionNote, progress, bodyHistory, updateSetData, toggleWorkoutTimer, toggleCheck, fetchCloudData, playSound]);

  return {
    state: { activeDay, sessionNote, selectedDate, weightInput, waistInput, showMeme, view, workoutData, progress, history, bodyHistory, timerState, workoutTimer, userId },
    setters: { setActiveDay, setSessionNote, setSelectedDate, setWeightInput, setWaistInput, setShowMeme, setView, setWorkoutData },
    actions,
    stats: { latest: bodyHistory[0] || { weight: '--', waist: '--' }, streak }
  };
};