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

        {/* Navegação entre protocolos - Melhorada para modo claro/escuro */}
        <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl shadow-sm">
          <button onClick={handlePrevDay} className="p-3 text-primary hover:bg-primary/10 rounded-xl active:scale-90 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            {/* Trocado opacity-60 por text-main/60 para não afetar contraste brutalmente */}
            <span className="text-[8px] font-black text-secondary/80 tracking-widest uppercase block">PROTOCOLO ATIVO</span>
            <h2 className="text-lg font-black text-main uppercase tracking-tighter">
              {currentWorkout?.title || 'DESCANSO'}
            </h2>
          </div>
          <button onClick={handleNextDay} className="p-3 text-primary hover:bg-primary/10 rounded-xl active:scale-90 transition-all">
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

        {/* 🔥 ESCONDE O BOTÃO DE FINALIZAR SE FOR TUTORIAL */}
        {!isTutorialDay ? (
          <div className="space-y-4 pt-4">
            {/* Textarea Padrão Ouro: Placeholder ajustado e Focus Ring */}
            <textarea 
              placeholder="Relatório de danos..." 
              className="w-full bg-input border border-border rounded-xl p-4 text-main font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-main/30 transition-all shadow-sm min-h-[100px]" 
              value={sessionNote} 
              onChange={e => setSessionNote(e.target.value)} 
            />
            
            {/* Botão Finalizar Missão: Adicionado Neon Glow tático */}
            <button 
              onClick={finishWorkout} 
              className="w-full bg-gradient-to-r from-primary to-secondary py-4 rounded-xl font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)]"
            >
              <Star size={18} fill="white" className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" /> 
              FINALIZAR MISSÃO
            </button>
          </div>
        ) : (
          /* Tutorial Box com borda reforçada para modo claro */
          <div className="mt-8 p-4 border-2 border-dashed border-primary/50 bg-primary/5 rounded-xl text-center animate-pulse">
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