import React, { useState } from 'react';
import { CheckCircle2, Ghost, Target, Zap, Sword, Circle, Trophy, RefreshCcw, Flame, Settings2 } from 'lucide-react';
import { safeParseFloat, calculateTrue1RM, isSameExercise } from '../../utils/workoutUtils';

const ExerciseCard = ({
  ex, id, progress, history, toggleCheck, updateSetData, updateSessionSets, toggleSetComplete, shakingRow,
  onSwap
}) => {
  const isDone = progress[id]?.done;
  const isTimeBased = ex.sets.toLowerCase().includes('min') || ex.sets.toLowerCase().includes('seg') || ex.sets.toLowerCase().includes('s') || !ex.sets.includes('x');
  const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

  const isTutorial = ex.sets === "-x-" || ex.sets === "-";
  const displayName = progress[id]?.swappedName || ex.name;

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

  // 🔥 THEME COLORS PARA O OVERLAY (Base escura para garantir contraste extremo do Neon)
  const overlayTheme = isDone && isBreakingPR
    ? {
        bg: 'bg-[rgba(15,10,0,0.9)] backdrop-blur-md', // Fundo quase preto/quente para destacar o ouro
        border: 'border-y-2 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5),inset_0_0_15px_rgba(250,204,21,0.2)]',
        text: 'text-yellow-400',
        glow: 'drop-shadow-[0_0_12px_rgba(250,204,21,1)] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]',
        overlayText: '✦ NOVO PR BATIDO ✦'
      }
    : isDone && !isBreakingPR
    ? {
        bg: 'bg-[rgba(0,10,15,0.9)] backdrop-blur-md', // Fundo quase preto/frio para destacar o cyan
        border: 'border-y-2 border-[#00f3ff] shadow-[0_0_30px_rgba(0,243,255,0.4),inset_0_0_15px_rgba(0,243,255,0.2)]',
        text: 'text-[#00f3ff]',
        glow: 'drop-shadow-[0_0_10px_rgba(0,243,255,1)] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]',
        overlayText: 'CONCLUÍDO'
      }
    : null;

  // Borda do Card Principal
  const cardBorderClasses = isDone
    ? (isBreakingPR ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-500/10 to-transparent shadow-[0_0_25px_rgba(250,204,21,0.35)] opacity-95 scale-[0.98]' : 'border-2 border-[#00f3ff] bg-gradient-to-br from-[#00f3ff]/10 to-transparent shadow-[0_0_20px_rgba(0,243,255,0.3)] opacity-95 scale-[0.98]')
    : (isBreakingPR ? 'bg-card border-l-4 border-l-yellow-400 border-y border-y-yellow-400/20 border-r border-r-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.15)] hover:-translate-y-0.5' : 'bg-card border-l-4 border-l-[#00f3ff]/70 border-y border-y-border/50 border-r border-r-border/50 hover:border-l-[#00f3ff] hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] dark:hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]');


  return (
    <div className={`p-4 rounded-xl transition-all duration-500 relative ${cardBorderClasses}`}>
      
      {/* HEADER DO CARD */}
      <div className="flex justify-between items-start mb-5 relative z-30">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className={`font-black text-lg leading-tight flex items-center gap-2 drop-shadow-md ${isBreakingPR ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isDone ? 'text-[#00f3ff]' : 'text-main dark:text-white'}`}>
              {displayName}
              {/* Etiqueta sutil de PR batido (aparece assim que digita) */}
              {isBreakingPR && !isDone && (
                <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-400 px-2 py-0.5 rounded-md animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                  <Trophy size={14} className="text-yellow-400 fill-yellow-400/50" />
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-tighter">NEW PR</span>
                </div>
              )}
            </h3>

            {ex.alternatives && ex.alternatives.length > 0 && !isDone && !isTutorial && (
              <button 
                onClick={handleSwap}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-input border border-border text-[11px] font-black text-muted hover:text-[#00f3ff] hover:border-[#00f3ff] hover:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all active:scale-90 shadow-sm"
              >
                <RefreshCcw size={11} />
                TROCAR
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            {exercisePR > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 border border-amber-600 text-[10px] font-black font-mono text-black shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                <Trophy size={12} className="fill-black/50 stroke-black" />
                <span className="tracking-widest">PR: {exercisePR}KG</span>
              </div>
            )}
            {lastWeight > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ff00ff]/10 border border-[#ff00ff]/30 text-[11px] font-mono text-[#ff00ff] drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">
                <Ghost size={12} />
                <span>ÚLTIMA: {lastWeight}kg</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted font-bold uppercase mt-2.5 tracking-wide">{ex.note}</p>
        </div>

        {!isTutorial && (
          <button 
            onClick={() => toggleCheck(id)} 
            className={`ml-3 p-3 sm:p-4 rounded-xl transition-all border-2 relative overflow-hidden active:scale-90 shadow-lg ${
              isDone 
                ? 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/10 shadow-[0_0_20px_rgba(0,243,255,0.6)]' 
                : 'border-border text-muted hover:text-[#00f3ff] hover:border-[#00f3ff] hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] bg-card hover:bg-[#00f3ff]/5'
            }`}
          >
            <CheckCircle2 size={28} className={isDone ? "drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" : ""} />
          </button>
        )}
      </div>
      
      {/* SEÇÃO DE INPUTS */}
      {!isTutorial && (
        <div className="relative z-10 w-full overflow-hidden rounded-lg">
          
          {/* 🔥 OVERLAY DIAGONAL GRITANTE */}
          {overlayTheme && (
            <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center rounded-lg overflow-hidden">
              
              {/* 🔥 DIMMER CAMALEÃO: Usa a variável do SEU CSS. Branco fosco no Claro, Escuro fosco no Dark. Funciona 100%. */}
              <div className="absolute inset-0 bg-[var(--bg-card)] opacity-85 backdrop-blur-[3px] transition-opacity duration-500"></div>

              <div className={`relative w-[150%] py-3 sm:py-4 transform -rotate-6 flex items-center justify-center animate-in zoom-in duration-300 ${overlayTheme.bg} ${overlayTheme.border}`}>
                
                {/* Textura de Scanline (Padrão Ouro RPG) aparecendo apenas no PR */}
                {isBreakingPR && (
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,0.15)_1px,transparent_1px)] bg-[size:100%_4px] opacity-60"></div>
                )}
                
                <span className={`relative font-black text-[16px] min-[400px]:text-[18px] sm:text-3xl tracking-widest sm:tracking-[0.35em] uppercase whitespace-nowrap ${overlayTheme.text} ${overlayTheme.glow}`}>
                  {overlayTheme.overlayText}
                </span>
              </div>
            </div>
          )}

          {/* CONTAINER DOS INPUTS */}
          <div className={`space-y-3.5 transition-opacity duration-500 ${isDone ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            
            <div className="flex items-center justify-between bg-input p-2.5 rounded-lg border border-border h-14 shadow-inner">
              <div className={`flex items-center bg-card dark:bg-[#050505] border rounded-md px-2.5 h-10 transition-all ${isBreakingPR && !isDone ? 'border-yellow-400/50 shadow-[inset_0_0_8px_rgba(250,204,21,0.05)]' : 'border-[#00f3ff]/30 shadow-[inset_0_0_8px_rgba(0,243,255,0.05)]'}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest mr-2 ${isBreakingPR && !isDone ? 'text-yellow-400/70' : 'text-[#00f3ff]/70'}`}>{isTimeBased ? 'TEMPO' : 'SÉRIES'}</span>
                <div className={`w-[2px] h-4 skew-x-[-15deg] mr-2 ${isBreakingPR && !isDone ? 'bg-yellow-400/40' : 'bg-[#00f3ff]/40'}`}></div>
                <input
                  type="text"
                  inputMode={isTimeBased ? "text" : "numeric"}
                  className={`font-mono font-black outline-none w-12 text-center text-lg bg-transparent drop-shadow-[0_0_5px_currentColor] ${isBreakingPR && !isDone ? 'text-yellow-400 placeholder:text-yellow-400/30' : 'text-[#00f3ff] placeholder:text-[#00f3ff]/30'}`}
                  value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")}
                  onChange={(e) => updateSessionSets(id, e.target.value)}
                />
              </div>
              
              {!isTimeBased && (
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)} 
                  className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-2 rounded-md transition-colors border ${
                    showAdvanced 
                      ? 'bg-[#ff00ff]/10 text-[#ff00ff] border-[#ff00ff]/50 shadow-[0_0_10px_rgba(255,0,255,0.3)]' 
                      : 'bg-card text-muted border-border hover:text-[#00f3ff] hover:border-[#00f3ff]'
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
                  
                  const isThisSetPR = safeParseFloat(setWeight) > exercisePR && exercisePR > 0;

                  return (
                  <div key={setIdx} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all h-14 ${shakingRow === uniqueSetKey ? 'translate-x-2 bg-red-900/20 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : ''} ${isSetDone ? 'bg-[#00f3ff]/5 border border-[#00f3ff]/30' : 'bg-transparent border border-transparent'}`}>
                    
                    <button onClick={() => toggleSetComplete(id, setIdx)} className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
                      isThisSetPR && isSetDone && !isDone
                        ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                        : isSetDone 
                          ? 'bg-[#00f3ff] text-black border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.5)]' 
                          : 'bg-input border-border text-muted hover:border-[#ff00ff] hover:text-[#ff00ff] hover:shadow-[0_0_10px_rgba(255,0,255,0.3)]'
                    }`}>
                        {isSetDone ? <Sword size={20} /> : <Circle size={20} />}
                    </button>
                    
                    <span className={`text-sm font-black w-5 shrink-0 text-center ${isThisSetPR && !isDone ? 'text-yellow-400/80' : 'text-muted'}`}>{setIdx + 1}º</span>
                    
                    <div className="flex-1 flex gap-2 items-center">
                        <input type="text" inputMode="decimal" placeholder="KG" value={setWeight || ""} onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)}
                          className={`w-full bg-input border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none placeholder:text-muted/50 transition-all ${
                            isThisSetPR 
                              ? 'border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] focus:border-yellow-300' 
                              : 'border-border text-main dark:text-white focus:border-[#00f3ff] focus:shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                          }`}
                        />
                        
                        <input type="text" inputMode="numeric" placeholder="REPS" value={setReps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)}
                          className={`w-full bg-input border rounded-lg p-1.5 font-black text-lg text-center h-10 outline-none placeholder:text-muted/50 transition-all ${
                            isThisSetPR
                              ? 'border-yellow-400/50 text-main dark:text-white focus:border-yellow-400 focus:shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                              : 'border-border text-main dark:text-white focus:border-[#ff00ff] focus:shadow-[0_0_10px_rgba(255,0,255,0.3)]'
                          }`}
                        />
                        
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
                                    ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' 
                                    : isHypertrophy 
                                      ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                                      : isThisSetPR
                                        ? 'bg-yellow-500/5 border-yellow-400/50 text-muted focus:text-white'
                                        : 'bg-card border-border focus:border-[#00f3ff] text-muted focus:text-white focus:shadow-[0_0_8px_rgba(0,243,255,0.3)]'
                                  }
                                `} 
                              />
                              <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[5px] font-black uppercase bg-card px-1 whitespace-nowrap rounded-sm transition-colors
                                ${isCritical ? 'text-red-500' : isHypertrophy ? 'text-orange-500' : isThisSetPR ? 'text-yellow-400' : 'text-muted'}
                              `}>
                                {isCritical ? 'CRÍTICO' : isThisSetPR ? 'PR' : 'ESFORÇO'}
                              </span>
                              {isCritical && <Flame size={8} className="absolute -top-2 -right-1 text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,1)]" />}
                            </div>
                            
                            {(() => {
                              const true1RM = calculateTrue1RM(setWeight, setReps, setRPE);
                              if (true1RM) return (
                                <div className="flex flex-col items-center min-w-[25px] animate-in fade-in duration-200">
                                  <span className="text-[5px] text-muted font-black uppercase">{setRPE ? 'TRUE 1RM' : '1RM'}</span>
                                  <span className={`text-[9px] font-black font-mono ${isThisSetPR ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : setRPE ? 'text-[#ff00ff] drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]' : 'text-muted'}`}>{true1RM}</span>
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
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;