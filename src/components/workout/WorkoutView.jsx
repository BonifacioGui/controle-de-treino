import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, Trophy, X, Play, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'; 

import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import ShareCard from '../export/ShareCard';
import { formatTime, safeParseFloat, isSameExercise } from '../../utils/workoutUtils';
import { QUEST_RULES } from '../../utils/questRules';

const WorkoutView = ({ 
  activeDay, setActiveDay, workoutData, selectedDate, setSelectedDate, 
  progress, sessionNote, setSessionNote, finishWorkout, history,
  workoutTimer, actions 
}) => {

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // ESTADOS DE COMBATE E SEGURANÇA
  const [isCombatMode, setIsCombatMode] = useState(false);
  const [toastQuest, setToastQuest] = useState(null);

  // O GATEKEEPER DAS SETAS (Bloqueio do Modal)
  const [pendingDay, setPendingDay] = useState(null);
  const [pendingDaysSince, setPendingDaysSince] = useState(null);

  const cardRef = useRef(null);
  const days = useMemo(() => Object.keys(workoutData || {}), [workoutData]); 
  const currentWorkout = workoutData[activeDay];
  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';

  // LÓGICA DE TEMPO 1: Verifica se já foi feito HOJE
  const isDayCompleted = useMemo(() => {
    if (!currentWorkout?.exercises) return false;
    return !!progress[`${selectedDate}-${activeDay}-0`]?.done;
  }, [progress, selectedDate, activeDay, currentWorkout]);

  // LÓGICA DE TEMPO 2: FUSO HORÁRIO CORRIGIDO
  const daysSinceLast = useMemo(() => {
    const historyForDay = history?.filter(h => h.dayName === activeDay) || [];
    if (historyForDay.length > 0) {
      const parts = historyForDay[0].date.split('/');
      if (parts.length === 3) {
        const lastDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        const selParts = selectedDate.split('-');
        const currentDate = new Date(parseInt(selParts[0], 10), parseInt(selParts[1], 10) - 1, parseInt(selParts[2], 10));
        
        return Math.round(Math.abs(currentDate - lastDate) / (1000 * 60 * 60 * 24));
      }
    }
    return null;
  }, [activeDay, history, selectedDate]);

  // LIGAR O CRONÓMETRO ATIVA O COMBATE AUTOMATICAMENTE
  useEffect(() => {
    if (!workoutTimer.isRunning) {
        setIsCombatMode(false);
    } else {
        setIsCombatMode(true);
    }
  }, [activeDay, workoutTimer.isRunning]);

  // A TRAVA DE NAVEGAÇÃO DAS SETAS
  const requestDayChange = (targetDay) => {
    const historyForTarget = history?.filter(h => h.dayName === targetDay) || [];
    if (historyForTarget.length > 0) {
      const parts = historyForTarget[0].date.split('/');
      if (parts.length === 3) {
        const lastDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        const selParts = selectedDate.split('-');
        const currentDate = new Date(parseInt(selParts[0], 10), parseInt(selParts[1], 10) - 1, parseInt(selParts[2], 10));
        
        const diffDays = Math.round(Math.abs(currentDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 3) {
          setPendingDay(targetDay);
          setPendingDaysSince(diffDays);
          return; 
        }
      }
    }
    setActiveDay(targetDay);
  };

  const handlePrevDay = (e) => {
    if (e) e.stopPropagation();
    const idx = days.indexOf(activeDay);
    if (idx === -1) return;
    requestDayChange(days[(idx - 1 + days.length) % days.length]);
  };

  const handleNextDay = (e) => {
    if (e) e.stopPropagation();
    const idx = days.indexOf(activeDay);
    if (idx === -1) return;
    requestDayChange(days[(idx + 1) % days.length]);
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
        
        if (exData && exData.swappedName && exData.swappedName !== ex.name) exercisesSwapped++;
        
        if (exData) {
          const isExerciseDone = !!(exData.completed || exData.done || exData.checked);

          if (exData.sets && Array.isArray(exData.sets)) {
            totalSets += exData.sets.length;
            const cSets = exData.sets.filter(s => s.completed === true || s.done === true || s.checked === true || isExerciseDone).length;
            completedSets += cSets;

            const exerciseHistory = (history || [])
              .flatMap(s => s.exercises.map(e => ({...e, date: s.date})))
              .filter(e => e.done !== false && isSameExercise(displayName, e.name));

            const exercisePR = exerciseHistory.reduce((max, e) => {
               const validWeights = e.sets?.map(s => parseFloat(String(s.weight).replace(',', '.')) || 0).filter(w => w > 0) || [];
               return Math.max(max, validWeights.length > 0 ? Math.max(...validWeights) : 0);
            }, 0);

            const todayMax = exData.sets.reduce((max, s) => Math.max(max, parseFloat(String(s.weight).replace(',', '.')) || 0), 0);
            if (todayMax > exercisePR && exercisePR > 0) prsBroken++;
          } else if (isExerciseDone) {
            const estimatedSets = ex.sets ? (parseInt(ex.sets) || 3) : 3;
            totalSets += estimatedSets;
            completedSets += estimatedSets;
          }
        }
      });

      if (completedSets === 0) {
        alert("Sessão abortada: Nenhuma série foi registada.");
        setIsFinishing(false);
        return;
      }

      const sessionData = {
        totalVolume: todayStats.volume,
        duration: workoutTimer?.elapsed || 0,
        hasNote: !!sessionNote && sessionNote.trim().length > 0, 
        totalSets, completedSets, exercisesSwapped, prsBroken, finished: true
      };

      let bonusXP = 0;
      const isTodayStr = new Date().toISOString().split('T')[0];

      if (selectedDate === isTodayStr) {
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
       console.error("Falha Crítica ao guardar o treino:", error);
       alert("Erro ao guardar operação. Verifique a sua ligação e tente novamente.");
    } finally {
       setIsFinishing(false); 
    }
  };

  const handleAbortCombat = () => {
      setIsCombatMode(false);
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

        {/* NAVEGAÇÃO ENTRE PROTOCOLOS E TAGS */}
        {!isCombatMode && (
          <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl shadow-sm">
            <button onClick={handlePrevDay} className="p-3 text-primary active:scale-90 transition-all">
              <ChevronLeft size={24} />
            </button>
            
            <div className="text-center flex flex-col items-center">
              <span className="text-[8px] font-black text-secondary tracking-widest uppercase block opacity-60">
                PROTOCOLO SELECIONADO
              </span>
              
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-lg font-black text-main uppercase tracking-tighter">
                  {currentWorkout?.title || 'DESCANSO'}
                </h2>
                
                {daysSinceLast !== null && daysSinceLast > 0 && !isDayCompleted && (
                  <span className="bg-input border border-border text-[8px] font-bold text-muted px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Há {daysSinceLast} {daysSinceLast === 1 ? 'dia' : 'dias'}
                  </span>
                )}
                
                {isDayCompleted && (
                  <span className="bg-success/10 border border-success/30 text-[8px] font-black text-success px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> Concluído
                  </span>
                )}
              </div>
            </div>

            <button onClick={handleNextDay} className="p-3 text-primary active:scale-90 transition-all">
              <ChevronRight size={24} />
            </button>
          </div>
        )}

        {/* RESUMO OPERACIONAL - TOTALMENTE LIMPO, SEM BOTÕES */}
        {!isCombatMode && !isTutorialDay && currentWorkout?.exercises?.length > 0 && !isDayCompleted && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldAlert size={16} /> Resumo Operacional
                    </h3>
                    <ul className="space-y-2">
                        {currentWorkout.exercises.map((ex, idx) => (
                            <li key={idx} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                <span className="text-[12px] font-bold text-main uppercase tracking-wider">{ex.name}</span>
                                <span className="text-[12px] font-bold text-muted">{ex.sets} séries</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        {/* AVISO DE SESSÃO REGISTRADA HOJE */}
        {!isCombatMode && !isTutorialDay && isDayCompleted && (
           <div className="w-full bg-input text-muted border border-border py-4 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-widest opacity-70">
               Sessão já registada hoje
           </div>
        )}

        {/* CABEÇALHO DO MODO COMBATE (Botão Abortar) */}
        {isCombatMode && (
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Combate Ativo</span>
                </div>
                <button 
                    onClick={handleAbortCombat}
                    className="text-[9px] font-bold text-muted uppercase hover:text-main underline underline-offset-4 decoration-dashed transition-colors"
                >
                    Abortar Missão
                </button>
            </div>
        )}

        {/* LISTA DE EXERCÍCIOS (Apenas aparece quando o cronómetro roda) */}
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

        {/* NOTAS E BOTÃO DE FINALIZAR */}
        {(!isTutorialDay && isCombatMode) ? (
          <div className="space-y-4 pt-4 px-1 animate-in fade-in duration-500">
            <textarea 
              placeholder="Relatório de danos (anotações)..." 
              className="w-full bg-input border border-border rounded-xl p-4 text-main font-bold outline-none focus:border-primary/50 placeholder:text-muted/50 transition-all" 
              value={sessionNote} 
              onChange={e => setSessionNote(e.target.value)} 
            />

            <button 
              onClick={handleFinishWorkout} 
              disabled={isFinishing}
              className="group relative w-full bg-card py-5 px-5 border border-primary/20 flex items-center justify-between transition-all duration-300 overflow-hidden active:scale-[0.96] shadow-md disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-secondary to-primary opacity-90"></div>

              <div className="flex items-center gap-2 relative z-10">
                <div className="w-2 h-2 bg-primary skew-x-[-15deg] animate-ping"></div>
                <span className="text-[9px] text-muted font-mono font-black tracking-widest uppercase block">SYS.OPT</span>
              </div>

              <span className="font-sans font-black text-main uppercase tracking-[0.3em] text-[15px] md:text-lg relative z-10 group-active:text-primary transition-colors flex items-center gap-2">
                {isFinishing ? <><Loader2 size={20} className="animate-spin text-primary" /> A GUARDAR</> : 'Finalizar Operação'}
              </span>

              <div className="flex items-center gap-2 relative z-10">
                <span className="text-[9px] text-muted font-mono font-black tracking-widest uppercase block">LVL.ON</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-4 bg-secondary skew-x-[-15deg]"></div>
                  <div className="w-1.5 h-4 bg-secondary skew-x-[-15deg] animate-pulse"></div>
                </div>
              </div>
            </button>
          </div>
        ) : null}
      </main>

      {/* TOAST DA MISSÃO CUMPRIDA */}
      {toastQuest && createPortal(
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] animate-in slide-in-from-top-10 fade-in duration-500">
          <div className="bg-card/95 backdrop-blur-md border-l-4 border-secondary border-y border-r border-border p-4 rounded-r-2xl shadow-lg flex items-center gap-4 min-w-[280px] max-w-sm relative overflow-hidden">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center border-2 border-secondary/50 shrink-0 relative z-10">
              <Trophy size={24} className="text-secondary animate-bounce" />
            </div>
            
            <div className="flex-1 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-0.5">Missão Cumprida</h4>
              <p className="text-sm font-bold text-main leading-tight">{toastQuest.title}</p>
              <span className="text-[11px] font-black text-primary mt-1.5 block tracking-widest">
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

      {/* GATEKEEPER DAS SETAS - AVISO DE FADIGA */}
      {pendingDay && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-warning/50 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-4 border border-warning/30">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-sm font-black uppercase text-warning mb-2 tracking-widest">Aviso de Fadiga</h3>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              Realizou o protocolo <strong className="text-main">{pendingDay}</strong> há apenas {pendingDaysSince} dia(s). O descanso ideal para hipertrofia é de 48h a 72h.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingDay(null)} 
                className="flex-1 py-3 rounded-xl border border-border text-main font-bold uppercase text-xs hover:bg-input transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setActiveDay(pendingDay);
                  setPendingDay(null);
                }} 
                className="flex-1 py-3 rounded-xl bg-warning text-black font-black uppercase text-xs hover:opacity-90 transition-all"
              >
                Forçar Acesso
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default WorkoutView;