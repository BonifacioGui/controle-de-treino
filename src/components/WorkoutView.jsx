import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Trophy, Star, ChevronLeft, ChevronRight, Play, Pause, Trash2, Timer as TimerIcon, Camera, X } from 'lucide-react'; 
import CyberCalendar from './CyberCalendar';
import RestTimer from './RestTimer'; 
import BossBattle from './BossBattle'; // <--- Importado corretamente

// --- FUNÇÕES AUXILIARES ---

const cleanString = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, ""); 
};

// Parse seguro de números (aceita vírgula e ponto)
const safeParseFloat = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(',', '.')) || 0;
};

// COMPARADOR DE NOMES (Otimizado)
const isSameExercise = (currentName, historyName) => {
  const currentKey = cleanString(currentName);
  const historyKey = cleanString(historyName);

  // 1. Match Exato ou Contém
  if (currentKey === historyKey) return true;
  if (historyKey.includes(currentKey)) return true;
  if (currentKey.includes(historyKey) && historyKey.length > 4) return true; 

  // 2. Sinônimos Específicos (Sua lista personalizada)
  const synonyms = {
    "rosca45": ["incline", "banco", "inclinada", "45"],
    "crossover": ["poliaalta", "napoliaalta", "alta", "escapulas", "crossoverpoliaalta", "crossovernapoliaalta", "cross"],
    "elevacaopelvica": ["quadril", "pelvica", "elevacao"],
    "cadeiraabdutora": ["abducao", "abdutora"],
    "mesaflexora": ["flexora"],
    "cadeiraextensora": ["extensora"],
    "serrote": ["remadaunilateral", "unilateral"],
    "tricepspulley": ["tricepsnapolia", "tricepscorda", "barrareta", "volume", "polia"],
    "tricepscorda": ["tricepsnapolia", "tricepspulley"],
    "agachamentolivre": ["agachamento"],
    "legpress": ["legpress45", "pesafastados"],
    "abdominalinfra": ["abdominal"],
    "vacuum": ["stomachvacuum"],
    "supinoinclinado": ["supinoinclinado", "controlar", "halter"],
    "crucifixoinverso": ["halter", "postural", "cifose", "substituto"] 
  };

  if (synonyms[currentKey]) {
    return synonyms[currentKey].some(syn => historyKey.includes(syn));
  }
  
  // Tenta o inverso (se o nome histórico for a chave)
  if (synonyms[historyKey]) {
    return synonyms[historyKey].some(syn => currentKey.includes(syn));
  }

  return false;
};

// Tradutor de Datas para Ordenação
const parseDateTimestamp = (dateStr) => {
    if (!dateStr) return 0;
    try {
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
            }
        }
        return new Date(dateStr).getTime();
    } catch (e) { return 0; }
};

const calculate1RM = (weight, reps) => {
  const w = safeParseFloat(weight);
  const r = safeParseFloat(reps);
  if (!w || !r || r === 0) return null;
  return Math.round(w * (1 + r / 30));
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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

  const days = Object.keys(workoutData || {}); 
  const currentDayIndex = days.indexOf(activeDay);

  const handlePrevDay = () => {
    const newIndex = currentDayIndex === 0 ? days.length - 1 : currentDayIndex - 1;
    setActiveDay(days[newIndex]);
  };

  const handleNextDay = () => {
    const newIndex = currentDayIndex === days.length - 1 ? 0 : currentDayIndex + 1;
    setActiveDay(days[newIndex]);
  };

  const dateObj = new Date(selectedDate + 'T00:00:00');
  
  const isWeightSynced = bodyHistory?.some(h => h.date === selectedDate.split('-').reverse().join('/') && h.weight == weightInput && weightInput !== '');
  const isWaistSynced = bodyHistory?.some(h => h.date === selectedDate.split('-').reverse().join('/') && h.waist == waistInput && waistInput !== '');
  const hasStarted = workoutTimer?.elapsed > 0 || workoutTimer?.isRunning;
  
  const currentEntry = bodyHistory?.find(h => h.date === selectedDate.split('-').reverse().join('/'));
  const hasPhoto = !!currentEntry?.photo;

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => saveBiometrics(reader.result);
        reader.readAsDataURL(file);
    }
  };

  const openRestTimer = (seconds = 60) => {
    setRestTimerConfig({ isOpen: true, duration: seconds });
  };

  const toggleSetComplete = (id, setIndex) => {
    const currentStatus = progress[id]?.sets?.[setIndex]?.completed || false;
    updateSetData(id, setIndex, 'completed', !currentStatus);
    if (!currentStatus) {
      openRestTimer(60); 
    }
  };

  // 🔥 CÁLCULO DE DANO NO BOSS (VOLUME TOTAL DO TREINO ATUAL)
  const currentSessionVolume = Object.keys(progress).reduce((total, key) => {
     // Verifica se o exercício pertence ao dia e data selecionados
     if (key.startsWith(`${selectedDate}-${activeDay}`)) {
        const exerciseProgress = progress[key];
        if (exerciseProgress?.sets) {
           return total + exerciseProgress.sets.reduce((exTotal, set) => {
              // Só conta se a série estiver completada (check verde)
              if (set.completed) {
                 const w = safeParseFloat(set.weight);
                 const r = safeParseFloat(set.reps);
                 // Se for peso do corpo (0kg), considera 50kg fictícios pro Boss não ficar imortal
                 const effectiveWeight = w > 0 ? w : 50; 
                 return exTotal + (effectiveWeight * r);
              }
              return exTotal;
           }, 0);
        }
     }
     return total;
  }, 0);

  return (
    <>
      <main className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-28 relative w-full">
        
        {/* PAINEL SUPERIOR */}
        <div className="bg-card border-2 border-border p-5 rounded-3xl relative overflow-hidden group shadow-lg z-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
          <div className="flex flex-col gap-5 relative z-10">
            <div onClick={() => setIsCalendarOpen(true)} className="flex items-center justify-between cursor-pointer group/calendar">
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-primary uppercase tracking-[0.3em] mb-1">DATA_DA_MISSÃO</span>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-black text-main italic leading-none">{selectedDate.split('-').reverse()[0]}</span>
                   <span className="text-sm font-bold text-muted uppercase">{dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg border transition-all ${isCalendarOpen ? 'bg-primary text-black' : 'bg-input text-primary border-primary/30'}`}>
                <Calendar size={20} />
              </div>
            </div>
            <div className="h-[1px] w-full bg-border/50"></div>
            
            {!hasStarted ? (
              <button onClick={toggleWorkoutTimer} className="w-full py-4 rounded-xl bg-primary/10 border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all group flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(var(--primary),0.2)] active:scale-95">
                 <Play size={24} className="fill-current" />
                 <span className="font-black italic text-xl tracking-widest">INICIAR TREINO</span>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-black/40 border border-primary/50 p-4 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${workoutTimer.isRunning ? 'bg-primary text-black animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                       <TimerIcon size={20} className={workoutTimer.isRunning ? "animate-spin-slow" : ""} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">{workoutTimer.isRunning ? 'EM ANDAMENTO' : 'PAUSADO'}</span>
                       <span className={`text-3xl font-mono font-black leading-none tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${workoutTimer.isRunning ? 'text-white' : 'text-gray-400'}`}>
                          {formatTime(workoutTimer.elapsed)}
                       </span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={toggleWorkoutTimer} className="p-2 rounded-lg bg-gray-800 border border-gray-600 hover:border-primary hover:text-primary transition-all active:scale-95">
                         {workoutTimer.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                     </button>
                     <button onClick={resetWorkoutTimer} className="p-2 rounded-lg bg-red-900/30 border border-red-800 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                         <Trash2 size={20} />
                     </button>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="relative">
                <span className={`absolute top-2 left-3 text-[7px] font-black uppercase tracking-widest z-10 ${isWeightSynced ? 'text-success' : 'text-muted'}`}>MASSA (KG)</span>
                <input type="number" step="0.1" placeholder={String(latestStats?.weight || '--')} value={weightInput || ''} onChange={(e) => setWeightInput(e.target.value)} className={`w-full bg-input border-2 rounded-xl pt-9 pb-5 px-3 font-black text-center outline-none transition-all text-2xl ${isWeightSynced ? 'border-success/50 text-success' : 'border-border text-main focus:border-primary'}`} />
                {!isWeightSynced && weightInput !== '' && (<button onClick={() => saveBiometrics()} className="absolute right-2 bottom-2 text-success"><CheckCircle2 size={14}/></button>)}
              </div>
              <div className="relative flex gap-2">
                 <div className="relative flex-1">
                    <span className={`absolute top-2 left-3 text-[9px] font-black uppercase tracking-widest z-10 ${isWaistSynced ? 'text-primary' : 'text-muted'}`}>CINTURA (CM)</span>
                    <input type="number" step="0.1" placeholder={String(latestStats?.waist || '--')} value={waistInput || ''} onChange={(e) => setWaistInput(e.target.value)} className={`w-full bg-input border-2 rounded-xl pt-9 pb-5 px-3 font-black text-center outline-none transition-all text-2xl ${isWaistSynced ? 'border-primary/50 text-primary' : 'border-border text-main focus:border-primary'}`} />
                    {!isWaistSynced && waistInput !== '' && (<button onClick={() => saveBiometrics()} className="absolute right-2 bottom-2 text-primary"><CheckCircle2 size={14}/></button>)}
                 </div>
                 <label className={`w-14 h-full rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${hasPhoto ? 'border-secondary bg-secondary/20' : 'border-border bg-card hover:border-primary'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Camera size={20} className={hasPhoto ? "text-secondary" : "text-muted"} />
                 </label>
              </div>
            </div>
          </div>
        </div>

        {/* --- ⚔️ BOSS BATTLE ⚔️ --- */}
        <div className="animate-in slide-in-from-top-4 duration-700 delay-100 z-0">
           <BossBattle currentVolume={currentSessionVolume} />
        </div>

        {/* NAVEGAÇÃO */}
        <div className="relative py-2 z-0">
          <div className="flex items-center justify-between gap-4">
            <button onClick={handlePrevDay} className="p-3 rounded-xl bg-card border border-border text-muted hover:text-primary hover:border-primary active:scale-95 transition-all shadow-sm"><ChevronLeft size={24} /></button>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-black text-secondary tracking-[0.4em] uppercase mb-1 animate-pulse">PROTOCOLO_ATUAL</span>
              <h2 className="text-xl md:text-4xl font-black text-main uppercase italic leading-none drop-shadow-md">{workoutData?.[activeDay]?.title || 'Treino Desconhecido'}</h2>
              <span className="text-[10px] font-bold text-muted mt-1 uppercase">{activeDay}</span>
            </div>
            <button onClick={handleNextDay} className="p-3 rounded-xl bg-card border border-border text-muted hover:text-primary hover:border-primary active:scale-95 transition-all shadow-sm"><ChevronRight size={24} /></button>
          </div>
          <div className="flex justify-center gap-1.5 mt-4">
            {days.map((day, idx) => (
              <div key={day} onClick={() => setActiveDay(day)} className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentDayIndex ? 'w-8 bg-primary shadow-[0_0_10px_rgb(var(--primary))]' : 'w-2 bg-border hover:bg-muted'}`}></div>
            ))}
          </div>
        </div>

        {/* LISTAGEM DE EXERCÍCIOS */}
        <div className="space-y-6 z-0">
          {workoutData?.[activeDay]?.exercises?.map((ex, i) => {
            const id = `${selectedDate}-${activeDay}-${i}`;
            const isDone = progress[id]?.done;
            const isTimeBased = ex.sets.toLowerCase().includes('min') || ex.sets.toLowerCase().includes('seg') || ex.sets.toLowerCase().includes('s') || !ex.sets.includes('x');
            const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

            // 1. Busca e Filtra (usando a função isSameExercise corrigida)
            const exerciseHistory = (history || [])
              .flatMap(s => s.exercises.map(e => ({...e, date: s.date})))
              .filter(e => isSameExercise(ex.name, e.name));

            // 2. Recorde
            const exercisePR = exerciseHistory.reduce((max, e) => {
                const sessionMax = Math.max(...(e.sets?.map(s => safeParseFloat(s.weight)) || [0]));
                return Math.max(max, sessionMax);
            }, 0);
            
            // 3. Última Carga
            const lastWorkoutEntry = [...exerciseHistory]
                .sort((a, b) => parseDateTimestamp(b.date) - parseDateTimestamp(a.date))
                .find(entry => entry.sets && entry.sets.some(s => safeParseFloat(s.weight) > 0));
            
            const lastWeight = lastWorkoutEntry ? Math.max(...(lastWorkoutEntry.sets?.map(s => safeParseFloat(s.weight)) || [0])) : 0;
            const isBreakingPR = (progress[id]?.sets || []).some(s => safeParseFloat(s.weight) > exercisePR && exercisePR > 0);

            return (
              <div key={id} className={`p-5 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden ${isBreakingPR ? 'border-warning shadow-[0_0_20px_rgba(var(--warning),0.2)] bg-warning/5' : isDone ? 'border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-black/40' : 'bg-card border-border hover:border-primary/30'}`}>
                
                {isDone && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-primary/10 text-primary/10 font-black text-6xl uppercase pointer-events-none whitespace-nowrap z-0 select-none">CONCLUÍDO</div>)}
                
                {exercisePR > 0 && (
                  <div className={`absolute top-0 right-12 px-2 py-0.5 rounded-b-md flex items-center gap-1 z-20 border-x border-b ${isBreakingPR ? 'bg-warning border-warning text-black' : 'bg-input border-border text-muted'}`}>
                    <Trophy size={8} className={isBreakingPR ? "fill-black" : ""} />
                    <span className="text-[7px] font-black uppercase tracking-widest">{exercisePR}KG</span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex-1">
                    <h3 className={`font-black text-2xl leading-tight transition-colors flex items-center gap-2 ${isBreakingPR ? 'text-warning' : isDone ? 'text-primary' : 'text-main'}`}>
                      {ex.name}
                      {isBreakingPR && <Star size={16} className="text-warning fill-warning animate-pulse" />}
                    </h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                       {lastWeight > 0 && (<span className="text-[10px] font-mono text-muted border border-border px-1.5 py-0.5 rounded bg-black/20">Último: {lastWeight}kg</span>)}
                       <p className="text-sm text-muted font-bold uppercase tracking-tighter italic">{ex.note}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleCheck(id)} className={`ml-4 p-2 rounded-full transition-all duration-500 border-2 ${isDone ? 'border-primary text-primary shadow-[0_0_20px_var(--primary)] bg-transparent scale-110' : 'border-border text-muted hover:border-primary hover:text-white'}`}>
                    <CheckCircle2 size={32} />
                  </button>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3 bg-input/50 p-3 rounded-xl border border-border group-focus-within:border-primary/50 transition-all shadow-inner">
                    <span className="text-xs font-black text-muted uppercase tracking-widest">{isTimeBased ? 'Tempo_Alvo' : 'Ciclos'}</span>
                    <input type={isTimeBased ? "text" : "number"} className="bg-transparent text-primary font-black outline-none w-24 text-center text-xl border-b border-primary/30" value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")} onChange={(e) => updateSessionSets(id, e.target.value)} />
                  </div>
                  
                  {!isTimeBased && (
                    <div className="grid gap-3">
                      {Array.from({ length: currentSetCount }).map((_, setIdx) => {
                        const isSetDone = progress[id]?.sets?.[setIdx]?.completed;
                        return (
                        <div key={setIdx} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${isSetDone ? 'bg-primary/10 border border-primary/30' : 'bg-transparent border border-transparent'}`}>
                          
                          <button 
                              onClick={() => toggleSetComplete(id, setIdx)}
                              className={`h-10 w-10 flex items-center justify-center rounded-full border-2 transition-all active:scale-90 ${isSetDone ? 'bg-primary text-black border-primary shadow-[0_0_10px_var(--primary)]' : 'bg-input border-border text-muted hover:border-primary hover:text-primary'}`}
                          >
                              {isSetDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>

                          <span className="text-base font-black text-muted w-6">#{setIdx + 1}</span>
                          <div className="flex-1 flex gap-2 items-center">
                              <input 
                                type="text"
                                inputMode="decimal"
                                placeholder="KG" 
                                value={progress[id]?.sets?.[setIdx]?.weight || ""} 
                                onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)} 
                                className={`w-full bg-input border rounded-lg p-3 font-black text-xl outline-none transition-all text-center ${safeParseFloat(progress[id]?.sets?.[setIdx]?.weight) > exercisePR && exercisePR > 0 ? 'border-warning text-warning shadow-[0_0_15px_rgba(var(--warning),0.2)]' : 'border-border text-success focus:border-success/50'}`} 
                              />
                              <input type="text" placeholder="REPS" value={progress[id]?.sets?.[setIdx]?.reps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)} 
                                className="w-full bg-input border border-border rounded-lg p-3 text-secondary font-black text-xl outline-none focus:border-secondary/50 transition-all text-center" 
                              />
                              {(() => {
                                 const w = progress[id]?.sets?.[setIdx]?.weight;
                                 const r = progress[id]?.sets?.[setIdx]?.reps;
                                 const oneRM = calculate1RM(w, r);
                                 if (oneRM) return (<div className="flex flex-col justify-center items-center min-w-[35px] animate-in zoom-in duration-300"><span className="text-[6px] text-muted font-black uppercase leading-none">1RM</span><span className="text-[10px] text-secondary font-black font-mono leading-none">{oneRM}</span></div>);
                              })()}
                            </div>
                          </div>
                      )})}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* FOOTER */}
        <div className="space-y-5 pt-7 pb-5 z-0">
          <textarea placeholder="Relatório de danos e observações do sistema..." className="w-full bg-card border-2 border-border rounded-2xl p-4 text-xl font-bold h-28 outline-none focus:border-primary/50 transition-all text-main placeholder-muted" value={sessionNote} onChange={(e) => setSessionNote(e.target.value)} />
          <button onClick={finishWorkout} className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary py-5 font-black text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)] active:scale-[0.97] transition-all hover:shadow-[0_0_40px_rgba(var(--primary),0.5)]">
            <span className="relative z-10 uppercase tracking-[0.3em] text-sm italic flex items-center justify-center gap-2"><Star size={16} fill="white" /> EFETIVAR ALTERAÇÕES</span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </button>
        </div>

        {isCalendarOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-muted hover:text-primary transition-all"><X size={32} /></button>
              <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
            </div>
          </div>
        )}
      </main>

      {/* --- TIMERS FORA DA TAG MAIN --- */}
      {timerState && timerState.active && <RestTimer initialSeconds={timerState.seconds} onClose={closeTimer} />}
      {restTimerConfig.isOpen && <RestTimer initialSeconds={restTimerConfig.duration} onClose={() => setRestTimerConfig({ ...restTimerConfig, isOpen: false })} />}
      
    </>
  );
};

export default WorkoutView;