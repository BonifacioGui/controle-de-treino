import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, Trophy, X } from 'lucide-react'; 

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
  
  // 🔥 ESTADO DO TOAST DE RECOMPENSA
  const [toastQuest, setToastQuest] = useState(null);

  const cardRef = useRef(null);

  const days = useMemo(() => Object.keys(workoutData || {}), [workoutData]); 
  const currentWorkout = workoutData[activeDay];

  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';

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
    if (isFinishing) return; // TRAVA: Evita double-tap
    setIsFinishing(true);    
    
    let totalSets = 0;
    let completedSets = 0;
    let exercisesSwapped = 0;
    let prsBroken = 0; // 🔥 NOVA VARIÁVEL AQUI

    // 1. Coleta de dados do progresso atual e calcula PRs
    currentWorkout?.exercises?.forEach((ex, i) => {
      const id = `${selectedDate}-${activeDay}-${i}`;
      const exData = progress[id];
      const displayName = exData?.swappedName || ex.name;
      
      if (exData && exData.swappedName && exData.swappedName !== ex.name) {
        exercisesSwapped++;
      }
      if (exData && exData.sets) {
        totalSets += exData.sets.length;
        completedSets += exData.sets.filter(s => s.completed).length;

        // 🔥 AUDITORIA DE PR: O Pai agora também faz a matemática
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
      }
    });

    // 2. Monta o pacote de dados EXATO e com trava de segurança (!!)
    const sessionData = {
      totalVolume: todayStats.volume,
      duration: workoutTimer?.elapsed || 0,
      hasNote: !!sessionNote && sessionNote.trim().length > 0, 
      totalSets,
      completedSets,
      exercisesSwapped,
      prsBroken, // 🔥 AGORA A VARIÁVEL VAI NO PACOTE!
      finished: true
    };

    let bonusXP = 0;

    // 🔥 3. CORREÇÃO DE DATA: BLINDAGEM MÁXIMA
    // Lê a data independentemente do formato (DD/MM/YYYY ou YYYY-MM-DD)
    let isToday = false;
    if (selectedDate) {
      let d, m, y;
      if (selectedDate.includes('/')) {
        [d, m, y] = selectedDate.split('/');
      } else if (selectedDate.includes('-')) {
        [y, m, d] = selectedDate.split('-');
      }
      
      const today = new Date();
      // Compara apenas os números puros, ignorando zeros à esquerda e traços
      isToday = (
        parseInt(d) === today.getDate() &&
        parseInt(m) === (today.getMonth() + 1) &&
        parseInt(y) === today.getFullYear()
      );
    }

    // Só avalia missões se for o treino de HOJE.
    if (isToday) {
      const dailyQuests = JSON.parse(localStorage.getItem('daily_quests') || '[]');
      let questsUpdated = false;
      const newlyCompleted = [];

      const updatedQuests = dailyQuests.map(quest => {
        if (quest.completed) return quest;

        const checkRule = QUEST_RULES[quest.type];
        
        // Verifica se a regra existe e se o treino passou no teste
        if (checkRule && checkRule(sessionData) === true) {
          questsUpdated = true;
          bonusXP += quest.reward;
          newlyCompleted.push(quest);
          return { ...quest, completed: true };
        }
        return quest;
      });

      // 4. Atualiza o painel de quests e exibe o Toast
      if (questsUpdated) {
        localStorage.setItem('daily_quests', JSON.stringify(updatedQuests));
        
        // Sincroniza a chave duplicada para o QuestBoard ler instantaneamente
        const savedData = JSON.parse(localStorage.getItem('daily_quests_data') || '{}');
        savedData.quests = updatedQuests;
        localStorage.setItem('daily_quests_data', JSON.stringify(savedData));
        
        window.dispatchEvent(new Event('quest_update'));
        
        if (newlyCompleted.length > 0) {
          setToastQuest(newlyCompleted[0]); // Dispara o Toast animado
          setTimeout(() => setToastQuest(null), 5000); 
        }
      }
    }

    // 5. Envia UM ÚNICO sinal de finalização para o motor
    await finishWorkout(bonusXP);
    
    setIsFinishing(false); // Libera a trava
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

        {/* NAVEGAÇÃO ENTRE PROTOCOLOS */}
        <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl shadow-sm">
          <button onClick={handlePrevDay} className="p-3 text-primary active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <span className="text-[8px] font-black text-secondary tracking-widest uppercase block opacity-60">PROTOCOLO ATIVO</span>
            <h2 className="text-lg font-black text-main dark:text-white uppercase tracking-tighter">
              {currentWorkout?.title || 'DESCANSO'}
            </h2>
          </div>
          <button onClick={handleNextDay} className="p-3 text-primary active:scale-90 transition-all">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="space-y-4">
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

        {!isTutorialDay ? (
          <div className="space-y-4 pt-4 px-1">
            <textarea 
              placeholder="Relatório de danos (anotações)..." 
              className="w-full bg-input border border-border rounded-xl p-4 text-main dark:text-white font-bold outline-none focus:border-[#00f3ff]/50 placeholder:text-muted/50 transition-all focus:shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
              value={sessionNote} 
              onChange={e => setSessionNote(e.target.value)} 
            />

            {/* BOTÃO FINALIZAR CHAMA A FUNÇÃO INTEGRADA E FICA DESABILITADO DURANTE O ENVIO */}
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
        ) : (
          <div className="mt-8 p-4 border-2 border-dashed border-[#00f3ff]/30 rounded-xl text-center animate-pulse mx-1">
            <span className="text-xs font-black uppercase text-[#00f3ff] tracking-widest drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
              Aguardando configuração do recruta...
            </span>
          </div>
        )}
      </main>

      {/* 🔥 TOAST CYBERPUNK DE MISSÃO CUMPRIDA */}
      {toastQuest && createPortal(
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] animate-in slide-in-from-top-10 fade-in duration-500">
          <div 
            className="bg-card/95 backdrop-blur-md border-l-4 border-secondary border-y border-r border-border p-4 rounded-r-2xl shadow-[0_10px_40px_rgba(var(--secondary),0.3)] flex items-center gap-4 min-w-[280px] max-w-sm relative overflow-hidden"
          >
            {/* Efeito de Scanline no Toast */}
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