import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Scroll, Zap, Share2, Star } from 'lucide-react'; 
import { toPng } from 'html-to-image'; 

// Componentes Modularizados
import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import ShareCard from './ShareCard';
import RestTimer from './RestTimer';

// Utilitários
import { formatTime, parseDateTimestamp, isSameExercise, safeParseFloat } from '../utils/workoutUtils';
import { DAILY_QUESTS_POOL } from '../utils/rpgSystem';

const WorkoutView = ({ 
  activeDay, setActiveDay, workoutData, selectedDate, setSelectedDate, 
  weightInput, setWeightInput, waistInput, setWaistInput, 
  latestStats, progress, toggleCheck, updateSetData, 
  updateSessionSets, sessionNote, setSessionNote, finishWorkout,
  bodyHistory, history, saveBiometrics,
  timerState, closeTimer,
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer
}) => {

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [restTimerConfig, setRestTimerConfig] = useState({ isOpen: false, duration: 60 });
  const [questNotification, setQuestNotification] = useState(null); 
  const [isSharing, setIsSharing] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [shakingRow, setShakingRow] = useState(null);
  const cardRef = useRef(null);

  const days = Object.keys(workoutData || {}); 
  const currentWorkout = workoutData[activeDay];

  // Estatísticas do dia para o Share Card
  const todayStats = useMemo(() => {
    let vol = 0; let prs = 0;
    if (!currentWorkout) return { volume: 0, prs: 0, duration: '00:00' };

    currentWorkout.exercises.forEach((ex, idx) => {
        const id = `${selectedDate}-${activeDay}-${idx}`;
        const exProgress = progress[id];
        if (exProgress?.sets) {
            exProgress.sets.forEach(s => { if (s.completed) vol += (safeParseFloat(s.weight) * safeParseFloat(s.reps)); });
            const exerciseHistory = history?.flatMap(s => s.exercises).filter(e => isSameExercise(ex.name, e.name)) || [];
            const best = Math.max(...exerciseHistory.flatMap(e => e.sets?.map(s => safeParseFloat(s.weight)) || [0]), 0);
            if (exProgress.sets.some(s => safeParseFloat(s.weight) > best && best > 0)) prs++;
        }
    });
    return { volume: Math.round(vol), prs, duration: formatTime(workoutTimer.elapsed) };
  }, [currentWorkout, progress, selectedDate, activeDay, history, workoutTimer.elapsed]);

  // Lógica de Missões Diárias
  const checkQuests = useCallback(() => {
    if (!currentWorkout) return;
    const tempSession = {
        exercises: currentWorkout.exercises.map((ex, i) => ({
            name: ex.name, done: progress[`${selectedDate}-${activeDay}-${i}`]?.done || false,
            sets: (progress[`${selectedDate}-${activeDay}-${i}`]?.sets || []).filter(s => s.completed)
        })),
        note: sessionNote
    };
    const storedQuests = JSON.parse(localStorage.getItem('daily_quests') || '[]');
    let hasUpdates = false;
    const updatedQuests = storedQuests.map(quest => {
        if (quest.completed) return quest; 
        const questRule = DAILY_QUESTS_POOL.find(q => q.id === quest.id);
        if (questRule && questRule.check(tempSession)) {
            hasUpdates = true; setQuestNotification(quest.title); 
            setTimeout(() => setQuestNotification(null), 3000);
            return { ...quest, completed: true };
        }
        return quest;
    });
    if (hasUpdates) { localStorage.setItem('daily_quests', JSON.stringify(updatedQuests)); window.dispatchEvent(new Event('storage')); }
  }, [currentWorkout, progress, selectedDate, activeDay, sessionNote]);

  useEffect(() => { const timer = setTimeout(checkQuests, 500); return () => clearTimeout(timer); }, [progress, checkQuests]);

  const toggleSetComplete = (id, setIndex) => {
    const uniqueKey = `${id}-${setIndex}`;
    setShakingRow(uniqueKey); setTimeout(() => setShakingRow(null), 300);
    const currentStatus = progress[id]?.sets?.[setIndex]?.completed || false;
    if (!currentStatus) { 
        const now = Date.now();
        if (now - lastCheckTime < 60000) setCombo(prev => prev + 1); else setCombo(1);
        setLastCheckTime(now);
    }
    updateSetData(id, setIndex, 'completed', !currentStatus);
    if (!currentStatus) setRestTimerConfig(prev => ({ ...prev, isOpen: true })); 
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'meu-treino.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'Projeto Bomba', text: 'Missão Cumprida!' });
      } else {
        const link = document.createElement('a'); link.download = 'treino.png'; link.href = dataUrl; link.click();
      }
    } catch (err) { console.error(err); } finally { setIsSharing(false); }
  };

  return (
    <>
      <ShareCard cardRef={cardRef} stats={todayStats} bossName="BOSS" streak={0} theme={document.documentElement.getAttribute('data-theme')} />

      <main className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-28 relative w-full z-0">
        
        {/* HEADER MODULARIZADO */}
        <WorkoutHeader 
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          isCalendarOpen={isCalendarOpen} setIsCalendarOpen={setIsCalendarOpen}
          workoutTimer={workoutTimer} toggleWorkoutTimer={toggleWorkoutTimer} resetWorkoutTimer={resetWorkoutTimer}
          weightInput={weightInput} setWeightInput={setWeightInput}
          waistInput={waistInput} setWaistInput={setWaistInput}
          latestStats={latestStats} bodyHistory={bodyHistory} saveBiometrics={saveBiometrics}
        />

        {/* BOSS MODULARIZADO */}
        <BossSection 
          currentWorkout={currentWorkout} todayVolume={todayStats.volume} 
          history={history} selectedDate={selectedDate} activeDay={activeDay}
        />

        {/* NAVEGAÇÃO DE TREINOS */}
        <div className="flex items-center justify-between gap-2 px-1">
          <button onClick={() => setActiveDay(days[(days.indexOf(activeDay) - 1 + days.length) % days.length])} className="p-2 rounded-lg bg-card border border-border hover:text-primary transition-all">←</button>
          <div className="text-center">
            <span className="text-[7px] font-black text-secondary tracking-[0.4em] uppercase block">PROTOCOLO</span>
            <h2 className="text-lg font-black text-main uppercase italic">{currentWorkout?.title || 'Treino'}</h2>
          </div>
          <button onClick={() => setActiveDay(days[(days.indexOf(activeDay) + 1) % days.length])} className="p-2 rounded-lg bg-card border border-border hover:text-primary transition-all">→</button>
        </div>

        {/* LISTA DE CARDS (MODULARIZADO) */}
        <div className="space-y-4">
          {currentWorkout?.exercises?.map((ex, i) => (
            <ExerciseCard 
              key={`${selectedDate}-${activeDay}-${i}`} id={`${selectedDate}-${activeDay}-${i}`}
              ex={ex} progress={progress} history={history} toggleCheck={toggleCheck}
              updateSetData={updateSetData} updateSessionSets={updateSessionSets}
              toggleSetComplete={toggleSetComplete} shakingRow={shakingRow}
            />
          ))}
        </div>
        
        {/* COMBO E NOTIFICAÇÕES */}
        {combo > 1 && (
          <div className="fixed bottom-24 right-4 z-50 animate-in slide-in-from-right">
            <div className="text-4xl font-black italic text-yellow-400 drop-shadow-md">{combo}x <Zap className="inline mb-2"/></div>
          </div>
        )}

        {questNotification && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
            <div className="bg-yellow-500 text-black px-6 py-3 rounded-full font-black flex items-center gap-3 shadow-lg">
              <Scroll size={20}/> <div><span className="text-[8px] uppercase block">Missão Cumprida</span>{questNotification}</div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="space-y-4 pt-4">
          <textarea placeholder="Relatório de danos..." className="w-full bg-card border border-border rounded-xl p-3 h-24 outline-none focus:border-primary/50 text-main" value={sessionNote} onChange={(e) => setSessionNote(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleShare} disabled={isSharing} className="flex-1 rounded-xl bg-card border-2 border-primary text-primary py-4 font-black flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
              {isSharing ? <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full"/> : <Share2 size={18}/>} RELATÓRIO
            </button>
            <button onClick={finishWorkout} className="flex-[2] rounded-xl bg-gradient-to-r from-primary to-secondary py-4 font-black text-white shadow-lg active:scale-95 uppercase tracking-widest">
              <Star size={14} className="inline mr-2 fill-white"/> Finalizar Missão
            </button>
          </div>
        </div>
      </main>

      {/* TIMERS */}
      <div className="relative z-[300]">
        {timerState?.active && <RestTimer initialSeconds={timerState.seconds} onClose={closeTimer} />}
        {restTimerConfig.isOpen && <RestTimer initialSeconds={restTimerConfig.duration} onClose={() => setRestTimerConfig(prev => ({ ...prev, isOpen: false }))} />}
      </div>
    </>
  );
};

export default WorkoutView;