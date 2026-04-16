import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { initialWorkoutData } from '../data/workoutData';
import { calculateStats } from '../utils/rpgSystem';

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
  const [view, setView] = useState('workout');
  const [timerState, setTimerState] = useState({ active: false, seconds: 90 });

  const [isCloudSyncReady, setIsCloudSyncReady] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState({ duration: 0, volume: 0, xp: 0 });

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

      const { data: planList, error: planError } = await supabase
        .from('workout_plans')
        .select('plan_data')
        .eq('user_id', userId)
        .limit(1); 
      
      if (planError) {
        console.error("🚨 Erro do Supabase ao buscar o treino:", planError.message);
        return; 
      }

      const planData = planList && planList.length > 0 ? planList[0] : null;

      if (planData && planData.plan_data) {
        const parsedData = typeof planData.plan_data === 'string' ? JSON.parse(planData.plan_data) : planData.plan_data;
        setWorkoutData(parsedData);
        setActiveDay(currentDay => parsedData[currentDay] ? currentDay : (Object.keys(parsedData)[0] || 'A'));
        localStorage.setItem('workout_plan', JSON.stringify(parsedData));
      }
    } catch (err) { 
      console.error("Offline ou erro de rede:", err); 
    } finally {
      setIsCloudSyncReady(true);
    }
  }, [userId]);

  useEffect(() => { fetchCloudData(); }, [fetchCloudData]);

  // --- STREAK LOGIC ABSOLUTAMENTE BLINDADA ---
  const streak = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return 0;

    const validDates = history.reduce((acc, h) => {
      if (!h) return acc;
      const rawDate = h.date || h.workout_date;
      if (typeof rawDate === 'string' && rawDate.trim() !== '') {
        if (rawDate.includes('/')) {
          acc.push(rawDate.split('/').reverse().join('-'));
        } else {
          acc.push(rawDate.split('T')[0]);
        }
      }
      return acc;
    }, []);

    const uniqueDates = [...new Set(validDates)].sort().reverse();

    if (uniqueDates.length === 0) return 0;

    const createDate = (str) => { 
      const parts = str.split('-').map(Number);
      if (parts.length !== 3) return new Date(2000, 0, 1);
      return new Date(parts[0], parts[1] - 1, parts[2]); 
    };

    const today = new Date(); 
    today.setHours(0,0,0,0);
    
    const lastWorkoutDate = createDate(uniqueDates[0]);
    const diffDays = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));

    if (!(diffDays === 0 || diffDays === 1 || (today.getDay() === 1 && diffDays <= 2))) return 0;

    let currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = createDate(uniqueDates[i]);
        const d2 = createDate(uniqueDates[i+1]);
        const gap = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
        
        if (gap === 1 || (gap === 2 && d1.getDay() === 1)) {
          currentStreak++; 
        } else {
          break; 
        }
    }
    return currentStreak;
  }, [history]);

  useEffect(() => {
    localStorage.setItem('workout_plan', JSON.stringify(workoutData));
    localStorage.setItem('daily_progress', JSON.stringify(progress));
    localStorage.setItem('workout_history', JSON.stringify(history));
    localStorage.setItem('body_history', JSON.stringify(bodyHistory));
    localStorage.setItem('workout_stopwatch', JSON.stringify(workoutTimer)); 
    
    const syncPlanToCloud = async () => {
      if (!isCloudSyncReady) return;
      if (userId && Object.keys(workoutData).length > 0) {
        try {
          await supabase.from('workout_plans').upsert({ user_id: userId, plan_data: workoutData }, { onConflict: 'user_id' });
        } catch (err) {
          console.error("Erro na sincronização:", err);
        }
      }
    };
    syncPlanToCloud();
  }, [workoutData, progress, history, bodyHistory, workoutTimer, userId, isCloudSyncReady]);

  useEffect(() => {
    let interval = null;
    if (workoutTimer.isRunning) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutTimer.isRunning]);

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
    setWorkoutTimer(prev => prev.isRunning 
      ? { ...prev, isRunning: false } 
      : { isRunning: true, startTime: Date.now() - (prev.elapsed * 1000), elapsed: prev.elapsed }
    );
  }, []);

  const toggleCheck = useCallback((id) => {
    setProgress(p => {
      const isDone = !p[id]?.done;
      if (isDone) setTimerState({ active: true, seconds: 90 });
      return { ...p, [id]: { ...p[id], done: isDone } };
    });
  }, []);

  // --- CORE ACTIONS ---
  const actions = useMemo(() => ({
    updateSetData,
    toggleWorkoutTimer,
    toggleCheck,
    
    updateSessionSets: (id, value) => {
      setProgress(p => ({ ...p, [id]: { ...p[id], actualSets: value } }));
    },

    toggleSetComplete: (id, setIdx) => {
      const now = Date.now();
      setProgress(p => {
        const current = p[id] || { sets: [] };
        const lastSetTime = p.lastSetTimestamp || 0;
        const isCombo = now - lastSetTime < 60000; 
        const newSets = [...(current.sets || [])];
        while (newSets.length <= setIdx) newSets.push({ completed: false });
        const isNowCompleted = !newSets[setIdx].completed;

        newSets[setIdx] = { ...newSets[setIdx], completed: isNowCompleted, finishedAt: now };

        if (isNowCompleted) {
          setTimerState({ active: true, seconds: 90 });
          if (isCombo) console.log("COMBO ATIVADO! +10 XP Bônus");
        }

        return { ...p, [id]: { ...current, sets: newSets }, lastSetTimestamp: now };
      });
    },

    onSwap: (id, newName) => {
      setProgress(p => ({ ...p, [id]: { ...p[id], swappedName: newName } }));
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
      const safeDay = workoutData[activeDay] ? activeDay : Object.keys(workoutData)[0];
      let totalVolume = 0;

      const exercisesToSave = workoutData[safeDay].exercises.map((ex, i) => {
        const id = `${selectedDate}-${safeDay}-${i}`;
        const p = progress[id];
        
        if (p && p.sets) {
          p.sets.forEach(set => {
            if (set.completed) {
              const w = parseFloat(set.weight) || 0;
              const r = parseInt(set.reps) || 0;
              totalVolume += (w * r);
            }
          });
        }

        return { name: p?.swappedName || ex.name, sets: p?.sets || [], done: p?.done || false, actualSets: p?.actualSets || ex.sets };
      });

      const durationMins = Math.max(1, Math.floor(workoutTimer.elapsed / 60));
      const xpGained = Math.floor(totalVolume * 0.05);

      setLastSessionStats({ duration: durationMins, volume: totalVolume, xp: xpGained });

      const sessionBase = {
        user_id: userId,
        workout_date: selectedDate,
        workout_name: safeDay,
        note: sessionNote,
        exercises: exercisesToSave
      };

      const statsAntes = calculateStats(history);
      const levelAntes = statsAntes.level || 1;
      
      const newEntry = {...sessionBase, date: selectedDate.split('-').reverse().join('/')};
      const newHistory = [newEntry, ...history];
      
      const statsDepois = calculateStats(newHistory);
      const levelDepois = statsDepois.level || 1;
      
      const subiuDeNivel = levelDepois > levelAntes;

      setHistory(newHistory);

      if (userId) {
        supabase.from('workout_history').insert([sessionBase]).then(() => fetchCloudData());
      }

      setProgress({});
      setSessionNote('');
      setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 });

      return subiuDeNivel;
    },

    resetWorkoutTimer: () => setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 }),
    closeTimer: () => setTimerState(prev => ({ ...prev, active: false })),
    fetchCloudData,
    
    deleteEntry: async (id, type) => {
        await supabase.from(type === 'body' ? 'body_stats' : 'workout_history').delete().eq('id', id);
        fetchCloudData();
    },

    manageData: {
      add: (day) => { setWorkoutData(prev => ({ ...prev, [day]: { ...prev[day], exercises: [...prev[day].exercises, {name:"Novo", sets:"3x12", note:""}] } })); },
      addFromCatalog: (day, selectedExercises) => {
        setWorkoutData(prev => {
          const newExercises = selectedExercises.map(exName => ({ name: exName, sets: "3x10", note: "" }));
          return { ...prev, [day]: { ...prev[day], exercises: [...(prev[day]?.exercises || []), ...newExercises] } };
        });
      },
      remove: (day, i) => { setWorkoutData(prev => ({ ...prev, [day]: { ...prev[day], exercises: prev[day].exercises.filter((_, idx) => idx !== i) } })); },
      edit: (day, i, f, v) => { 
        setWorkoutData(prev => {
          const n = JSON.parse(JSON.stringify(prev)); 
          n[day].exercises[i][f] = v;
          return n;
        });
      },
      addDay: (newDayName) => {
        setWorkoutData(prev => {
          if (prev[newDayName]) return prev; 
          return { ...prev, [newDayName]: { title: `TREINO ${newDayName}`, focus: "GERAL", exercises: [] } };
        });
      },
      removeDay: (dayName) => {
        setWorkoutData(prev => {
          const copy = { ...prev };
          delete copy[dayName];
          return copy;
        });
      },
    }
  }), [userId, activeDay, workoutData, selectedDate, sessionNote, progress, bodyHistory, history, updateSetData, toggleWorkoutTimer, toggleCheck, fetchCloudData, workoutTimer]);

  const globalRPG = useMemo(() => {
    return calculateStats(history); 
  }, [history]);

  return {
    state: { activeDay, sessionNote, selectedDate, weightInput, waistInput, view, workoutData, progress, history, bodyHistory, timerState, workoutTimer, userId },
    setters: { setActiveDay, setSessionNote, setSelectedDate, setWeightInput, setWaistInput, setView, setWorkoutData },
    actions,
    stats: { 
      latest: bodyHistory[0] || { weight: '--', waist: '--' }, 
      streak, 
      lastSessionStats,
      level: globalRPG.level,
      xp: globalRPG.xp,
      title: globalRPG.title,
      progress: globalRPG.nextLevelProgress,
      xpRemaining: globalRPG.xpRemaining 
    }
  };
};