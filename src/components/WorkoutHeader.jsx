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
    // Fundo do card principal adaptável ao tema
    <div className="bg-card border border-border p-3 rounded-2xl relative overflow-hidden group shadow-sm z-10">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
      
      <div className="flex flex-col gap-3 relative z-10">
        
        {/* SEÇÃO DE DATA / CALENDÁRIO */}
        <div onClick={() => setIsCalendarOpen(true)} className="flex items-center justify-between cursor-pointer group/calendar">
          <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-main leading-none">{selectedDate.split('-').reverse()[0]}</span>
              {/* text-main/70 garante contraste bom no claro e no escuro */}
              <span className="text-xs font-bold text-main/70 uppercase">{dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
              {/* Removido opacity-50, adicionado text-primary para garantir cor sólida */}
              <span className="text-[10px] font-black text-primary uppercase tracking-widest ml-2">DATA_DA_MISSÃO</span>
          </div>
          {/* Fundo bg-input é mais seguro para botões em temas alternáveis */}
          <div className={`p-1.5 rounded-lg border transition-all ${isCalendarOpen ? 'bg-primary text-white border-primary' : 'bg-input text-primary border-border hover:border-primary/50'}`}>
            <Calendar size={16} />
          </div>
        </div>
        
        {!isTutorialDay && (
          <>
            <div className="h-[1px] w-full bg-border"></div>
            
            {/* SEÇÃO DO CRONÔMETRO DE TREINO */}
            {!hasStarted ? (
              /* 🔥 BOTÃO "GRITANDO" (Versão Alto Contraste para Tema Claro/Escuro) 
                 Mudança principal: Fundo Sólido (bg-primary) em vez de transparente */
              <button 
                onClick={toggleWorkoutTimer} 
                className="w-full py-2 rounded-xl bg-primary text-white transition-all duration-300 group flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(var(--primary),0.5)] hover:shadow-[0_0_35px_rgba(var(--primary),0.8)] active:scale-95 animate-pulse"
              >
                  {/* Ícone branco para contrastar com o fundo ciano sólido */}
                  <Play size={20} className="fill-white" />
                  {/* Texto branco e espaçado para leitura tática impecável */}
                  <span className="font-black text-base tracking-[0.2em] uppercase text-white">
                    INICIAR OPERAÇÃO
                  </span>
              </button>
            ) : (
              /* CRONÔMETRO ATIVO - Adaptado para fundo claro/escuro via bg-input */
              <div className="flex items-center justify-between bg-input border border-border p-2 rounded-lg shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded transition-colors ${workoutTimer.isRunning ? 'bg-primary text-white animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.4)]' : 'bg-card text-main/50 border border-border'}`}>
                       <TimerIcon size={16} />
                    </div>
                    {/* text-main garante que fica preto no claro e branco no escuro */}
                    <span className={`text-xl font-mono font-black leading-none tracking-wider ${workoutTimer.isRunning ? 'text-main' : 'text-main/50'}`}>
                       {formatTime(workoutTimer.elapsed)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                      {/* Botões secundários usando bg-card para destacar do bg-input */}
                      <button onClick={toggleWorkoutTimer} className="p-1.5 rounded bg-card border border-border hover:border-primary hover:text-primary text-main/70 transition-all shadow-sm">
                          {workoutTimer.isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      </button>
                      
                      {/* Botão de lixo com contraste corrigido para modo claro */}
                      <button onClick={() => setIsResetModalOpen(true)} className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-all">
              <X size={32} />
            </button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE ZERAR */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md" onClick={() => setIsResetModalOpen(false)}></div>
          <div className="bg-card border-2 border-red-500 w-full max-w-sm p-8 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.2)] relative z-10 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-red-600 dark:text-red-500 mb-2 text-xl">Abortar Operação?</h3>
            {/* text-main/70 para leitura em ambos os temas */}
            <p className="text-main/70 text-sm font-bold mb-8 uppercase tracking-tighter">
              Você está prestes a zerar o tempo desta missão. O tempo registrado será perdido.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmReset} className="w-full p-4 rounded-xl bg-red-600 dark:bg-red-500 text-white font-black uppercase text-xs hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95">
                ZERAR CRONÔMETRO
              </button>
              {/* bg-input para o botão de cancelar */}
              <button onClick={() => setIsResetModalOpen(false)} className="w-full p-4 rounded-xl bg-input border border-border text-main font-black uppercase text-xs hover:bg-card hover:border-main/50 transition-all">
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