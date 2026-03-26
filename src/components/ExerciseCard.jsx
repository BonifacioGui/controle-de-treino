import React from 'react';
import { CheckCircle2, Ghost, Target, Zap, Sword, Circle, Trophy, RefreshCcw } from 'lucide-react';
import { safeParseFloat, calculate1RM, getSmartSuggestion, isSameExercise } from '../utils/workoutUtils';

const ExerciseCard = ({
  ex, id, progress, history, toggleCheck, updateSetData, updateSessionSets, toggleSetComplete, shakingRow,
  onSwap
}) => {
  const isDone = progress[id]?.done;
  const isTimeBased = ex.sets.toLowerCase().includes('min') || ex.sets.toLowerCase().includes('seg') || ex.sets.toLowerCase().includes('s') || !ex.sets.includes('x');
  const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

  const isTutorial = ex.sets === "-x-" || ex.sets === "-";
  const displayName = progress[id]?.swappedName || ex.name;

  const exerciseHistory = (history || [])
    .flatMap(s => s.exercises.map(e => ({...e, date: s.date})))
    .filter(e => isSameExercise(displayName, e.name));

  const exercisePR = exerciseHistory.reduce((max, e) => {
      const sessionMax = Math.max(...(e.sets?.map(s => safeParseFloat(s.weight)) || [0]));
      return Math.max(max, sessionMax);
  }, 0);
  
  const lastWorkoutEntry = [...exerciseHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .find(entry => entry.sets && entry.sets.some(s => safeParseFloat(s.weight) > 0));
  
  const lastWeight = lastWorkoutEntry ? Math.max(...(lastWorkoutEntry.sets?.map(s => safeParseFloat(s.weight)) || [0])) : 0;
  const isBreakingPR = (progress[id]?.sets || []).some(s => safeParseFloat(s.weight) > exercisePR && exercisePR > 0);

  const handleSwap = () => {
    if (!ex.alternatives || ex.alternatives.length === 0) return;
    const allOptions = [ex.name, ...ex.alternatives];
    const currentIndex = allOptions.indexOf(displayName);
    const nextIndex = (currentIndex + 1) % allOptions.length;
    onSwap(id, allOptions[nextIndex]);
  };

  return (
    // 🔥 MUDANÇA AQUI: Removido hover:bg-input/50. Adicionado hover:shadow-[...]
    <div className={`p-4 rounded-xl border-y border-r border-l-4 transition-all duration-500 relative overflow-hidden ${
      isBreakingPR
        ? 'border-l-amber-500 border-y-amber-500/20 border-r-amber-500/20 bg-amber-500/5'
        : isDone
          ? 'border-l-primary border-y-primary/20 border-r-primary/20 bg-primary/10 opacity-95'
          : 'bg-card border-l-border border-y-border/50 border-r-border/50 hover:border-l-secondary hover:shadow-[inset_4px_0_0_0_rgba(var(),0.5)]'
    }`}>
      
      {isDone && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-2 border--secondary/10 text-primary/10 font-black text-5xl uppercase pointer-events-none z-0">OK</div>)}
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${isBreakingPR ? 'text-amber-500' : isDone ? 'text-primary' : 'text-main'}`}>
              {displayName}
              {isBreakingPR && (
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/50 px-1.5 py-0.5 rounded-md animate-bounce shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                  <Trophy size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">NEW PR</span>
                </div>
              )}
            </h3>

            {ex.alternatives && ex.alternatives.length > 0 && !isDone && !isTutorial && (
              <button 
                onClick={handleSwap}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-input border border-border text-[11px] font-black text-muted hover:text-secondary hover:border-secondary transition-all active:scale-90 shadow-inner"
                title="Trocar por alternativa"
              >
                <RefreshCcw size={11} />
                TROCAR
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            {exercisePR > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 border border-amber-600 text-[10px] font-black font-mono text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <Trophy size={12} className="fill-black/50 stroke-black" />
                <span className="tracking-widest">PR: {exercisePR}KG</span>
              </div>
            )}

            {lastWeight > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-400">
                <Ghost size={10} />
                <span>ÚLTIMA: {lastWeight}kg</span>
              </div>
            )}

            {exercisePR > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[9px] font-mono text-purple-400">
                <Zap size={10} />
                <span>1RM: {Math.round(exercisePR * 1.33)}kg</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted font-bold uppercase mt-2.5 tracking-wide">{ex.note}</p>
        </div>

        {!isTutorial && (
          <button onClick={() => toggleCheck(id)} className={`ml-3 p-2.5 rounded-full transition-all border ${isDone ? 'border-primary text-primary bg-transparent' : 'border-border text-muted hover:text-white hover:border-white/50 bg-card'}`}>
            <CheckCircle2 size={26} />
          </button>
        )}
      </div>
      
      {!isTutorial && (
        <div className="space-y-3.5 relative z-10">
          <div className="flex items-center gap-3 bg-input p-2.5 rounded-lg border border-border h-12 shadow-inner">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isTimeBased ? 'Tempo Total' : 'Séries'}</span>
            <input
              type="text"
              inputMode={isTimeBased ? "text" : "numeric"}
              className="text-primary font-black  outline-none w-11 text-center text-x transition-colors placeholder:text-primary/20"
              style={{ backgroundColor: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '3px solid rgba(0,255,255,.6)', borderRadius: 0, boxShadow: 'none' }}
              value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")}
              onChange={(e) => updateSessionSets(id, e.target.value)}
            />
          </div>
          
          {!isTimeBased && (
            <div className="grid gap-2.5">
              {Array.from({ length: currentSetCount }).map((_, setIdx) => {
                const isSetDone = progress[id]?.sets?.[setIdx]?.completed;
                const uniqueSetKey = `${id}-${setIdx}`;
                const setWeight = progress[id]?.sets?.[setIdx]?.weight;

                return (
                <div key={setIdx} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all h-14 ${shakingRow === uniqueSetKey ? 'translate-x-2 bg-red-950/50 border border-red-500' : ''} ${isSetDone ? 'bg-primary/5 border border-primary/20' : 'bg-transparent border border-transparent'}`}>
                  
                  <button onClick={() => toggleSetComplete(id, setIdx)} className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-full border-2 transition-all active:scale-90 ${isSetDone ? 'bg-primary text-black border-primary' : 'bg-input border-border text-muted hover:border-muted-foreground'}`}>
                      {isSetDone ? <Sword size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <span className="text-sm font-black text-muted w-5 shrink-0 text-center">{setIdx + 1}º</span>
                  
                  <div className="flex-1 flex gap-1.5 items-center">
                      <input type="text" inputMode="decimal" placeholder="KG" value={setWeight || ""} onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)}
                        className={`w-full bg-input border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none placeholder:text-muted focus:border-primary ${safeParseFloat(setWeight) > exercisePR && exercisePR > 0 ? 'border-amber-500 text-amber-500 shadow-[0_0_12px_rgba(250,204,21,0.2)]' : 'border-border'}`}
                      />
                      
                      <input type="text" inputMode="numeric" placeholder="REPS" value={progress[id]?.sets?.[setIdx]?.reps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)}
                        className="w-full bg-input border border-border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none placeholder:text-muted focus:border-secondary"
                      />
                      
                      {/* 🔥 RPE Dinâmico: Perfeito no Claro e no Escuro */}
                      <div className="relative w-12 shrink-0">
                        <input 
                          type="text" 
                          inputMode="numeric" 
                          maxLength="2" 
                          placeholder="RPE" 
                          value={progress[id]?.sets?.[setIdx]?.rpe || ""} 
                          onChange={(e) => updateSetData(id, setIdx, 'rpe', e.target.value)}
                          className="w-full bg-orange-500/5 dark:bg-black/40 border border-orange-500/20 dark:border-orange-500/30 focus:border-orange-500 rounded p-1.5 text-orange-600 dark:text-orange-400 font-black text-xs text-center h-10 transition-all outline-none" 
                        />
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[5px] font-black text-orange-600 dark:text-orange-500 uppercase bg-card px-1 whitespace-nowrap">
                          Esforço
                        </span>
                      </div>
                      
                      {(() => {
                         const oneRM = calculate1RM(setWeight, progress[id]?.sets?.[setIdx]?.reps);
                         if (oneRM) return (<div className="flex flex-col items-center min-w-[25px]"><span className="text-[5px] text-muted font-black uppercase">1RM</span><span className="text-[9px] text-secondary font-black font-mono">{oneRM}</span></div>);
                      })()}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;