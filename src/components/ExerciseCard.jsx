import React, { useState, useEffect } from 'react';
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

  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    setIsLight(theme === 'light');
    
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

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

  // ================= CLASSES DE ESTILO LÓGICAS (O DESTAQUE) ================= //
  let cardClasses = "p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ";
  if (isBreakingPR) {
    cardClasses += isLight ? "border-l-[4px] border-amber-300 border-l-amber-500 bg-amber-50 shadow-sm" : "border-l-[4px] border-amber-500/30 border-l-amber-500 bg-amber-500/5";
  } else if (isDone) {
    cardClasses += isLight 
      ? "border-primary/60 border-l-[6px] border-l-primary bg-primary/[0.08] shadow-[0_8px_30px_rgba(var(--primary),0.15)] scale-[0.99]" 
      : "border-primary/50 border-l-[6px] border-l-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)] scale-[0.99]";
  } else {
    // 🔥 AJUSTE: Borda do card em repouso no Modo Claro para slate-300
    cardClasses += isLight ? "border-l-[4px] border-slate-300 border-l-slate-400 bg-white hover:border-primary/30 hover:border-l-primary shadow-sm" : "border-l-[4px] border-white/10 border-l-white/20 bg-card hover:border-primary/50 hover:border-l-primary shadow-sm";
  }

  return (
    <div className={cardClasses}>
      
      {/* 🔥 Mantido o OK conforme o código que você gosta */}
      {isDone && (<div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 font-black text-[120px] uppercase pointer-events-none z-0 ${isLight ? 'text-primary/15' : 'text-primary/10'}`}>OK</div>)}
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${isBreakingPR ? 'text-amber-500' : isDone ? 'text-primary' : 'text-main'}`}>
              {displayName}
              {isBreakingPR && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md animate-bounce ${isLight ? 'bg-amber-100 border border-amber-300' : 'bg-amber-500/10 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`}>
                  <Trophy size={14} className="text-amber-500 fill-current" />
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">NEW PR</span>
                </div>
              )}
            </h3>

            {ex.alternatives && ex.alternatives.length > 0 && !isDone && !isTutorial && (
              <button 
                onClick={handleSwap}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-black transition-all active:scale-90 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-500 hover:text-primary hover:border-primary' : 'bg-input border-white/10 text-white/50 hover:text-primary hover:border-primary'}`}
              >
                <RefreshCcw size={11} />
                TROCAR
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            {exercisePR > 0 && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${isLight ? 'bg-amber-100 border border-amber-300 text-amber-700' : 'bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}>
                <Trophy size={12} className="opacity-80" />
                <span className="tracking-widest">PR: {exercisePR}KG</span>
              </div>
            )}

            {lastWeight > 0 && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${isLight ? 'bg-blue-100 border border-blue-300 text-blue-700' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'}`}>
                <Ghost size={10} />
                <span>ÚLTIMA: {lastWeight}kg</span>
              </div>
            )}
            
            {lastWeight > 0 && !isDone && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono animate-pulse ${isLight ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-success/10 border border-success/30 text-success shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`}>
                <Target size={11} />
                <span>META: {getSmartSuggestion(displayName, lastWeight)}kg</span>
              </div>
            )}

            {exercisePR > 0 && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${isLight ? 'bg-purple-100 border border-purple-300 text-purple-700' : 'bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]'}`}>
                <Zap size={10} />
                <span>1RM: {Math.round(exercisePR * 1.33)}kg</span>
              </div>
            )}
          </div>
          <p className={`text-xs font-bold uppercase mt-2.5 tracking-wide ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{ex.note}</p>
        </div>

        {!isTutorial && (
          <button onClick={() => toggleCheck(id)} className={`ml-3 p-2.5 rounded-full transition-all border shadow-sm z-10 relative ${isDone ? (isLight ? 'border-primary text-white bg-primary shadow-[0_0_20px_rgba(var(--primary),0.6)] scale-110' : 'border-primary text-black bg-primary shadow-[0_0_20px_rgba(var(--primary),0.6)] scale-110') : (isLight ? 'border-slate-300 text-slate-400 hover:text-primary hover:border-primary bg-slate-50' : 'border-white/20 text-white/40 hover:text-primary hover:border-primary bg-transparent')}`}>
            <CheckCircle2 size={26} />
          </button>
        )}
      </div>
      
      {!isTutorial && (
        <div className="space-y-3.5 relative z-10">
          
          {/* 🔥 AJUSTE: Borda do header Séries no Modo Claro agora em slate-300 */}
          <div className={`flex items-center gap-3 p-2.5 rounded-lg border h-12 transition-colors ${isLight ? 'bg-slate-50 border-slate-300 hover:border-primary/40' : 'bg-black/20 border-white/10 shadow-inner'}`}>
            <span className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{isTimeBased ? 'Tempo Total' : 'Séries'}</span>
            <input
              type="text"
              inputMode={isTimeBased ? "text" : "numeric"}
              className="text-primary font-black outline-none w-20 text-center text-xl transition-colors placeholder:text-primary/30"
              style={{ backgroundColor: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: '2px solid rgba(var(--primary), 0.5)', borderRadius: 0, boxShadow: 'none' }}
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

                let rowClasses = "flex items-center gap-2 p-1.5 rounded-xl transition-all h-14 border ";
                if (shakingRow === uniqueSetKey) rowClasses += "translate-x-2 bg-red-500/10 border-red-500";
                else if (isSetDone) rowClasses += isLight ? "bg-primary/10 border-primary/30" : "bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.1)]";
                else rowClasses += isLight ? "bg-transparent border-transparent hover:bg-slate-50" : "bg-transparent border-transparent hover:bg-white/5";

                return (
                <div key={setIdx} className={rowClasses}>
                  
                  <button onClick={() => toggleSetComplete(id, setIdx)} className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-full border-2 transition-all active:scale-90 ${isSetDone ? (isLight ? 'bg-primary border-primary text-white shadow-sm scale-110' : 'bg-primary text-black border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-110') : (isLight ? 'bg-white border-slate-300 text-slate-300 hover:border-primary hover:text-primary' : 'bg-transparent border-white/20 text-white/40 hover:border-primary hover:text-primary')}`}>
                      {isSetDone ? <Sword size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <span className={`text-sm font-black w-5 shrink-0 text-center transition-colors ${isSetDone ? 'text-primary' : (isLight ? 'text-slate-400' : 'text-white/40')}`}>{setIdx + 1}º</span>
                  
                  <div className="flex-1 flex gap-1.5 items-center">
                      
                      {/* 🔥 AJUSTE: Inputs no Modo Claro agora com border-slate-300 🔥 */}
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        placeholder="KG" 
                        value={setWeight || ""} 
                        onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)}
                        className={`w-full border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none transition-all focus:!border-primary focus:!ring-2 focus:!ring-primary/20 ${
                          isSetDone 
                            ? (isLight ? 'bg-transparent border-transparent text-primary placeholder-primary/30' : 'bg-transparent border-transparent text-primary placeholder-primary/30') 
                            : (safeParseFloat(setWeight) > exercisePR && exercisePR > 0 
                              ? (isLight ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]')
                              : (isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 hover:border-primary/40 focus:bg-white' : 'bg-transparent border-white/10 text-white placeholder-white/30 hover:border-primary/50 focus:bg-input'))
                        }`}
                      />
                      
                      {/* 🔥 AJUSTE: Inputs no Modo Claro agora com border-slate-300 🔥 */}
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        placeholder="REPS" 
                        value={progress[id]?.sets?.[setIdx]?.reps || ""} 
                        onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)}
                        className={`w-full border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none transition-all focus:!border-secondary focus:!ring-2 focus:!ring-secondary/20 ${
                          isSetDone
                            ? (isLight ? 'bg-transparent border-transparent text-primary placeholder-primary/30' : 'bg-transparent border-transparent text-primary placeholder-primary/30')
                            : (isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 hover:border-secondary/40 focus:bg-white' : 'bg-transparent border-white/10 text-white placeholder-white/30 hover:border-secondary/50 focus:bg-input')
                        }`}
                      />
                      
                      <div className="relative w-12 shrink-0">
                        {/* 🔥 AJUSTE: RPE no Modo Claro agora com border-orange-300 🔥 */}
                        <input 
                          type="text" 
                          inputMode="numeric" 
                          maxLength="2" 
                          placeholder="RPE" 
                          value={progress[id]?.sets?.[setIdx]?.rpe || ""} 
                          onChange={(e) => updateSetData(id, setIdx, 'rpe', e.target.value)}
                          className={`w-full border rounded p-1.5 font-black text-xs text-center h-10 transition-all outline-none focus:!border-warning focus:!ring-2 focus:!ring-warning/20 ${
                            isSetDone
                              ? (isLight ? 'bg-transparent border-transparent text-orange-500 placeholder-orange-500/30' : 'bg-transparent border-transparent text-warning placeholder-warning/30')
                              : (isLight ? 'bg-orange-50 border-orange-300 text-orange-600 placeholder-orange-300 hover:border-orange-400 focus:bg-white' : 'bg-warning/10 border-warning/30 text-warning placeholder-warning/40 hover:border-warning/60 focus:bg-input')
                          }`}
                        />
                        {!isSetDone && (
                          <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] font-black uppercase bg-card px-1 whitespace-nowrap ${isLight ? 'text-orange-500' : 'text-warning'}`}>
                            Esforço
                          </span>
                        )}
                      </div>
                      
                      {(() => {
                         const oneRM = calculate1RM(setWeight, progress[id]?.sets?.[setIdx]?.reps);
                         if (oneRM) return (
                           <div className="flex flex-col items-center min-w-[25px]">
                             <span className={`text-[5px] font-black uppercase ${isSetDone ? 'text-primary/60' : (isLight ? 'text-slate-400' : 'text-white/40')}`}>1RM</span>
                             <span className={`text-[9px] font-black font-mono ${isSetDone ? 'text-primary' : 'text-secondary'}`}>{oneRM}</span>
                           </div>
                         );
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