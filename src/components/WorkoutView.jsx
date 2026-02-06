import React, { useState } from 'react';
import { Calendar, CheckCircle2, Zap, Cpu, X, Trophy, Star, ChevronLeft, ChevronRight, Play, Pause, Trash2, Timer as TimerIcon, Camera, History } from 'lucide-react'; // 🔥 Adicionei History
import CyberCalendar from './CyberCalendar';
import RestTimer from './RestTimer'; 

// Função para calcular 1RM (Fórmula de Epley)
const calculate1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseFloat(reps);
  if (!w || !r || r === 0) return null;
  return Math.round(w * (1 + r / 30));
};

// Helper para formatar HH:MM:SS
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
  // Props do Timer
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // 🔥 NOVO: Estado para o Timer de Descanso Rápido (Por série)
  const [restTimerConfig, setRestTimerConfig] = useState({ isOpen: false, duration: 60 });

  // Array ordenado dos dias para navegação
  const days = Object.keys(workoutData); 
  const currentDayIndex = days.indexOf(activeDay);

  // Funções de Navegação Tática
  const handlePrevDay = () => {
    const newIndex = currentDayIndex === 0 ? days.length - 1 : currentDayIndex - 1;
    setActiveDay(days[newIndex]);
  };

  const handleNextDay = () => {
    const newIndex = currentDayIndex === days.length - 1 ? 0 : currentDayIndex + 1;
    setActiveDay(days[newIndex]);
  };

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedSelectedDate = selectedDate.split('-').reverse().join('/');
  
  // Verifica se temos foto para hoje
  const currentEntry = bodyHistory?.find(h => h.date === formattedSelectedDate);
  const hasPhoto = !!currentEntry?.photo;

  const isWeightSynced = bodyHistory?.some(h => h.date === formattedSelectedDate && h.weight == weightInput && weightInput !== '');
  const isWaistSynced = bodyHistory?.some(h => h.date === formattedSelectedDate && h.waist == waistInput && waistInput !== '');

  // Verifica se o timer começou
  const hasStarted = workoutTimer?.elapsed > 0 || workoutTimer?.isRunning;

  // 📸 Lógica de Upload de Foto
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            saveBiometrics(reader.result);
        };
        reader.readAsDataURL(file);
    }
  };

  // 🔥 NOVO: Função para abrir o timer rápido
  const openRestTimer = (seconds = 60) => {
    setRestTimerConfig({ isOpen: true, duration: seconds });
  };

  return (
    <main className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-28 relative">
      
      {/* RENDERIZAÇÃO DO TIMER FLUTUANTE GLOBAL (MANTIDO) */}
      {timerState && timerState.active && (
         <RestTimer 
            initialSeconds={timerState.seconds} 
            onClose={closeTimer} 
         />
      )}

      {/* 🔥 NOVO: RENDERIZAÇÃO DO TIMER DE SÉRIE */}
      {restTimerConfig.isOpen && (
         <RestTimer 
            initialSeconds={restTimerConfig.duration} 
            onClose={() => setRestTimerConfig({ ...restTimerConfig, isOpen: false })} 
         />
      )}

      {/* 🛠️ PAINEL DE CONTROLE SUPERIOR */}
      <div className="bg-card border-2 border-border p-5 rounded-3xl relative overflow-hidden group shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
        
        <div className="flex flex-col gap-5 relative z-10">
          
          {/* SELETOR DE DATA */}
          <div 
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center justify-between cursor-pointer group/calendar"
          >
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-primary uppercase tracking-[0.3em] mb-1">DATA_DA_MISSÃO</span>
              <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-black text-main italic leading-none">
                    {selectedDate.split('-').reverse()[0]}
                 </span>
                 <span className="text-sm font-bold text-muted uppercase">
                    {dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}
                 </span>
              </div>
            </div>
            
            <div className={`p-2 rounded-lg border transition-all ${isCalendarOpen ? 'bg-primary text-black' : 'bg-input text-primary border-primary/30'}`}>
              <Calendar size={20} />
            </div>
          </div>

          <div className="h-[1px] w-full bg-border/50"></div>

          {/* CRONÔMETRO DE TREINO */}
          {!hasStarted ? (
            <button 
              onClick={toggleWorkoutTimer}
              className="w-full py-4 rounded-xl bg-primary/10 border-2 border-primary text-primary hover:bg-primary hover:text-black transition-all group flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(var(--primary),0.2)] active:scale-95"
            >
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
                     <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">
                        {workoutTimer.isRunning ? 'EM ANDAMENTO' : 'PAUSADO'}
                     </span>
                     <span className={`text-3xl font-mono font-black leading-none tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${workoutTimer.isRunning ? 'text-white' : 'text-gray-400'}`}>
                        {formatTime(workoutTimer.elapsed)}
                     </span>
                  </div>
               </div>
               
               <div className="flex gap-2">
                   <button 
                     onClick={toggleWorkoutTimer} 
                     className="p-2 rounded-lg bg-gray-800 border border-gray-600 hover:border-primary hover:text-primary transition-all active:scale-95"
                   >
                       {workoutTimer.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                   </button>
                   
                   <button 
                     onClick={resetWorkoutTimer} 
                     className="p-2 rounded-lg bg-red-900/30 border border-red-800 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                   >
                       <Trash2 size={20} />
                   </button>
               </div>
            </div>
          )}

          {/* SENSORES BIOMÉTRICOS & FOTO */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* PESO */}
            <div className="relative">
              <span className={`absolute top-2 left-3 text-[7px] font-black uppercase tracking-widest z-10 ${isWeightSynced ? 'text-success' : 'text-muted'}`}>
                 MASSA (KG)
              </span>
              <input 
                type="number" step="0.1" 
                placeholder={String(latestStats?.weight || '--')} 
                value={weightInput || ''} 
                onChange={(e) => setWeightInput(e.target.value)} 
                className={`w-full bg-input border-2 rounded-xl pt-9 pb-5 px-3 font-black text-center outline-none transition-all text-2xl
                  ${isWeightSynced ? 'border-success/50 text-success' : 'border-border text-main focus:border-primary'}`}
              />
              {!isWeightSynced && weightInput !== '' && (
                 <button onClick={() => saveBiometrics()} className="absolute right-2 bottom-2 text-success"><CheckCircle2 size={14}/></button>
              )}
            </div>

            {/* CINTURA + CÂMERA */}
            <div className="relative flex gap-2">
               <div className="relative flex-1">
                  <span className={`absolute top-2 left-3 text-[9px] font-black uppercase tracking-widest z-10 ${isWaistSynced ? 'text-primary' : 'text-muted'}`}>
                     CINTURA (CM)
                  </span>
                  <input 
                    type="number" step="0.1" 
                    placeholder={String(latestStats?.waist || '--')} 
                    value={waistInput || ''}
                    onChange={(e) => setWaistInput(e.target.value)} 
                    className={`w-full bg-input border-2 rounded-xl pt-9 pb-5 px-3 font-black text-center outline-none transition-all text-2xl
                      ${isWaistSynced ? 'border-primary/50 text-primary' : 'border-border text-main focus:border-primary'}`}
                  />
                  {!isWaistSynced && waistInput !== '' && (
                      <button onClick={() => saveBiometrics()} className="absolute right-2 bottom-2 text-primary"><CheckCircle2 size={14}/></button>
                  )}
               </div>

               <label className={`w-14 h-full rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${hasPhoto ? 'border-secondary bg-secondary/20' : 'border-border bg-card hover:border-primary'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <Camera size={20} className={hasPhoto ? "text-secondary" : "text-muted"} />
               </label>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 NAVEGAÇÃO TÁTICA */}
      <div className="relative py-2">
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={handlePrevDay}
            className="p-3 rounded-xl bg-card border border-border text-muted hover:text-primary hover:border-primary active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-secondary tracking-[0.4em] uppercase mb-1 animate-pulse">
                PROTOCOLO_ATUAL
            </span>
            <h2 className="text-xl md:text-4xl font-black text-main uppercase italic leading-none drop-shadow-md">
              {workoutData[activeDay]?.title || 'Treino Desconhecido'}
            </h2>
            <span className="text-[10px] font-bold text-muted mt-1 uppercase">
              {activeDay}
            </span>
          </div>

          <button 
            onClick={handleNextDay}
            className="p-3 rounded-xl bg-card border border-border text-muted hover:text-primary hover:border-primary active:scale-95 transition-all shadow-sm"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Indicador de Progresso (Dots) */}
        <div className="flex justify-center gap-1.5 mt-4">
          {days.map((day, idx) => (
            <div 
              key={day}
              onClick={() => setActiveDay(day)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer 
                ${idx === currentDayIndex 
                  ? 'w-8 bg-primary shadow-[0_0_10px_rgb(var(--primary))]' 
                  : 'w-2 bg-border hover:bg-muted'}`}
            ></div>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE EXERCÍCIOS */}
      <div className="space-y-6">
        {workoutData[activeDay]?.exercises.map((ex, i) => {
          const id = `${selectedDate}-${activeDay}-${i}`;
          const isDone = progress[id]?.done;
          
          const isTimeBased = ex.sets.toLowerCase().includes('min') || 
                              ex.sets.toLowerCase().includes('seg') || 
                              ex.sets.toLowerCase().includes('s') ||
                              !ex.sets.includes('x');
          const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

          // 🔥 LÓGICA DE RECORDE (PR) MELHORADA: Ignora maiúsculas e espaços
          const exercisePR = (history || [])
            .flatMap(s => s.exercises)
            .filter(e => e.name.trim().toLowerCase() === ex.name.trim().toLowerCase())
            .reduce((max, e) => {
              const sessionMax = Math.max(...(e.sets?.map(s => parseFloat(s.weight) || 0) || [0]));
              return Math.max(max, sessionMax);
            }, 0);
          
          const isBreakingPR = (progress[id]?.sets || []).some(s => parseFloat(s.weight) > exercisePR && exercisePR > 0);

          return (
            <div key={id} className={`p-5 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden 
              ${isBreakingPR ? 'border-warning shadow-[0_0_20px_rgba(var(--warning),0.2)] bg-warning/5' : 
                isDone ? 'border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-black/40' : // 🔥 CORREÇÃO: Fundo escuro transparente + Borda Neon
                'bg-card border-border hover:border-primary/30'}`}>
              
              {/* Marca D'água de Concluído */}
              {isDone && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-primary/10 text-primary/10 font-black text-6xl uppercase pointer-events-none whitespace-nowrap z-0 select-none">
                    CONCLUÍDO
                </div>
              )}
              
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
                  <p className="text-sm text-muted font-bold uppercase tracking-tighter mt-1 italic">{ex.note}</p>
                </div>
                
                {/* 🔥 CORREÇÃO DO CHECK: Botão vazado e brilhante */}
                <button 
                  onClick={() => toggleCheck(id)} 
                  className={`ml-4 p-2 rounded-full transition-all duration-500 border-2 
                  ${isDone 
                      ? 'border-primary text-primary shadow-[0_0_20px_var(--primary)] bg-transparent scale-110' 
                      : 'border-border text-muted hover:border-primary hover:text-white'}`}
                >
                  <CheckCircle2 size={32} />
                </button>
              </div>
              
              <div className="space-y-4 relative z-10">
                {/* INPUT DE CICLOS (SETS) */}
                <div className="flex items-center gap-3 bg-input/50 p-3 rounded-xl border border-border group-focus-within:border-primary/50 transition-all shadow-inner">
                  <span className="text-xs font-black text-muted uppercase tracking-widest">
                    {isTimeBased ? 'Tempo_Alvo' : 'Ciclos'}
                  </span>
                  <input 
                    type={isTimeBased ? "text" : "number"} 
                    className="bg-transparent text-primary font-black outline-none w-24 text-center text-xl border-b border-primary/30" 
                    value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")} 
                    onChange={(e) => updateSessionSets(id, e.target.value)} 
                  />
                </div>
                
                {!isTimeBased && (
                  <div className="grid gap-3">
                    {Array.from({ length: currentSetCount }).map((_, setIdx) => (
                      <div key={setIdx} className="flex items-center gap-3 group/row">
                        
                        {/* 🔥 NOVO: Botão de Timer por Série */}
                        <button 
                            onClick={() => openRestTimer(60)} // Abre 60s
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-input border border-border text-muted hover:text-primary hover:border-primary active:scale-90 transition-all"
                            title="Descansar"
                        >
                            <History size={18} />
                        </button>

                        <span className="text-base font-black text-muted w-6 group-focus-within/row:text-primary transition-colors">#{setIdx + 1}</span>
                        <div className="flex-1 flex gap-2 items-center">
                            {/* Input de Peso */}
                            <input 
                              type="text" placeholder="KG" 
                              value={progress[id]?.sets?.[setIdx]?.weight || ""} 
                              onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)} 
                              className={`w-full bg-input border rounded-lg p-3 font-black text-xl outline-none transition-all text-center
                                ${parseFloat(progress[id]?.sets?.[setIdx]?.weight) > exercisePR && exercisePR > 0 
                                  ? 'border-warning text-warning shadow-[0_0_15px_rgba(var(--warning),0.2)]' 
                                  : 'border-border text-success focus:border-success/50'}`} 
                            />
                            
                            {/* Input de Reps */}
                            <input 
                              type="text" placeholder="REPS" 
                              value={progress[id]?.sets?.[setIdx]?.reps || ""} 
                              onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)} 
                              className="w-full bg-input border border-border rounded-lg p-3 text-secondary font-black text-xl outline-none focus:border-secondary/50 transition-all text-center" 
                            />

                            {/* MOSTRADOR DE 1RM */}
                            {(() => {
                               const w = progress[id]?.sets?.[setIdx]?.weight;
                               const r = progress[id]?.sets?.[setIdx]?.reps;
                               const oneRM = calculate1RM(w, r);
                               
                               if (oneRM) return (
                                   <div className="flex flex-col justify-center items-center min-w-[35px] animate-in zoom-in duration-300">
                                       <span className="text-[6px] text-muted font-black uppercase leading-none">1RM</span>
                                       <span className="text-[10px] text-secondary font-black font-mono leading-none">{oneRM}</span>
                                   </div>
                               );
                            })()}
                          </div>
                        </div>
                        ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* FOOTER - BOTÃO EFETIVAR */}
      <div className="space-y-5 pt-7 pb-5">
        <textarea 
          placeholder="Relatório de danos e observações do sistema..." 
          className="w-full bg-card border-2 border-border rounded-2xl p-4 text-xl font-bold h-28 outline-none focus:border-primary/50 transition-all text-main placeholder-muted" 
          value={sessionNote} 
          onChange={(e) => setSessionNote(e.target.value)} 
        />
        <button 
          onClick={finishWorkout} 
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary py-5 font-black text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)] active:scale-[0.97] transition-all hover:shadow-[0_0_40px_rgba(var(--primary),0.5)]"
        >
          <span className="relative z-10 uppercase tracking-[0.3em] text-sm italic flex items-center justify-center gap-2">
             <Star size={16} fill="white" /> EFETIVAR ALTERAÇÕES
          </span>
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </button>
      </div>

      {/* MODAL CALENDÁRIO */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-muted hover:text-primary transition-all"><X size={32} /></button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}
    </main>
  );
};

export default WorkoutView;