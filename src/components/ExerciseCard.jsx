import React from 'react';
import { CheckCircle2, Star, Ghost, Target, Zap, Sword, Circle, Trophy, RefreshCcw } from 'lucide-react';
import { safeParseFloat, calculate1RM, getSmartSuggestion, isSameExercise } from '../utils/workoutUtils';

const ExerciseCard = ({ 
  ex, id, progress, history, toggleCheck, updateSetData, updateSessionSets, toggleSetComplete, shakingRow, 
  onSwap // 🔥 Nova prop para a ação de trocar
}) => {
  const isDone = progress[id]?.done;
  const isTimeBased = ex.sets.toLowerCase().includes('min') || ex.sets.toLowerCase().includes('seg') || ex.sets.toLowerCase().includes('s') || !ex.sets.includes('x');
  const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

  // Define o nome que será exibido (Original ou o trocado)
  const displayName = progress[id]?.swappedName || ex.name;

  // Lógica de Histórico e PR baseada no nome que está na tela
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

  // Função para rotacionar entre as alternativas
  const handleSwap = () => {
    if (!ex.alternatives || ex.alternatives.length === 0) return;
    
    const allOptions = [ex.name, ...ex.alternatives];
    const currentIndex = allOptions.indexOf(displayName);
    const nextIndex = (currentIndex + 1) % allOptions.length;
    onSwap(id, allOptions[nextIndex]);
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-500 relative overflow-hidden ${isBreakingPR ? 'border-yellow-400 bg-yellow-400/5' : isDone ? 'border-primary bg-black/40' : 'bg-card border-border hover:border-primary/30'}`}>
      {isDone && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-2 border-primary/10 text-primary/10 font-black text-5xl uppercase pointer-events-none z-0">OK</div>)}
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${isBreakingPR ? 'text-yellow-400' : isDone ? 'text-primary' : 'text-main'}`}>
              {displayName}
              {isBreakingPR && (
                <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/50 px-1.5 py-0.5 rounded-md animate-bounce shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                  <Trophy size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-tighter">NEW PR</span>
                </div>
              )}
            </h3>

            {/* 🔥 BOTÃO DE TROCAR (Só aparece se houver alternativas no workoutData) */}
            {ex.alternatives && ex.alternatives.length > 0 && !isDone && (
              <button 
                onClick={handleSwap}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-input border border-border text-[10px] font-black text-muted hover:text-primary hover:border-primary transition-all active:scale-90"
                title="Trocar por alternativa"
              >
                <RefreshCcw size={10} />
                TROCAR
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mt-1.5 flex-wrap items-center">
            {lastWeight > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-400">
                <Ghost size={10} />
                <span>ÚLTIMA CARGA: {lastWeight}kg</span>
              </div>
            )}
            {lastWeight > 0 && !isDone && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-mono text-green-400 animate-pulse">
                <Target size={10} />
                <span>META: {getSmartSuggestion(displayName, lastWeight)}kg</span>
              </div>
            )}
            {exercisePR > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-mono text-purple-400">
                <Zap size={10} />
                <span>1RM EST: {Math.round(exercisePR * 1.33)}kg</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted font-bold uppercase mt-2 italic">{ex.note}</p>
        </div>
        <button onClick={() => toggleCheck(id)} className={`ml-3 p-1.5 rounded-full transition-all border ${isDone ? 'border-primary text-primary bg-transparent' : 'border-border text-muted hover:text-white'}`}>
          <CheckCircle2 size={24} />
        </button>
      </div>
      
      {/* Resto do componente permanece igual... */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-2 bg-input/50 p-2 rounded-lg border border-border h-10">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest">{isTimeBased ? 'Tempo' : 'Ciclos'}</span>
          <input type={isTimeBased ? "text" : "number"} className="bg-transparent text-primary font-black outline-none w-16 text-center text-lg border-b border-primary/30" value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")} onChange={(e) => updateSessionSets(id, e.target.value)} />
        </div>
        
        {!isTimeBased && (
          <div className="grid gap-2">
            {Array.from({ length: currentSetCount }).map((_, setIdx) => {
              const isSetDone = progress[id]?.sets?.[setIdx]?.completed;
              const uniqueSetKey = `${id}-${setIdx}`;
              return (
              <div key={setIdx} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${shakingRow === uniqueSetKey ? 'translate-x-2 bg-red-500/20' : ''} ${isSetDone ? 'bg-primary/10 border border-primary/30' : 'bg-transparent'}`}>
                <button onClick={() => toggleSetComplete(id, setIdx)} className={`h-8 w-8 flex items-center justify-center rounded-full border transition-all ${isSetDone ? 'bg-primary text-black border-primary' : 'bg-input border-border text-muted'}`}>
                    {isSetDone ? <Sword size={16} /> : <Circle size={16} />}
                </button>
                <span className="text-xs font-black text-muted w-4">#{setIdx + 1}</span>
                <div className="flex-1 flex gap-1.5 items-center">
                    <input type="text" inputMode="decimal" placeholder="KG" value={progress[id]?.sets?.[setIdx]?.weight || ""} onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)} 
                      className={`w-full bg-input border rounded p-1.5 font-black text-lg text-center h-10 ${safeParseFloat(progress[id]?.sets?.[setIdx]?.weight) > exercisePR && exercisePR > 0 ? 'border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]' : 'border-border text-success'}`} 
                    />
                    <input type="text" placeholder="REPS" value={progress[id]?.sets?.[setIdx]?.reps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)} 
                      className="w-full bg-input border border-border rounded p-1.5 text-secondary font-black text-lg text-center h-10" 
                    />
                    <div className="relative min-w-[45px]">
                      <input type="number" min="1" max="10" placeholder="RPE" value={progress[id]?.sets?.[setIdx]?.rpe || ""} onChange={(e) => updateSetData(id, setIdx, 'rpe', e.target.value)} 
                        className="w-full bg-black/40 border border-orange-500/30 rounded p-1.5 text-orange-400 font-black text-xs text-center h-10" 
                      />
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[5px] font-black text-orange-500 uppercase bg-black px-1">Esforço</span>
                    </div>
                    {(() => {
                       const oneRM = calculate1RM(progress[id]?.sets?.[setIdx]?.weight, progress[id]?.sets?.[setIdx]?.reps);
                       if (oneRM) return (<div className="flex flex-col items-center min-w-[25px]"><span className="text-[5px] text-muted font-black uppercase">1RM</span><span className="text-[9px] text-secondary font-black font-mono">{oneRM}</span></div>);
                    })()}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard;