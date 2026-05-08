import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'; 

import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import ShareCard from '../export/ShareCard';
import { formatTime, safeParseFloat } from '../../utils/workoutUtils';
import { QUEST_RULES } from '../../utils/questSystem';

const WorkoutView = ({ 
  activeDay, setActiveDay, workoutData, selectedDate, setSelectedDate, 
  progress, sessionNote, setSessionNote, finishWorkout, history,
  workoutTimer, actions 
}) => {

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

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

    // 1. Coleta de dados do progresso atual
    currentWorkout?.exercises?.forEach((ex, i) => {
      const id = `${selectedDate}-${activeDay}-${i}`;
      const exData = progress[id];
      
      if (exData && exData.swappedName && exData.swappedName !== ex.name) {
        exercisesSwapped++;
      }
      if (exData && exData.sets) {
        totalSets += exData.sets.length;
        completedSets += exData.sets.filter(s => s.completed).length;
      }
    });

    // 2. Monta o pacote de dados exato que as missões precisam
    const sessionData = {
      totalVolume: todayStats.volume,
      duration: workoutTimer.elapsed,
      hasNote: sessionNote.trim().length > 0,
      totalSets,
      completedSets,
      exercisesSwapped,
      finished: true
    };

    // 3. Valida as missões e captura a recompensa
    const dailyQuests = JSON.parse(localStorage.getItem('daily_quests') || '[]');
    let questsUpdated = false;
    let bonusXP = 0;

    const updatedQuests = dailyQuests.map(quest => {
      if (quest.completed) return quest;

      const checkRule = QUEST_RULES[quest.type];
      
      if (typeof checkRule === 'function' && checkRule(sessionData) === true) {
        questsUpdated = true;
        bonusXP += quest.reward;
        return { ...quest, completed: true };
      }
      return quest;
    });

    // 4. Atualiza o painel de quests caso o usuário tenha cumprido alguma
    if (questsUpdated) {
      localStorage.setItem('daily_quests', JSON.stringify(updatedQuests));
      window.dispatchEvent(new Event('quest_update'));
    }

    // 5. Envia UM ÚNICO sinal de finalização para o useWorkout.js
    await finishWorkout(bonusXP);
    
    setIsFinishing(false); // Libera a trava
  };

  return (
    <>
      <ShareCard cardRef={cardRef} stats={todayStats} bossName="BOSS" theme={theme} />

      <main className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-28">
        
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
    </>
  );
};

export default WorkoutView;