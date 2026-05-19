import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { initialWorkoutData } from '../data/workoutData';
import { calculateStats, calculateStreak } from '../utils/rpgSystem';
import { useWorkoutTimer } from './useWorkoutTimer';
import { getUnlockedBadges } from '../utils/gameLogic';

const getInitialWorkout = (data) => {
  const keys = Object.keys(data || {});
  return keys[0] || 'A';
};

export const useWorkout = () => {
  // 1. ESTADOS PRINCIPAIS
  const [userId, setUserId] = useState(null);
  const [workoutData, setWorkoutData] = useState(() => {
    try {
      const saved = localStorage.getItem('workout_plan');
      return saved ? JSON.parse(saved) : initialWorkoutData;
    } catch { return initialWorkoutData; }
  });

  const [activeDay, setActiveDay] = useState(() => {
    try {
      const savedDay = localStorage.getItem('active_day');
      const planKeys = Object.keys(workoutData || {});
      if (savedDay && planKeys.includes(savedDay)) return savedDay;
      return planKeys[0] || 'A';
    } catch { 
      return getInitialWorkout(workoutData); 
    }
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNote, setSessionNote] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [view, setView] = useState('workout');
  const [timerState, setTimerState] = useState({ active: false, seconds: 90 });
  const [isCloudSyncReady, setIsCloudSyncReady] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState({ duration: 0, volume: 0, xp: 0 });

  // 2. HOOKS MODULARIZADOS
  const { workoutTimer, toggleWorkoutTimer, resetWorkoutTimer, setWorkoutTimer } = useWorkoutTimer();

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

  // 3. AUTH & CLOUD FETCH
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

      const { data: planList } = await supabase.from('workout_plans').select('plan_data').eq('user_id', userId).limit(1); 
      const planData = planList && planList.length > 0 ? planList[0] : null;

      if (planData && planData.plan_data) {
        const parsedData = typeof planData.plan_data === 'string' ? JSON.parse(planData.plan_data) : planData.plan_data;
        setWorkoutData(parsedData);
        
        const savedDay = localStorage.getItem('active_day');
        setActiveDay(currentDay => (savedDay && parsedData[savedDay]) ? savedDay : (parsedData[currentDay] ? currentDay : (Object.keys(parsedData)[0] || 'A')));
        
        localStorage.setItem('workout_plan', JSON.stringify(parsedData));
      }
    } catch (err) { 
      console.error("Offline ou erro de rede:", err); 
    } finally {
      setIsCloudSyncReady(true);
    }
  }, [userId]);

  useEffect(() => { fetchCloudData(); }, [fetchCloudData]);

  // 4. CÁLCULO DE STREAK
  const streak = useMemo(() => calculateStreak(history), [history]);

  // 5. LOCAL SYNC
  useEffect(() => {
    localStorage.setItem('workout_plan', JSON.stringify(workoutData));
    localStorage.setItem('daily_progress', JSON.stringify(progress));
    localStorage.setItem('workout_history', JSON.stringify(history));
    localStorage.setItem('body_history', JSON.stringify(bodyHistory));
    localStorage.setItem('active_day', activeDay); 
    
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
  }, [workoutData, progress, history, bodyHistory, userId, isCloudSyncReady, activeDay]);

  // MOTOR DO CRONÔMETRO DE DESCANSO
  useEffect(() => {
    let interval = null;

    if (timerState.active) {
      interval = setInterval(() => {
        setTimerState(prev => {
          if (prev.seconds <= 1) {
            clearInterval(interval);
            return { active: false, seconds: 0 };
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.active]);

  // 6. AÇÕES DO TREINO
  const updateSetData = useCallback((id, i, f, v) => {
    setProgress(p => {
      const c = p[id] || { sets: [] };
      const n = [...(c.sets || [])];
      while (n.length <= i) n.push({ weight: '', reps: '', completed: false });
      n[i] = { ...n[i], [f]: v };
      return { ...p, [id]: { ...c, sets: n } };
    });
  }, []);

  const toggleCheck = useCallback((id) => {
    setProgress(p => {
      const isDone = !p[id]?.done;
      if (isDone) setTimerState({ active: true, seconds: 90 });
      return { ...p, [id]: { ...p[id], done: isDone } };
    });
  }, []);

  const actions = useMemo(() => ({
    updateSetData,
    toggleWorkoutTimer,
    resetWorkoutTimer,
    toggleCheck,
    
    updateSessionSets: (id, value) => {
      setProgress(p => ({ ...p, [id]: { ...p[id], actualSets: value } }));
    },

    toggleSetComplete: (id, setIdx) => {
      const now = Date.now();
      setProgress(p => {
        const current = p[id] || { sets: [] };
        const newSets = [...(current.sets || [])];
        while (newSets.length <= setIdx) newSets.push({ completed: false });
        const isNowCompleted = !newSets[setIdx].completed;

        newSets[setIdx] = { ...newSets[setIdx], completed: isNowCompleted, finishedAt: now };

        if (isNowCompleted) {
          setTimerState({ active: true, seconds: 90 });
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

    finishWorkout: async (bonusXP = 0) => {
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
      const durationSeconds = workoutTimer.elapsed > 0 ? workoutTimer.elapsed : durationMins * 60;
      
      let exercisesSwappedCount = 0;
      progress && Object.keys(progress).forEach(key => {
        if(progress[key]?.swappedName) exercisesSwappedCount++;
      });

      // 🔥 SISTEMA DE OVERLOAD REALISTA (COM JANELA DE TOLERÂNCIA) 🔥
      const treinosPassados = history.filter(t => t.workout_name === safeDay);
      let multiplicadorXP = 1.0;
      let overloadStatus = 'NORMAL';

      if (treinosPassados.length > 0 && treinosPassados[0].total_volume > 0) {
        const volumeAnterior = treinosPassados[0].total_volume;
        
        if (totalVolume > volumeAnterior) {
          multiplicadorXP = 1.2; // OVERLOAD: Bateu PR de volume (+20% XP)
          overloadStatus = 'OVERLOAD';
        } else if (totalVolume < volumeAnterior) {
          multiplicadorXP = 0.8; // REGRESSÃO: Dia ruim, perdeu volume (-20% XP)
          overloadStatus = 'REGRESSÃO';
        } else {
          // O volume é EXATAMENTE igual ao treino passado.
          // Vamos ver há quanto tempo ele está preso nesse mesmo volume:
          let repeticoesDoVolume = 0;
          for (let i = 0; i < treinosPassados.length; i++) {
            if (treinosPassados[i].total_volume === totalVolume) {
              repeticoesDoVolume++;
            } else {
              break; // O volume era diferente antes, quebrou a contagem
            }
          }

          // Se ele já repetiu essa carga em 3 treinos anteriores (esta é a 4ª vez)
          if (repeticoesDoVolume >= 3) {
            multiplicadorXP = 0.85; // ESTAGNAÇÃO: Tempo demais no conforto (-15% XP)
            overloadStatus = 'ESTAGNAÇÃO';
          } else {
            multiplicadorXP = 1.0;  // MANUTENÇÃO: Consolidando a força (100% XP)
            overloadStatus = 'MANUTENÇÃO';
          }
        }
      }

      // Calcula o XP Base e aplica o Multiplicador
      const xpBase = Math.floor(totalVolume * 0.05);
      const xpGained = Math.floor(xpBase * multiplicadorXP) + bonusXP;

      setLastSessionStats({ duration: durationMins, volume: totalVolume, xp: xpGained });

      const sessionBase = {
        user_id: userId,
        workout_date: selectedDate,
        workout_name: safeDay,
        note: sessionNote,
        exercises: exercisesToSave,
        total_volume: totalVolume,
        bonus_xp: bonusXP,
        duration: durationSeconds, 
        has_note: !!sessionNote,
        exercises_swapped: exercisesSwappedCount,
        prs_broken: 0,
        overload_status: overloadStatus // Gravando no banco para usos futuros
      };

      const statsAntes = calculateStats(history);
      const levelAntes = statsAntes.level || 1;

      const badgesAntes = getUnlockedBadges(history).filter(b => b.unlocked).map(b => b.id);
      
      const newEntry = {...sessionBase, date: selectedDate.split('-').reverse().join('/')};
      const newHistory = [newEntry, ...history];
      
      const statsDepois = calculateStats(newHistory);
      const levelDepois = statsDepois.level || 1;
      
      const subiuDeNivel = levelDepois > levelAntes;

      const badgesDepoisCompleto = getUnlockedBadges(newHistory).filter(b => b.unlocked);
      const novasConquistas = badgesDepoisCompleto.filter(b => !badgesAntes.includes(b.id));
      
      setHistory(newHistory);

      if (userId) {
        // 🔥 BLINDAGEM MÁXIMA DO BANCO DE DADOS
        const { error } = await supabase.from('workout_history').insert([sessionBase]);
        
        if (error) {
          console.error("[ERRO CRÍTICO SUPABASE] O treino não foi salvo na nuvem:", error.message);
          alert(`Falha no Banco de Dados: ${error.message}\nVerifique se todas as colunas existem no Supabase!`);
          // Note que NÃO chamamos o fetchCloudData aqui. Assim seu treino local não é apagado!
        } else {
          // Só puxa da nuvem se o salvamento foi um SUCESSO absoluto
          fetchCloudData();
        }
      }

      setProgress({});
      setSessionNote('');
      setWorkoutTimer({ isRunning: false, startTime: null, elapsed: 0 });

      return {
        subiuDeNivel,
        sessionXp: xpGained,
        sessionVolume: totalVolume,
        sessionDuration: durationMins,
        newLevel: levelDepois,
        newStreak: calculateStreak(newHistory), 
        newBadges: novasConquistas,
        overloadStatus: overloadStatus 
      };
    },

    closeTimer: () => setTimerState(prev => ({ ...prev, active: false })),
    fetchCloudData,
    
    deleteEntry: async (id, type) => {
      if (type !== 'body') {
        const questsData = localStorage.getItem('daily_quests');
        if (questsData) {
          try {
            const quests = JSON.parse(questsData);
            const resetQuests = quests.map(q => ({ ...q, completed: false, progress: 0 }));
            localStorage.setItem('daily_quests', JSON.stringify(resetQuests));
          } catch (e) { console.error("Erro ao resetar missões:", e); }
        }
      }
      await supabase.from(type === 'body' ? 'body_stats' : 'workout_history').delete().eq('id', id);
      fetchCloudData();
    },

    updateHistoryEntry: async (id, updatedSession) => {
      if (!userId) return;
      
      try {
        let newVolume = 0;
        updatedSession.exercises.forEach(ex => {
          if (ex.sets) {
            ex.sets.forEach(set => {
              const w = parseFloat(set.weight) || 0;
              const r = parseInt(set.reps) || 0;
              newVolume += (w * r);
            });
          }
        });

        const dateToday = new Date().toLocaleDateString('pt-BR');
        if (updatedSession.date === dateToday) {
          const questsData = localStorage.getItem('daily_quests');
          if (questsData) {
            try {
              const quests = JSON.parse(questsData);
              const resetQuests = quests.map(q => ({ ...q, completed: false, progress: 0 }));
              localStorage.setItem('daily_quests', JSON.stringify(resetQuests));
            } catch (e) { console.error("Erro ao resetar missões:", e); }
          }
        }

        await supabase
          .from('workout_history')
          .update({
            note: updatedSession.note,
            exercises: updatedSession.exercises,
            total_volume: newVolume,
            bonus_xp: 0 
          })
          .eq('id', id);

        fetchCloudData();
        
      } catch (err) {
        console.error("Erro ao atualizar o histórico de treino:", err);
      }
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
  }), [userId, activeDay, workoutData, selectedDate, sessionNote, progress, bodyHistory, history, updateSetData, toggleWorkoutTimer, resetWorkoutTimer, toggleCheck, fetchCloudData, workoutTimer, setWorkoutTimer]); // 🔥 Aviso do ESLint resolvido com o setWorkoutTimer no final da linha!

  const globalRPG = useMemo(() => calculateStats(history), [history]);

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