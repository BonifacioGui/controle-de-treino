import React, { useState, useMemo, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'; 

import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import ShareCard from './ShareCard';
import { formatTime, safeParseFloat } from '../utils/workoutUtils';

const WorkoutView = ({ 
  activeDay, setActiveDay, workoutData, selectedDate, setSelectedDate, 
  progress, sessionNote, setSessionNote, finishWorkout, history,
  workoutTimer, actions 
}) => {

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const cardRef = useRef(null);

  const days = useMemo(() => Object.keys(workoutData || {}), [workoutData]); 
  const currentWorkout = workoutData[activeDay];

  // 🔁 NAVEGAÇÃO MANUAL (Setas): Muda apenas o protocolo, NÃO mexe na data.
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

  return (
    <>
      <ShareCard cardRef={cardRef} stats={todayStats} bossName="BOSS" theme={document.documentElement.getAttribute('data-theme')} />

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

        <BossSection currentWorkout={currentWorkout} todayVolume={todayStats.volume} history={history} selectedDate={selectedDate} activeDay={activeDay} />

        {/* Navegação entre protocolos */}
        <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl shadow-sm">
          <button onClick={handlePrevDay} className="p-3 text-primary active:scale-90 transition-all"><ChevronLeft size={24} /></button>
          <div className="text-center">
            <span className="text-[8px] font-black text-secondary tracking-widest uppercase block opacity-60">PROTOCOLO ATIVO</span>
            <h2 className="text-lg font-black text-main uppercase tracking-tighter">
              {currentWorkout?.title || 'DESCANSO'}
            </h2>
          </div>
          <button onClick={handleNextDay} className="p-3 text-primary active:scale-90 transition-all"><ChevronRight size={24} /></button>
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

        {/* 🔥 ESCONDE O BOTÃO DE FINALIZAR SE FOR TUTORIAL */}
        {!isTutorialDay ? (
          <div className="space-y-4 pt-4">
            <textarea placeholder="Relatório de danos..." className="w-full bg-input border border-border rounded-xl p-4 text-main font-bold outline-none focus:border-primary/50" value={sessionNote} onChange={e => setSessionNote(e.target.value)} />
            <button 
              onClick={finishWorkout} 
              className="group relative w-full bg-[#0a0f16] py-4 px-5 border border-slate-800 flex items-center justify-between transition-all duration-300 overflow-hidden hover:border-secondary/40 hover:bg-[#0f1722] active:scale-[0.98] shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            >
              {/* Fundo Tático (Brilho que acende no hover) */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Lado Esquerdo: Indicador de Sistema */}
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-1.5 h-1.5 bg-primary opacity-80 shadow-[0_0_8px_rgba(var(--primary),0.6)] skew-x-[-15deg]"></div>
                <span className="text-[9px] text-primary/50 font-mono font-black tracking-widest hidden sm:block uppercase">SYS.OPT</span>
              </div>

              {/* Centro: Comando Principal */}
              <span className="font-sans font-black text-slate-300 uppercase tracking-[0.3em] text-sm md:text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.05)] group-hover:text-white transition-colors relative z-10">
                Finalizar Operação
              </span>

              {/* Lado Direito: Pulso de Ação */}
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-[9px] text-secondary/50 font-mono font-black tracking-widest hidden sm:block uppercase">LVL.ON</span>
                <div className="w-1.5 h-4 bg-secondary opacity-80 animate-pulse shadow-[0_0_8px_rgba(var(--secondary),0.6)] skew-x-[-15deg]"></div>
              </div>

              {/* Linha de Energia Inferior (Expande no Hover) */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-secondary group-hover:w-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--secondary),0.8)]"></div>
            </button>
          </div>
        ) : (
          <div className="mt-8 p-4 border-2 border-dashed border-primary/30 rounded-xl text-center animate-pulse">
            <span className="text-xs font-black uppercase text-primary tracking-widest">
              Aguardando configuração do recruta...
            </span>
          </div>
        )}
      </main>
    </>
  );
};

export default WorkoutView;