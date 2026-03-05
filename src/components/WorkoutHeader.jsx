// src/components/WorkoutHeader.jsx
import React, { useState } from 'react';
import { Calendar, Play, Pause, Trash2, Timer as TimerIcon, X, AlertTriangle } from 'lucide-react';
import CyberCalendar from './CyberCalendar';
import { formatTime } from '../utils/workoutUtils';

const WorkoutHeader = ({ 
  selectedDate, setSelectedDate, isCalendarOpen, setIsCalendarOpen,
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer,
  isTutorialDay 
}) => {
  
  // 🔥 NOVO ESTADO PARA O MODAL DE EXCLUSÃO
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
              <span className="text-xl font-black text-main italic leading-none">{selectedDate.split('-').reverse()[0]}</span>
              <span className="text-xs font-bold text-muted uppercase">{dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest ml-2 opacity-50">DATA_DA_MISSÃO</span>
          </div>
          <div className={`p-1.5 rounded-lg border transition-all ${isCalendarOpen ? 'bg-primary text-black' : 'bg-input text-primary border-primary/30'}`}>
            <Calendar size={16} />
          </div>
        </div>
        
        {/* 🔥 TRAVA DE SEGURANÇA */}
        {!isTutorialDay && (
          <>
            <div className="h-[1px] w-full bg-border/30"></div>
            
            {/* SEÇÃO DO CRONÔMETRO DE TREINO */}
            {!hasStarted ? (
              <button onClick={toggleWorkoutTimer} className="w-full py-3 rounded-lg bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-black transition-all group flex items-center justify-center gap-2 shadow-sm">
                  <Play size={18} className="fill-current" />
                  <span className="font-black italic text-sm tracking-widest text-center">INICIAR OPERAÇÃO</span>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-black/40 border border-primary/30 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded transition-colors ${workoutTimer.isRunning ? 'bg-primary text-black animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                       <TimerIcon size={16} />
                    </div>
                    <span className={`text-xl font-mono font-black leading-none tracking-wider ${workoutTimer.isRunning ? 'text-white' : 'text-gray-400'}`}>
                       {formatTime(workoutTimer.elapsed)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={toggleWorkoutTimer} className="p-1.5 rounded bg-gray-800 border border-gray-600 hover:text-primary transition-all">
                          {workoutTimer.isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      </button>
                      
                      {/* 🔥 O BOTÃO AGORA CHAMA O MODAL NOVO EM VEZ DE ZERAR DIRETO */}
                      <button onClick={() => setIsResetModalOpen(true)} className="p-1.5 rounded bg-red-900/30 border border-red-800 text-red-500 hover:bg-red-500 hover:text-white transition-all">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-muted hover:text-primary transition-all">
              <X size={32} />
            </button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}

      {/* 🔥 NOVO MODAL DE CONFIRMAÇÃO DE ZERAR CRONÔMETRO 🔥 */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsResetModalOpen(false)}></div>
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
              <button onClick={() => setIsResetModalOpen(false)} className="w-full p-4 rounded-xl border border-border text-muted font-black uppercase text-xs hover:text-white transition-all">
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