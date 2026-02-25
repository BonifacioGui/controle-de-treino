import React, { useState, useMemo, useRef } from 'react';
import { Scroll, Zap, Share2, Star, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { toPng } from 'html-to-image'; 

import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import ShareCard from './ShareCard';
import RestTimer from './RestTimer';
import { formatTime, safeParseFloat } from '../utils/workoutUtils';

const WorkoutView = ({ 
  activeDay, setActiveDay, workoutData, selectedDate, setSelectedDate, 
  progress, toggleCheck, updateSetData, 
  updateSessionSets, sessionNote, setSessionNote, finishWorkout,
  history, timerState, closeTimer,
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer,
  actions // 🔥 Recebendo as ações do hook
}) => {

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [restTimerConfig, setRestTimerConfig] = useState({ isOpen: false, duration: 60 });
  const [isSharing, setIsSharing] = useState(false);
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
          // BUSQUE AS FUNÇÕES DE DENTRO DE ACTIONS:
          toggleWorkoutTimer={actions.toggleWorkoutTimer} 
          resetWorkoutTimer={actions.resetWorkoutTimer}
        />

        <BossSection currentWorkout={currentWorkout} todayVolume={todayStats.volume} history={history} selectedDate={selectedDate} activeDay={activeDay} />

        {/* Navegação entre protocolos */}
        <div className="flex items-center justify-between bg-card border border-border p-2 rounded-2xl shadow-sm">
          <button onClick={handlePrevDay} className="p-3 text-primary active:scale-90 transition-all"><ChevronLeft size={24} /></button>
          <div className="text-center">
            <span className="text-[8px] font-black text-secondary tracking-widest uppercase block opacity-60">PROTOCOLO ATIVO</span>
            <h2 className="text-lg font-black text-main italic uppercase tracking-tighter">
              {currentWorkout?.title || 'DESCANSO'}
            </h2>
          </div>
          <button onClick={handleNextDay} className="p-3 text-primary active:scale-90 transition-all"><ChevronRight size={24} /></button>
        </div>

        {/* Dentro do WorkoutView.jsx */}
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
                updateSessionSets={actions.updateSessionSets} // Pega do actions
                onSwap={actions.onSwap} // 🔥 CORRIGIDO: Era swapExercise, agora é onSwap
                toggleSetComplete={actions.toggleSetComplete} // 🔥 CORRIGIDO: Use a do Hook
                shakingRow={null}
              />
            );
          })}
        </div>

        <div className="space-y-4 pt-4">
          <textarea placeholder="Relatório de danos..." className="w-full bg-input border border-border rounded-xl p-4 text-main font-bold outline-none focus:border-primary/50" value={sessionNote} onChange={e => setSessionNote(e.target.value)} />
          <button onClick={finishWorkout} className="w-full bg-gradient-to-r from-primary to-secondary py-4 rounded-xl font-black text-white shadow-xl uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95">
            <Star size={18} fill="white" /> FINALIZAR MISSÃO
          </button>
        </div>
      </main>

      <div className="relative z-[300]">
        {timerState?.active && <RestTimer initialSeconds={timerState.seconds} onClose={closeTimer} />}
        {restTimerConfig.isOpen && <RestTimer initialSeconds={restTimerConfig.duration} onClose={() => setRestTimerConfig(p => ({ ...p, isOpen: false }))} />}
      </div>
    </>
  );
};

export default WorkoutView;