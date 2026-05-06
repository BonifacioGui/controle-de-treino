import React, { useState } from 'react';
import { Calendar, Play, Pause, Trash2, Timer as TimerIcon, X, AlertTriangle, Zap } from 'lucide-react';
import CyberCalendar from '../dashboard/CyberCalendar';
import QuestBoard from '../rpg/QuestBoard'; 
import { formatTime } from '../../utils/workoutUtils';

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
    <div className="bg-card dark:bg-[#050B14] border border-[#00f3ff]/30 p-4 rounded-2xl relative overflow-hidden group shadow-[0_0_15px_rgba(0,243,255,0.05)] z-10 transition-colors">
      
      {/* Detalhes sutis no fundo */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
      
      <div className="flex flex-col relative z-10">
        
        {/* SEÇÃO DE DATA / CALENDÁRIO */}
        <div onClick={() => setIsCalendarOpen(true)} className="flex items-center justify-between cursor-pointer group/calendar hover:bg-[#00f3ff]/5 p-2 -m-2 rounded-xl transition-all mb-2">
          <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#00f3ff] leading-none drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">{selectedDate.split('-').reverse()[0]}</span>
              <span className="text-xs font-bold text-main dark:text-white uppercase">{dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
              <span className="text-[10px] font-mono font-black text-muted uppercase tracking-widest ml-2 flex items-center gap-1">
                <Zap size={10} className="text-[#00f3ff]" /> DATA_DA_MISSÃO
              </span>
          </div>
          <div className={`p-2 rounded-lg border transition-all ${isCalendarOpen ? 'bg-[#00f3ff] text-black shadow-[0_0_10px_rgba(0,243,255,0.8)]' : 'bg-[#0a0f16] text-[#00f3ff] border-[#00f3ff]/40 group-hover/calendar:border-[#00f3ff]'}`}>
            <Calendar size={18} />
          </div>
        </div>
        
        {!isTutorialDay && (
          <>
            {/* O QuestBoard fica invisível aqui se não tiver missões, sem quebrar o layout */}
            <QuestBoard />
            
            {/* SEÇÃO DO CRONÔMETRO DE TREINO */}
            {!hasStarted ? (
              /* 🔥 BOTÃO Fiel à Print: Sem chanfros exagerados, borda ciano e arredondado */
              <button 
                onClick={toggleWorkoutTimer} 
                className="w-full py-3.5 mt-1 rounded-xl bg-transparent border-2 border-[#00f3ff] text-[#00f3ff] transition-all duration-300 group flex items-center justify-center gap-3 shadow-[0_0_10px_rgba(0,243,255,0.1)] hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:bg-[#00f3ff]/10 active:scale-95"
              >
                  <Play size={18} className="fill-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]" />
                  <span className="font-black text-sm tracking-[0.2em] uppercase text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
                    INICIAR OPERAÇÃO
                  </span>
              </button>
            ) : (
              /* CRONÔMETRO ATIVO */
              <div className="flex items-center justify-between bg-[#0a0f16] border border-[#00f3ff]/40 p-3 rounded-xl shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] mt-1">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${workoutTimer.isRunning ? 'bg-[#00f3ff] text-black shadow-[0_0_10px_rgba(0,243,255,0.5)] animate-pulse' : 'bg-input text-muted'}`}>
                       <TimerIcon size={18} />
                    </div>
                    <span className={`text-2xl font-mono font-black leading-none tracking-wider ${workoutTimer.isRunning ? 'text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'text-muted'}`}>
                       {formatTime(workoutTimer.elapsed)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={toggleWorkoutTimer} className="p-2 rounded-lg bg-card dark:bg-[#050505] border border-border dark:border-[#00f3ff]/30 text-main dark:text-white hover:text-[#00f3ff] dark:hover:text-[#00f3ff] hover:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all">
                          {workoutTimer.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                      </button>
                      
                      <button onClick={() => setIsResetModalOpen(true)} className="p-2 rounded-lg bg-red-500/10 dark:bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all">
                          <Trash2 size={18} />
                      </button>
                  </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DO CALENDÁRIO */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-[#00f3ff] hover:text-red-500 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all">
              <X size={32} />
            </button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE ZERAR */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsResetModalOpen(false)}></div>
          <div className="bg-[#050B14] border-2 border-red-500 w-full max-w-sm p-8 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.3)] relative z-10 animate-in zoom-in-95 duration-200 text-center">
            
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 rounded-full text-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse relative z-10 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-red-500 mb-2 text-xl drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] relative z-10">Abortar Operação?</h3>
            <p className="text-white/70 text-[11px] font-mono mb-8 uppercase tracking-tighter relative z-10">
              Aviso do Sistema: O tempo registrado será purgado do servidor.
            </p>
            <div className="flex flex-col gap-3 relative z-10">
              <button 
                onClick={confirmReset} 
                className="w-full p-4 rounded-xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95"
              >
                ZERAR CRONÔMETRO
              </button>
              <button 
                onClick={() => setIsResetModalOpen(false)} 
                className="w-full p-4 rounded-xl border border-[#00f3ff]/40 text-[#00f3ff] font-black uppercase tracking-widest text-xs hover:bg-[#00f3ff]/10 hover:shadow-[0_0_10px_rgba(0,243,255,0.2)] transition-all"
              >
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