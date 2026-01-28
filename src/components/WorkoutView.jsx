import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

const WorkoutView = ({ 
  activeDay, workoutData, selectedDate, setSelectedDate, 
  weightInput, setWeightInput, waistInput, setWaistInput, 
  latestStats, progress, toggleCheck, updateSetData, 
  updateSessionSets, sessionNote, setSessionNote, finishWorkout 
}) => {
  return (
    <main className="space-y-4 animate-in fade-in duration-500">
      {/* Biometria */}
      <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
            <Calendar size={14} className="text-indigo-500"/> Data
          </span>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="bg-transparent text-sm font-bold text-indigo-400 outline-none text-right cursor-pointer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase text-center block">Peso (kg)</label>
            <input 
              type="number" 
              step="0.1" 
              placeholder={latestStats.weight} 
              value={weightInput} 
              onChange={(e) => setWeightInput(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-emerald-400 font-bold text-center outline-none focus:border-indigo-500 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase text-center block">Cintura (cm)</label>
            <input 
              type="number" 
              step="0.1" 
              placeholder={latestStats.waist} 
              value={waistInput} 
              onChange={(e) => setWaistInput(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-indigo-400 font-bold text-center outline-none focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-black text-slate-200 uppercase px-1">{workoutData[activeDay].title}</h2>

      {workoutData[activeDay].exercises.map((ex, i) => {
        const id = `${activeDay}-${i}`;
        const isDone = progress[id]?.done;
        
        // Define quantas séries mostrar (ou a do plano, ou a que você digitar)
        const currentSetCount = parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0;

        return (
          <div key={i} className={`p-4 rounded-2xl border transition-all duration-300 ${isDone ? 'bg-emerald-950/10 border-emerald-500/30 opacity-60' : 'bg-slate-900/40 border-slate-800'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-100">{ex.name}</h3>
                <p className="text-[10px] text-slate-500 italic leading-tight">{ex.note}</p>
                <span className="inline-block mt-1 text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-indigo-400 font-bold">Meta: {ex.sets}</span>
              </div>
              <button 
                onClick={() => toggleCheck(id)} 
                className={`ml-2 transition-all ${isDone ? 'text-emerald-500 scale-110' : 'text-slate-700'}`}
              >
                <CheckCircle2 size={32} fill={isDone ? "currentColor" : "none"} />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Campo para Definir Quantidade de Séries */}
              <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
                <span className="text-[9px] font-black text-slate-500 uppercase ml-1">Séries Realizadas:</span>
                <input 
                  type="number" 
                  className="bg-transparent text-indigo-400 font-bold outline-none w-12 text-sm text-center" 
                  placeholder="-"
                  value={progress[id]?.actualSets || ""}
                  onChange={(e) => updateSessionSets(id, e.target.value)}
                />
              </div>

              {/* Grid Gerado Dinamicamente para Peso e Reps de cada série */}
              <div className="grid gap-2">
                {Array.from({ length: currentSetCount }).map((_, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2 animate-in slide-in-from-left duration-200" style={{ animationDelay: `${setIdx * 50}ms` }}>
                    <span className="text-[10px] font-black text-slate-600 w-4">{setIdx + 1}º</span>
                    <input 
                      type="text" 
                      placeholder="Peso" 
                      value={progress[id]?.sets?.[setIdx]?.weight || ""}
                      onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-400 font-bold text-xs outline-none focus:border-emerald-500/50"
                    />
                    <input 
                      type="text" 
                      placeholder="Reps" 
                      value={progress[id]?.sets?.[setIdx]?.reps || ""}
                      onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-indigo-400 font-bold text-xs outline-none focus:border-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      
      <textarea 
        placeholder="Notas do treino..." 
        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm h-20 outline-none focus:border-indigo-500 transition-all" 
        value={sessionNote} 
        onChange={(e) => setSessionNote(e.target.value)} 
      />
      
      <button 
        onClick={finishWorkout} 
        className="w-full bg-indigo-600 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-500 active:scale-[0.98] transition-all"
      >
        SALVAR SESSÃO COMPLETA
      </button>
    </main>
  );
};

export default WorkoutView;