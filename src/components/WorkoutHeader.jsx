import React, { useState } from 'react';
import { Calendar, Play, Pause, Trash2, Timer as TimerIcon, X, AlertTriangle } from 'lucide-react';
import CyberCalendar from './CyberCalendar';
import { formatTime } from '../utils/workoutUtils';

const WorkoutHeader = ({ 
  selectedDate, setSelectedDate, isCalendarOpen, setIsCalendarOpen,
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer,
  isTutorialDay 
}) => {
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const hasStarted = workoutTimer?.elapsed > 0 || workoutTimer?.isRunning;

  const confirmReset = () => {
    resetWorkoutTimer();
    setIsResetModalOpen(false);
  };

  return (
    <div className="bg-card border border-border p-3 rounded-2xl relative overflow-hidden group shadow-sm z-10">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
      
      <div className="flex flex-col gap-3 relative z-10">
        
        {/* SEÇÃO DE DATA / CALENDÁRIO */}
        <div onClick={() => setIsCalendarOpen(true)} className="flex items-center justify-between cursor-pointer group/calendar">
          <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-main dark:text-white leading-none">{selectedDate.split('-').reverse()[0]}</span>
              <span className="text-xs font-bold text-muted uppercase">{dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest ml-2 opacity-50">DATA_DA_MISSÃO</span>
          </div>
          <div className={`p-1.5 rounded-lg border transition-all ${isCalendarOpen ? 'bg-primary text-black' : 'bg-input text-primary border-primary/30'}`}>
            <Calendar size={16} />
          </div>
        </div>
        
        {!isTutorialDay && (
          <>
            <div className="h-[1px] w-full bg-border/30"></div>
            
            {/* SEÇÃO DO CRONÔMETRO DE TREINO */}
            {!hasStarted ? (
              /* BOTÃO "GRITANDO": Neon Glow + Pulsing + High Contrast (Já estava ótimo) */
              <button 
                onClick={toggleWorkoutTimer} 
                className="w-full py-2 rounded-xl bg-primary/10 border-2 border-primary text-primary transition-all duration-300 group flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_35px_rgba(var(--primary),0.5)] hover:bg-primary/20 active:scale-95 animate-pulse"
              >
                  <Play size={20} className="fill-primary drop-shadow-[0_0_4px_rgba(var(--primary),0.8)]" />
                  <span className="font-black text-base tracking-[0.2em] uppercase text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
                    INICIAR OPERAÇÃO
                  </span>
              </button>
            ) : (
              /* 🔥 AJUSTE: bg-input/50 para o claro, dark:bg-black/40 para o escuro */
              <div className="flex items-center justify-between bg-input/50 dark:bg-black/40 border border-primary/30 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    {/* 🔥 AJUSTE: Cores inativas seguras (bg-input border-border text-muted) */}
                    <div className={`p-1.5 rounded transition-colors ${workoutTimer.isRunning ? 'bg-primary text-black animate-pulse' : 'bg-input dark:bg-gray-800 text-muted'}`}>
                       <TimerIcon size={16} />
                    </div>
                    {/* 🔥 AJUSTE: text-main dark:text-white para garantir o contraste */}
                    <span className={`text-xl font-mono font-black leading-none tracking-wider ${workoutTimer.isRunning ? 'text-main dark:text-white' : 'text-muted'}`}>
                       {formatTime(workoutTimer.elapsed)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                      {/* 🔥 AJUSTE: Remoção do gray-800 fixo do botão */}
                      <button onClick={toggleWorkoutTimer} className="p-1.5 rounded bg-card dark:bg-gray-800 border border-border dark:border-gray-600 text-main dark:text-white hover:text-primary dark:hover:text-primary transition-all">
                          {workoutTimer.isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      </button>
                      
                      {/* 🔥 AJUSTE: bg-red-500/10 para não ficar vinho-escuro no modo claro */}
                      <button onClick={() => setIsResetModalOpen(true)} className="p-1.5 rounded bg-red-500/10 dark:bg-red-900/30 border border-red-500/50 dark:border-red-800 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={16} />
                      </button>
                  </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DO CALENDÁRIO CUSTOMIZADO */}
      {isCalendarOpen && (
        // 🔥 AJUSTE: Overlay ajustado para bg-black/60 dark:bg-black/80
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* 🔥 AJUSTE: Hover mudou para hover:text-red-500 por segurança */}
            <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-muted hover:text-red-500 transition-all">
              <X size={32} />
            </button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE ZERAR */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* 🔥 AJUSTE: bg-black/60 dark:bg-black/90 */}
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md" onClick={() => setIsResetModalOpen(false)}></div>
          <div className="bg-card border-2 border-red-500 w-full max-w-sm p-8 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.2)] relative z-10 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-red-500 mb-2 text-xl">Abortar Operação?</h3>
            <p className="text-muted text-sm font-bold mb-8 uppercase tracking-tighter">
              Você está prestes a zerar o tempo desta missão. O tempo registrado será perdido.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmReset} className="w-full p-4 rounded-xl bg-red-500 text-white font-black uppercase text-xs hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95">
                ZERAR CRONÔMETRO
              </button>
              {/* 🔥 AJUSTE: hover:text-main dark:hover:text-white */}
              <button onClick={() => setIsResetModalOpen(false)} className="w-full p-4 rounded-xl border border-border text-muted font-black uppercase text-xs hover:text-main dark:hover:text-white transition-all">
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutHeader;