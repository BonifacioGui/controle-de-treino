import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, Trophy, X, Play, ShieldAlert } from 'lucide-react'; 

import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import ShareCard from '../export/ShareCard';
import { formatTime, safeParseFloat, isSameExercise } from '../../utils/workoutUtils';

// 🔥 CORREÇÃO 1: Importando direto da fonte inquebrável
import { QUEST_RULES } from '../../utils/questRules';

const WorkoutView = ({ 
  activeDay, setActiveDay, workoutData, selectedDate, setSelectedDate, 
  progress, sessionNote, setSessionNote, finishWorkout, history,
  workoutTimer, actions 
}) => {

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // 🔥 NOVO ESTADO: O MODO DE COMBATE
  const [isCombatMode, setIsCombatMode] = useState(false);
  
  // 🔥 ESTADO DO TOAST DE RECOMPENSA
  const [toastQuest, setToastQuest] = useState(null);

  const cardRef = useRef(null);

  const days = useMemo(() => Object.keys(workoutData || {}), [workoutData]); 
  const currentWorkout = workoutData[activeDay];

  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';

  // 🔥 Se mudar de aba enquanto NÃO estiver em combate, mantém fora de combate. 
  // Se mudar enquanto o timer roda, a aba está travada (já tratado no WorkoutApp).
  useEffect(() => {
    // Se o timer não está rodando, garantimos que começamos no modo Preview.
    if (!workoutTimer.isRunning) {
        setIsCombatMode(false);
    } else {
        // Se o timer está rodando (voltou para a tela), mantém o modo de combate
        setIsCombatMode(true);
    }
  }, [activeDay, workoutTimer.isRunning]);

  const handlePrevDay = (e) => {
    if (e) e.stopPropagation();
    const idx = days.indexOf(activeDay);
    if (idx === -1) return;
    setActiveDay(days[(idx - 1 + days.length) % days.length]);
  };

  const handleNextDay = (e) => {
    if (e) e.stopPropagation();
    const idx = days.indexOf(activeDay);
    if (idx === -1) return;
    setActiveDay(days[(idx + 1) % days.length]);
  };

  const todayStats = useMemo(() => {
    if (!currentWorkout) return { volume: 0, duration: '00:00' };
    let volume = 0;
    currentWorkout.exercises.forEach((ex, i) => {
      const exData = progress[`${selectedDate}-${activeDay}-${i}`];
      exData?.sets?.forEach(set => {
        if (set.completed) volume += safeParseFloat(set.weight) * safeParseFloat(set.reps);
      });
    });
    return { volume: Math.round(volume), duration: formatTime(workoutTimer.elapsed) };
  }, [currentWorkout, progress, selectedDate, activeDay, workoutTimer.elapsed]);

  const isTutorialDay = activeDay === 'INÍCIO' || currentWorkout?.exercises?.some(ex => ex.sets === "-x-" || ex.sets === "-");

  const handleFinishWorkout = async () => {
    if (isFinishing) return; 
    setIsFinishing(true);    
    
    try {
      let totalSets = 0;
      let completedSets = 0;
      let exercisesSwapped = 0;
      let prsBroken = 0; 

      currentWorkout?.exercises?.forEach((ex, i) => {
        const id = `${selectedDate}-${activeDay}-${i}`;
        const exData = progress[id];
        const displayName = exData?.swappedName || ex.name;
        
        if (exData && exData.swappedName && exData.swappedName !== ex.name) {
          exercisesSwapped++;
        }
        
        if (exData) {
          const isExerciseDone = !!(exData.completed || exData.done || exData.checked);

          if (exData.sets && Array.isArray(exData.sets)) {
            totalSets += exData.sets.length;
            
            const cSets = exData.sets.filter(s => 
              s.completed === true || 
              s.done === true || 
              s.checked === true || 
              isExerciseDone
            ).length;
            
            completedSets += cSets;

            const exerciseHistory = (history || [])
              .flatMap(s => s.exercises.map(e => ({...e, date: s.date})))
              .filter(e => e.done !== false && isSameExercise(displayName, e.name));

            const exercisePR = exerciseHistory.reduce((max, e) => {
               const validWeights = e.sets?.map(s => parseFloat(String(s.weight).replace(',', '.')) || 0).filter(w => w > 0) || [];
               return Math.max(max, validWeights.length > 0 ? Math.max(...validWeights) : 0);
            }, 0);

            const todayMax = exData.sets.reduce((max, s) => {
               const w = parseFloat(String(s.weight).replace(',', '.')) || 0;
               return Math.max(max, w);
            }, 0);

            if (todayMax > exercisePR && exercisePR > 0) {
                prsBroken++;
            }
          } else if (isExerciseDone) {
            const estimatedSets = ex.sets ? (parseInt(ex.sets) || 3) : 3;
            totalSets += estimatedSets;
            completedSets += estimatedSets;
          }
        }
      });

      console.log(`[SYS.LOG] Séries Totais: ${totalSets} | Séries Concluídas: ${completedSets}`);

      if (completedSets === 0) {
        console.warn("Treino abortado: Nenhuma série foi concluída.");
        setIsFinishing(false);
        return;
      }

      const sessionData = {
        totalVolume: todayStats.volume,
        duration: workoutTimer?.elapsed || 0,
        hasNote: !!sessionNote && sessionNote.trim().length > 0, 
        totalSets,
        completedSets,
        exercisesSwapped,
        prsBroken, 
        finished: true
      };

      let bonusXP = 0;

      const isTodayStr = new Date().toISOString().split('T')[0];
      const isWorkoutToday = selectedDate === isTodayStr;

      if (isWorkoutToday) {
        try {
          const dailyQuests = JSON.parse(localStorage.getItem('daily_quests') || '[]');
          let questsUpdated = false;
          const newlyCompleted = [];

          const updatedQuests = dailyQuests.map(quest => {
            if (quest.completed) return quest;

            const checkRule = QUEST_RULES[quest.type];
            if (checkRule && checkRule(sessionData) === true) {
              questsUpdated = true;
              bonusXP += quest.reward;
              newlyCompleted.push(quest);
              return { ...quest, completed: true };
            }
            return quest;
          });

          if (questsUpdated) {
            localStorage.setItem('daily_quests', JSON.stringify(updatedQuests));
            
            const savedData = JSON.parse(localStorage.getItem('daily_quests_data') || '{}');
            savedData.quests = updatedQuests;
            localStorage.setItem('daily_quests_data', JSON.stringify(savedData));
            
            window.dispatchEvent(new Event('quest_update'));
            
            if (newlyCompleted.length > 0) {
              setToastQuest(newlyCompleted[0]); 
              setTimeout(() => setToastQuest(null), 5000); 
            }
          }
        } catch (questError) {
           console.error("Erro ao auditar missões:", questError);
        }
      }

      await finishWorkout(bonusXP);
      
    } catch (error) {
       console.error("Falha Crítica ao salvar o treino:", error);
       alert("Erro ao salvar operação. Verifique sua conexão e tente novamente.");
    } finally {
       setIsFinishing(false); 
    }
  };

  // 🔥 FUNÇÕES DE CONTROLE DE MODO DE COMBATE
  const handleStartCombat = () => {
      setIsCombatMode(true);
      // Opcional: já inicia o cronômetro automaticamente se quiser!
      if (!workoutTimer.isRunning) {
          actions.toggleWorkoutTimer();
      }
  };

  const handleAbortCombat = () => {
      setIsCombatMode(false);
      // Pausa o cronômetro, mas não reseta o progresso ainda (para caso de clique acidental)
      if (workoutTimer.isRunning) {
          actions.toggleWorkoutTimer();
      }
  };

  return (
    <>
      <ShareCard cardRef={cardRef} stats={todayStats} bossName="BOSS" theme={theme} />

      <main className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28 relative">
        
        <WorkoutHeader 
          selectedDate={selectedDate} 
          setSelectedDate={setSelectedDate}
          isCalendarOpen={isCalendarOpen} 
          setIsCalendarOpen={setIsCalendarOpen}
          workoutTimer={workoutTimer} 
          toggleWorkoutTimer={actions.toggleWorkoutTimer} 
          resetWorkoutTimer={actions.resetWorkoutTimer}
          isTutorialDay={isTutorialDay}
        />

        <BossSection 
          currentWorkout={currentWorkout} 
          todayVolume={todayStats.volume} 
          history={history} 
          selectedDate={selectedDate} 
          activeDay={activeDay} 
        />

        {/* NAVEGAÇÃO ENTRE PROTOCOLOS - ESCONDIDA NO MODO COMBATE */}
        {!isCombatMode && (
          <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl shadow-sm">
            <button onClick={handlePrevDay} className="p-3 text-primary active:scale-90 transition-all">
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <span className="text-[8px] font-black text-secondary tracking-widest uppercase block opacity-60">PROTOCOLO SELECIONADO</span>
              <h2 className="text-lg font-black text-main dark:text-white uppercase tracking-tighter">
                {currentWorkout?.title || 'DESCANSO'}
              </h2>
            </div>
            <button onClick={handleNextDay} className="p-3 text-primary active:scale-90 transition-all">
              <ChevronRight size={24} />
            </button>
          </div>
        )}

        {/* MODO PREVIEW (RECONHECIMENTO) */}
        {!isCombatMode && !isTutorialDay && currentWorkout?.exercises?.length > 0 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-card dark:bg-[#050505] border border-border p-5 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-black text-[#00f3ff] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldAlert size={16} /> Resumo Operacional
                    </h3>
                    <ul className="space-y-2 mb-6">
                        {currentWorkout.exercises.map((ex, idx) => (
                            <li key={idx} className="flex items-center justify-between border-b border-border/50 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                                <span className="text-[12px] font-bold text-main dark:text-white uppercase tracking-wider">{ex.name}</span>
                                <span className="text-[12px] font-bold text-muted">{ex.sets} séries</span>
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={handleStartCombat}
                        className="w-full bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30 py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] hover:bg-[#00f3ff]/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                    >
                        <Play size={20} className="fill-[#00f3ff]" /> INICIAR COMBATE
                    </button>
                </div>
            </div>
        )}

        {/* CABEÇALHO DO MODO COMBATE */}
        {isCombatMode && (
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Combate Ativo</span>
                </div>
                <button 
                    onClick={handleAbortCombat}
                    className="text-[9px] font-bold text-muted uppercase hover:text-main dark:hover:text-white underline underline-offset-4 decoration-dashed transition-colors"
                >
                    Abortar Missão
                </button>
            </div>
        )}

        {/* LISTA DE EXERCÍCIOS (MODO DE COMBATE) */}
        {(isCombatMode || isTutorialDay) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {currentWorkout?.exercises?.map((ex, i) => {
                const id = `${selectedDate}-${activeDay}-${i}`;
                return (
                <ExerciseCard 
                    key={id} 
                    id={id}
                    ex={ex} 
                    progress={progress} 
                    history={history} 
                    toggleCheck={actions.toggleCheck}
                    updateSetData={actions.updateSetData} 
                    updateSessionSets={actions.updateSessionSets} 
                    onSwap={actions.onSwap} 
                    toggleSetComplete={actions.toggleSetComplete}
                    shakingRow={null}
                />
                );
            })}
            </div>
        )}

        {/* NOTAS E FINALIZAÇÃO (SÓ APARECE NO MODO COMBATE) */}
        {(!isTutorialDay && isCombatMode) ? (
          <div className="space-y-4 pt-4 px-1 animate-in fade-in duration-500">
            <textarea 
              placeholder="Relatório de danos (anotações)..." 
              className="w-full bg-input border border-border rounded-xl p-4 text-main dark:text-white font-bold outline-none focus:border-[#00f3ff]/50 placeholder:text-muted/50 transition-all focus:shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
              value={sessionNote} 
              onChange={e => setSessionNote(e.target.value)} 
            />

            <button 
              onClick={handleFinishWorkout} 
              disabled={isFinishing}
              className="group relative w-full bg-card dark:bg-[#050505] py-5 px-5 border border-border dark:border-[#00f3ff]/20 flex items-center justify-between transition-all duration-300 overflow-hidden active:scale-[0.96] shadow-lg dark:shadow-[0_0_10px_rgba(0,243,255,0.05)] active:shadow-[0_0_20px_rgba(0,243,255,0.4)] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff]/5 via-transparent to-[#ff00ff]/5 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.8)] opacity-90"></div>

              <div className="flex items-center gap-2 relative z-10">
                <div className="w-2 h-2 bg-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.8)] skew-x-[-15deg] animate-ping"></div>
                <span className="text-[9px] text-muted dark:text-[#00f3ff]/60 font-mono font-black tracking-widest uppercase block">SYS.OPT</span>
              </div>

              <span className="font-sans font-black text-main dark:text-white uppercase tracking-[0.3em] text-[15px] md:text-lg drop-shadow-[0_0_5px_rgba(0,243,255,0.3)] relative z-10 group-active:text-[#00f3ff] transition-colors flex items-center gap-2">
                {isFinishing ? <><Loader2 size={20} className="animate-spin text-[#00f3ff]" /> SALVANDO</> : 'Finalizar Operação'}
              </span>

              <div className="flex items-center gap-2 relative z-10">
                <span className="text-[9px] text-muted dark:text-[#ff00ff]/60 font-mono font-black tracking-widest uppercase block">LVL.ON</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-4 bg-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.6)] skew-x-[-15deg]"></div>
                  <div className="w-1.5 h-4 bg-[#ff00ff] shadow-[0_0_8px_rgba(255,0,255,0.6)] skew-x-[-15deg] animate-pulse"></div>
                </div>
              </div>
            </button>
          </div>
        ) : null}
      </main>

      {/* 🔥 TOAST CYBERPUNK DE MISSÃO CUMPRIDA */}
      {toastQuest && createPortal(
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] animate-in slide-in-from-top-10 fade-in duration-500">
          <div className="bg-card/95 backdrop-blur-md border-l-4 border-secondary border-y border-r border-border p-4 rounded-r-2xl shadow-[0_10px_40px_rgba(var(--secondary),0.3)] flex items-center gap-4 min-w-[280px] max-w-sm relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px] opacity-50"></div>
            
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center border-2 border-secondary/50 shrink-0 relative z-10 shadow-[0_0_15px_rgba(var(--secondary),0.4)]">
              <Trophy size={24} className="text-secondary drop-shadow-md animate-bounce" />
            </div>
            
            <div className="flex-1 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-0.5">Missão Cumprida</h4>
              <p className="text-sm font-bold text-main dark:text-white leading-tight">{toastQuest.title}</p>
              <span className="text-[11px] font-black text-primary mt-1.5 block tracking-widest drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
                +{toastQuest.reward} XP
              </span>
            </div>
            
            <button 
              onClick={() => setToastQuest(null)} 
              className="text-muted hover:text-red-500 transition-colors p-1 relative z-10 self-start mt-[-4px] mr-[-4px]"
            >
              <X size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default WorkoutView;