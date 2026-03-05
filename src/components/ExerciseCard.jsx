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

  // DETECTOR DE TUTORIAL (Esconde ações se for instrução)
  const isTutorial = ex.sets === "-x-" || ex.sets === "-";

  // Define o nome que será exibido (Original ou o trocado)
  const displayName = progress[id]?.swappedName || ex.name;

  // Lógica de Histórico e PR baseada no nome ativo
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
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${isBreakingPR ? 'text-yellow-400' : isDone ? 'text-primary' : 'text-main'}`}>
              {displayName}
              {isBreakingPR && (
                <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/50 px-1.5 py-0.5 rounded-md animate-bounce shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                  <Trophy size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-tighter">NEW PR</span>
                </div>
              )}
            </h3>

            {/* BOTÃO DE TROCAR */}
            {ex.alternatives && ex.alternatives.length > 0 && !isDone && !isTutorial && (
              <button 
                onClick={handleSwap}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-input border border-border text-[11px] font-black text-muted hover:text-primary hover:border-primary transition-all active:scale-90 shadow-inner"
                title="Trocar por alternativa"
              >
                <RefreshCcw size={11} />
                TROCAR
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            {/* 🏆 RECORDE (PR): Destaque Máximo (Cor Ativa) */}
            {exercisePR > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-[10px] font-bold font-mono text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.2)]">
                <Trophy size={11} className="fill-yellow-400/20" />
                <span>PR: {exercisePR}kg</span>
              </div>
            )}

            {/* ÚLTIMA CARGA: Neutra (Fundo em 5% p/ não brigar) */}
            {lastWeight > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/5 border border-border/50 text-[10px] font-mono text-muted-foreground/80">
                <Ghost size={11} />
                <span>ÚLTIMA: {lastWeight}kg</span>
              </div>
            )}
            
            {/* META: Destaque Tático (Piscando) */}
            {lastWeight > 0 && !isDone && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-bold font-mono text-green-400 animate-pulse">
                <Target size={11} />
                <span>META: {getSmartSuggestion(displayName, lastWeight)}kg</span>
              </div>
            )}

            {/* 1RM ESTIMADO: Totalmente Neutro e Apagado */}
            {exercisePR > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/5 text-[10px] font-mono text-muted/60">
                <Zap size={11} />
                <span>1RM: {Math.round(exercisePR * 1.33)}kg</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted font-bold uppercase mt-2.5 italic tracking-wide">{ex.note}</p>
        </div>

        {/* BOTÃO CHECK (Touch target garantido) */}
        {!isTutorial && (
          <button onClick={() => toggleCheck(id)} className={`ml-3 p-2.5 rounded-full transition-all border ${isDone ? 'border-primary text-primary bg-transparent' : 'border-border text-muted hover:text-white hover:border-white/50 bg-card'}`}>
            <CheckCircle2 size={26} />
          </button>
        )}
      </div>
      
      {/* SEÇÃO DE ENTRADA DE DADOS */}
      {!isTutorial && (
        <div className="space-y-3.5 relative z-10">
          <div className="flex items-center gap-3 bg-input/50 p-2.5 rounded-lg border border-border h-12 shadow-inner">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{isTimeBased ? 'Tempo Total' : 'Ciclos/Séries'}</span>
            <input type={isTimeBased ? "text" : "number"} placeholder="Ex: 4" className="bg-transparent text-primary font-black outline-none w-20 text-center text-xl border-b-2 border-primary/20 focus:border-primary transition-colors" value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")} onChange={(e) => updateSessionSets(id, e.target.value)} />
          </div>
          
          {!isTimeBased && (
            <div className="grid gap-2.5">
              {Array.from({ length: currentSetCount }).map((_, setIdx) => {
                const isSetDone = progress[id]?.sets?.[setIdx]?.completed;
                const uniqueSetKey = `${id}-${setIdx}`;
                const setWeight = progress[id]?.sets?.[setIdx]?.weight;

                return (
                <div key={setIdx} className={`flex items-center gap-2.5 p-2 rounded-xl transition-all h-14 ${shakingRow === uniqueSetKey ? 'translate-x-2 bg-red-950/50 border border-red-500' : ''} ${isSetDone ? 'bg-primary/5 border border-primary/20' : 'bg-transparent border border-transparent'}`}>
                  {/* Botão de Concluir Série (Maior) */}
                  <button onClick={() => toggleSetComplete(id, setIdx)} className={`h-10 w-10 flex items-center justify-center rounded-full border-2 transition-all active:scale-90 ${isSetDone ? 'bg-primary text-black border-primary' : 'bg-input border-border text-muted hover:border-muted-foreground'}`}>
                      {isSetDone ? <Sword size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <span className="text-sm font-black text-muted w-5 text-center">{setIdx + 1}º</span>
                  
                  <div className="flex-1 flex gap-2 items-center">
                      {/* Input de Peso (Destaque se quebrar PR) */}
                      <input type="text" inputMode="decimal" placeholder="KG" value={setWeight || ""} onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)} 
                        className={`w-full bg-input border-2 rounded-lg p-2 font-black text-xl text-center h-12 transition-all ${safeParseFloat(setWeight) > exercisePR && exercisePR > 0 ? 'border-yellow-400 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)] bg-yellow-950/20' : 'border-border focus:border-success text-success'}`} 
                      />
                      {/* Input de Repetições */}
                      <input type="text" inputMode="numeric" placeholder="REPS" value={progress[id]?.sets?.[setIdx]?.reps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)} 
                        className="w-full bg-input border-2 border-border focus:border-secondary rounded-lg p-2 text-secondary font-black text-xl text-center h-12 transition-all" 
                      />
                      {/* Input de RPE (Laranja - Fundo Tático) */}
                      <div className="relative w-20">
                        <input type="text" inputMode="numeric" maxLength="2" placeholder="RPE" value={progress[id]?.sets?.[setIdx]?.rpe || ""} onChange={(e) => updateSetData(id, setIdx, 'rpe', e.target.value)} 
                          className="w-full bg-orange-950/30 border-2 border-orange-500/30 focus:border-orange-500 rounded-lg p-2 text-orange-400 font-black text-lg text-center h-12 transition-all" 
                        />
                      </div>
                      {/* Cálculo de 1RM (Apenas visual) */}
                      {(() => {
                         const oneRM = calculate1RM(setWeight, progress[id]?.sets?.[setIdx]?.reps);
                         if (oneRM) return (<div className="flex flex-col items-center min-w-[30px] opacity-80"><span className="text-[7px] text-muted font-black uppercase tracking-widest">1RM</span><span className="text-xs text-secondary font-black font-mono">{oneRM}</span></div>);
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