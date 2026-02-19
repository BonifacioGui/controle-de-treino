import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { initialWorkoutData } from '../workoutData';

export const useWorkout = () => {
  const [userId, setUserId] = useState(null);

  // --- 1. ESTADOS BÁSICOS ---
  const [workoutData, setWorkoutData] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_plan');
      return saved ? JSON.parse(saved) : initialWorkoutData;
    } catch { return initialWorkoutData; }
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNote, setSessionNote] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [showMeme, setShowMeme] = useState(false);
  const [view, setView] = useState('workout');
  const [timerState, setTimerState] = useState({ active: false, seconds: 90 });

  // 🔥 Inicialização dinâmica: Detecta o dia real (ex: QUI) no carregamento
  const [activeDay, setActiveDay] = useState(() => {
    const daysMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const todayKey = daysMap[new Date().getDay()];
    const availableKeys = Object.keys(workoutData || initialWorkoutData);
    return availableKeys.includes(todayKey) ? todayKey : availableKeys[0];
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

  const [workoutTimer, setWorkoutTimer] = useState({ isRunning: false, startTime: null, elapsed: 0 });

  // --- 2. AUTH E SYNC ---
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
      const { data: planData } = await supabase.from('workout_plans').select('plan_data').eq('user_id', userId).single();
      if (planData) setWorkoutData(planData.plan_data);
    } catch (err) { console.error(err); }
  }, [userId]);

  useEffect(() => { fetchCloudData(); }, [fetchCloudData]);

  // --- 3. AÇÕES PRINCIPAIS ---
  // 🔥 Calendário muda a data E o treino correspondente
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
    const dateObj = new Date(newDate + 'T00:00:00');
    const daysMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const dayName = daysMap[dateObj.getDay()];
    
    if (Object.keys(workoutData).includes(dayName)) {
      setActiveDay(dayName);
    }

    const formattedDate = newDate.split('-').reverse().join('/');
    const entryForDate = bodyHistory.find(h => h.date === formattedDate);
    setWeightInput(entryForDate ? entryForDate.weight : '');
    setWaistInput(entryForDate ? entryForDate.waist : '');
  }, [workoutData, bodyHistory]);

  const finishWorkout = useCallback(async () => {
    if (!userId) return;
    // ... sua lógica de salvar histórico ...
    setView('history');
  }, [userId, workoutData, activeDay, selectedDate, progress]);

  // --- 4. EXPORTAÇÃO ---
  return {
    state: { activeDay, sessionNote, selectedDate, weightInput, waistInput, showMeme, view, workoutData, progress, history, bodyHistory, timerState, workoutTimer },
    setters: { setActiveDay, setSessionNote, setSelectedDate, setWeightInput, setWaistInput, setShowMeme, setView, setWorkoutData },
    actions: { 
      handleDateChange, 
      finishWorkout,
      updateSetData: (id, i, f, v) => setProgress(p => {
        const c = p[id] || { sets: [] };
        const n = [...(c.sets || [])];
        while (n.length <= i) n.push({ weight: '', reps: '', completed: false });
        n[i] = { ...n[i], [f]: v };
        return { ...p, [id]: { ...c, sets: n } };
      }),
      toggleCheck: (id) => setProgress(p => ({ ...p, [id]: { ...p[id], done: !p[id]?.done } })),
      toggleWorkoutTimer: () => setWorkoutTimer(prev => prev.isRunning ? { ...prev, isRunning: false } : { isRunning: true, startTime: Date.now() - (prev.elapsed * 1000), elapsed: prev.elapsed }),
      resetWorkoutTimer: () => setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 }),
      closeTimer: () => setTimerState(prev => ({ ...prev, active: false })),
    },
    stats: { streak: 0, latest: bodyHistory[0] || { weight: '--', waist: '--' } }
  };
};