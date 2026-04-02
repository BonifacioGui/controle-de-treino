import React, { useState } from 'react';
import { CheckCircle2, Ghost, Target, Zap, Sword, Circle, Trophy, RefreshCcw, Flame, Settings2 } from 'lucide-react';
import { safeParseFloat, calculateTrue1RM, getSmartSuggestion, isSameExercise } from '../utils/workoutUtils';

const ExerciseCard = ({
  ex, id, progress, history, toggleCheck, updateSetData, updateSessionSets, toggleSetComplete, shakingRow,
  onSwap
}) => {
  const isDone = progress[id]?.done;
  const isTimeBased = ex.sets.toLowerCase().includes('min') || ex.sets.toLowerCase().includes('seg') || ex.sets.toLowerCase().includes('s') || !ex.sets.includes('x');
  const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

  const isTutorial = ex.sets === "-x-" || ex.sets === "-";
  const displayName = progress[id]?.swappedName || ex.name;

  // 🔥 LÓGICA INTELIGENTE: Se já tem RPE preenchido, abre o modo avançado por padrão.
  const hasRPE = (progress[id]?.sets || []).some(s => s.rpe && s.rpe.trim() !== "");
  const [showAdvanced, setShowAdvanced] = useState(hasRPE);

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
    <div className={`p-4 rounded-xl border-y border-r border-l-4 transition-all duration-300 relative overflow-hidden ${
      isBreakingPR
        ? 'border-l-amber-500 border-y-amber-500/20 border-r-amber-500/20 bg-amber-500/5'
        : isDone
          ? 'border-l-primary border-y-primary/20 border-r-primary/20 bg-primary/10 opacity-95'
          : 'bg-card border-l-border border-y-border/50 border-r-border/50 hover:border-l-secondary hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-xl'
    }`}>
      
      {isDone && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-2 border-secondary/10 text-primary/10 font-black text-5xl uppercase pointer-events-none z-0">OK</div>)}
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${isBreakingPR ? 'text-amber-600 dark:text-amber-500' : isDone ? 'text-primary' : 'text-main dark:text-white'}`}>
              {displayName}
              {isBreakingPR && (
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/50 px-1.5 py-0.5 rounded-md animate-bounce shadow-sm dark:shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                  <Trophy size={14} className="text-amber-600 dark:text-amber-500 fill-amber-500/50 dark:fill-amber-500" />
                  <span className="text-[8px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter">NEW PR</span>
                </div>
              )}
            </h3>

            {ex.alternatives && ex.alternatives.length > 0 && !isDone && !isTutorial && (
              <button 
                onClick={handleSwap}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-input border border-border text-[11px] font-black text-muted hover:text-main dark:hover:text-secondary hover:border-border dark:hover:border-secondary transition-all active:scale-90 shadow-sm"
              >
                <RefreshCcw size={11} />
                TROCAR
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            {exercisePR > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 border border-amber-600 text-[10px] font-black font-mono text-black shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <Trophy size={12} className="fill-black/50 stroke-black" />
                <span className="tracking-widest">PR: {exercisePR}KG</span>
              </div>
            )}
            {lastWeight > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-600 dark:text-blue-400">
                <Ghost size={10} />
                <span>ÚLTIMA: {lastWeight}kg</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted font-bold uppercase mt-2.5 tracking-wide">{ex.note}</p>
        </div>

        {!isTutorial && (
          <button onClick={() => toggleCheck(id)} className={`ml-3 p-2.5 rounded-full transition-all border ${isDone ? 'border-primary text-primary bg-transparent' : 'border-border text-muted hover:text-main dark:hover:text-white hover:border-border dark:hover:border-white/50 bg-card hover:bg-input'}`}>
            <CheckCircle2 size={26} />
          </button>
        )}
      </div>
      
      {!isTutorial && (
        <div className="space-y-3.5 relative z-10">
          {/* 🔥 CABEÇALHO COM BOTÃO DE MODO AVANÇADO */}
          <div className="flex items-center justify-between bg-input p-2.5 rounded-lg border border-border h-12 shadow-inner">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-muted uppercase tracking-widest">{isTimeBased ? 'Tempo Total' : 'Séries'}</span>
              <input
                type="text"
                inputMode={isTimeBased ? "text" : "numeric"}
                className="text-primary font-black outline-none w-11 text-center text-xl transition-colors placeholder:text-primary/20 bg-transparent border-t-0 border-l-0 border-r-0 border-b-[3px] border-secondary/60 rounded-none shadow-none"
                value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")}
                onChange={(e) => updateSessionSets(id, e.target.value)}
              />
            </div>
            
            {!isTimeBased && (
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-md transition-colors border ${
                  showAdvanced 
                    ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.2)]' 
                    : 'bg-card text-muted border-border hover:text-main dark:hover:text-white hover:border-muted'
                }`}
              >
                <Settings2 size={12} />
                {showAdvanced ? 'Ocultar RPE' : 'RPE / 1RM'}
              </button>
            )}
          </div>
          
          {!isTimeBased && (
            <div className="grid gap-2.5">
              {Array.from({ length: currentSetCount }).map((_, setIdx) => {
                const isSetDone = progress[id]?.sets?.[setIdx]?.completed;
                const uniqueSetKey = `${id}-${setIdx}`;
                const setWeight = progress[id]?.sets?.[setIdx]?.weight;
                const setReps = progress[id]?.sets?.[setIdx]?.reps;
                const setRPE = progress[id]?.sets?.[setIdx]?.rpe;
                
                const rpeNum = parseFloat(setRPE);
                const isCritical = rpeNum >= 9;
                const isHypertrophy = rpeNum >= 7 && rpeNum < 9;

                return (
                <div key={setIdx} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all h-14 ${shakingRow === uniqueSetKey ? 'translate-x-2 bg-red-900/10 border border-red-500' : ''} ${isSetDone ? 'bg-primary/5 border border-primary/20' : 'bg-transparent border border-transparent'}`}>
                  
                  <button onClick={() => toggleSetComplete(id, setIdx)} className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-full border-2 transition-all active:scale-90 ${isSetDone ? 'bg-primary text-black border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-input border-border text-muted hover:border-main dark:hover:border-white/50'}`}>
                      {isSetDone ? <Sword size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <span className="text-sm font-black text-muted w-5 shrink-0 text-center">{setIdx + 1}º</span>
                  
                  <div className="flex-1 flex gap-2 items-center">
                      <input type="text" inputMode="decimal" placeholder="KG" value={setWeight || ""} onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)}
                        className={`w-full bg-input border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none placeholder:text-muted/50 focus:border-primary ${safeParseFloat(setWeight) > exercisePR && exercisePR > 0 ? 'border-amber-500 text-amber-600 dark:text-amber-500 shadow-sm dark:shadow-[0_0_12px_rgba(250,204,21,0.2)]' : 'border-border text-main dark:text-white'}`}
                      />
                      
                      <input type="text" inputMode="numeric" placeholder="REPS" value={setReps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)}
                        className="w-full bg-input border border-border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none placeholder:text-muted/50 focus:border-secondary text-main dark:text-white"
                      />
                      
                      {/* 🔥 EXIBIÇÃO CONDICIONAL DO RPE E 1RM */}
                      {showAdvanced && (
                        <>
                          <div className="relative w-12 shrink-0 animate-in fade-in zoom-in duration-200">
                            <input 
                              type="text" 
                              inputMode="numeric" 
                              maxLength="2" 
                              placeholder="RPE" 
                              value={setRPE || ""} 
                              onChange={(e) => updateSetData(id, setIdx, 'rpe', e.target.value)}
                              className={`w-full border rounded p-1.5 font-black text-xs text-center h-10 transition-all outline-none 
                                ${isCritical 
                                  ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                                  : isHypertrophy 
                                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400' 
                                    : 'bg-card border-border focus:border-primary text-muted focus:text-main dark:focus:text-white'
                                }
                              `} 
                            />
                            <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[5px] font-black uppercase bg-card px-1 whitespace-nowrap rounded-sm transition-colors
                              ${isCritical ? 'text-red-600 dark:text-red-500' : isHypertrophy ? 'text-orange-600 dark:text-orange-500' : 'text-muted'}
                            `}>
                              {isCritical ? 'CRÍTICO' : 'ESFORÇO'}
                            </span>
                            {isCritical && <Flame size={8} className="absolute -top-2 -right-1 text-red-500 animate-pulse" />}
                          </div>
                          
                          {(() => {
                            const true1RM = calculateTrue1RM(setWeight, setReps, setRPE);
                            if (true1RM) return (
                              <div className="flex flex-col items-center min-w-[25px] animate-in fade-in duration-200">
                                <span className="text-[5px] text-muted font-black uppercase">{setRPE ? 'TRUE 1RM' : '1RM'}</span>
                                <span className={`text-[9px] font-black font-mono ${setRPE ? 'text-amber-500 drop-shadow-sm' : 'text-secondary'}`}>{true1RM}</span>
                              </div>
                            );
                          })()}
                        </>
                      )}
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