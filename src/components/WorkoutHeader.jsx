// src/components/WorkoutHeader.jsx
import React from 'react';
import { Calendar, Play, Pause, Trash2, Timer as TimerIcon, X } from 'lucide-react';
import CyberCalendar from './CyberCalendar';
import { formatTime } from '../utils/workoutUtils';

const WorkoutHeader = ({ 
  selectedDate, setSelectedDate, isCalendarOpen, setIsCalendarOpen,
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer
}) => {
  
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const hasStarted = workoutTimer?.elapsed > 0 || workoutTimer?.isRunning;

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
                  <button onClick={resetWorkoutTimer} className="p-1.5 rounded bg-red-900/30 border border-red-800 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={16} />
                  </button>
              </div>
          </div>
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
    </div>
  );
};

export default WorkoutHeader;