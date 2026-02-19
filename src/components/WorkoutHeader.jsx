// src/components/WorkoutHeader.jsx
import React from 'react';
import { Calendar, Play, Pause, Trash2, Timer as TimerIcon, Camera, X } from 'lucide-react';
import CyberCalendar from './CyberCalendar';
import { formatTime } from '../utils/workoutUtils';

const WorkoutHeader = ({ 
  selectedDate, setSelectedDate, isCalendarOpen, setIsCalendarOpen,
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer,
  weightInput, setWeightInput, waistInput, setWaistInput,
  latestStats, bodyHistory, saveBiometrics 
}) => {
  
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const isWeightSynced = bodyHistory?.some(h => h.date === selectedDate.split('-').reverse().join('/') && h.weight == weightInput && weightInput !== '');
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

  return (
    <div className="bg-card border border-border p-3 rounded-2xl relative overflow-hidden group shadow-sm z-10">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
      <div className="flex flex-col gap-3 relative z-10">
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
        
        {!hasStarted ? (
          <button onClick={toggleWorkoutTimer} className="w-full py-3 rounded-lg bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-black transition-all group flex items-center justify-center gap-2 shadow-sm">
              <Play size={18} className="fill-current" />
              <span className="font-black italic text-sm tracking-widest">INICIAR TREINO</span>
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
                  <button onClick={resetWorkoutTimer} className="p-1.5 rounded bg-red-900/30 border border-red-800 text-red-500">
                      <Trash2 size={16} />
                  </button>
              </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="relative">
            <span className={`absolute top-1.5 left-2 text-[6px] font-black uppercase tracking-widest z-10 ${isWeightSynced ? 'text-success' : 'text-muted'}`}>MASSA (KG)</span>
            <input type="number" step="0.1" placeholder={String(latestStats?.weight || '--')} value={weightInput || ''} onChange={(e) => setWeightInput(e.target.value)} 
              className={`w-full bg-input border rounded-lg pt-5 pb-2 px-2 font-black text-center outline-none transition-all text-lg h-12 ${isWeightSynced ? 'border-success/50 text-success' : 'border-border text-main focus:border-primary'}`} 
            />
          </div>
          <div className="relative flex gap-1">
             <div className="relative flex-1">
                <span className="absolute top-1.5 left-2 text-[6px] font-black uppercase tracking-widest z-10 text-muted">CINTURA (CM)</span>
                <input type="number" step="0.1" placeholder={String(latestStats?.waist || '--')} value={waistInput || ''} onChange={(e) => setWaistInput(e.target.value)} 
                  className="w-full bg-input border border-border rounded-lg pt-5 pb-2 px-2 font-black text-center outline-none transition-all text-lg h-12 focus:border-primary" 
                />
             </div>
             <label className={`w-10 h-12 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${hasPhoto ? 'border-secondary bg-secondary/20' : 'border-border bg-card hover:border-primary'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <Camera size={16} className={hasPhoto ? "text-secondary" : "text-muted"} />
             </label>
          </div>
        </div>
      </div>

      {isCalendarOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-muted hover:text-primary transition-all"><X size={32} /></button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutHeader;