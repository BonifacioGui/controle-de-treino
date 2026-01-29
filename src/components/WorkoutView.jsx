import React, { useState } from 'react';
import { Calendar, CheckCircle2, Zap, Cpu, X } from 'lucide-react';
import CyberCalendar from './CyberCalendar';

const WorkoutView = ({ 
  activeDay, workoutData, selectedDate, setSelectedDate, 
  weightInput, setWeightInput, waistInput, setWaistInput, 
  latestStats, progress, toggleCheck, updateSetData, 
  updateSessionSets, sessionNote, setSessionNote, finishWorkout,
  bodyHistory, 
  saveBiometrics 
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Helper para formatar a data exibida no painel
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedSelectedDate = selectedDate.split('-').reverse().join('/');

  // --- LÓGICA DE SINCRONIZAÇÃO (FEEDBACK VISUAL) ---
  const isWeightSynced = bodyHistory?.some(h => 
    h.date === formattedSelectedDate && h.weight === weightInput && weightInput !== ''
  );

  const isWaistSynced = bodyHistory?.some(h => 
    h.date === formattedSelectedDate && h.waist === waistInput && waistInput !== ''
  );

  return (
    <main className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-20">
      
      {/* 🛠️ PAINEL DE CONTROLE: BIOMETRIA E TEMPO */}
      <div className="bg-slate-900/40 p-5 rounded-3xl border-2 border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        
        <div className="flex flex-col gap-5 relative z-10">
          
          {/* 📅 SELETOR CRONOLÓGICO */}
          <div 
            onClick={() => setIsCalendarOpen(true)}
            className="bg-slate-950/80 p-4 rounded-2xl border-2 border-cyan-500/20 flex items-center justify-between relative hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden shadow-inner"
          >
            <div className="absolute top-0 left-4 -translate-y-1/2 bg-slate-900 px-2 text-[7px] font-black text-cyan-500 uppercase tracking-[0.3em] z-20">Temporal_Sync</div>
            
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-white italic neon-text-cyan leading-none drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">
                {selectedDate.split('-').reverse()[0]}
              </span>
              <div className="flex flex-col -space-y-1">
                <span className="text-[10px] font-black text-cyan-400 uppercase">
                  {dateObj.toLocaleDateString('pt-BR', { month: 'long' })}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  {dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border transition-all duration-500 ${isCalendarOpen ? 'bg-cyan-500 text-black shadow-[0_0_15px_#00f3ff]' : 'bg-cyan-500/5 border-cyan-500/30 text-cyan-400'}`}>
              <Calendar size={22} />
            </div>
          </div>

          {/* 🧬 SENSORES BIOMÉTRICOS */}
          <div className="grid grid-cols-2 gap-3">
            {/* MASSA (PESO) */}
            <div className="relative group/input">
              <div className={`absolute -top-2 left-3 bg-slate-900 px-2 text-[7px] font-black uppercase tracking-widest z-10 flex items-center gap-1 transition-all ${isWeightSynced ? 'text-emerald-400' : 'text-slate-500'}`}>
                <Cpu size={8} /> {isWeightSynced ? 'STATUS: ESTÁVEL' : 'Sensor_Massa'}
              </div>
              <input 
                type="number" step="0.1" 
                placeholder={String(latestStats?.weight || '--')} 
                value={weightInput || ''} 
                onChange={(e) => setWeightInput(e.target.value)} 
                className={`w-full bg-slate-950/80 border-2 rounded-xl p-4 font-black text-center outline-none transition-all text-xl shadow-inner 
                  ${isWeightSynced ? 'border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-slate-800 text-white focus:border-emerald-500/50'}`}
              />
              {!isWeightSynced && weightInput !== '' && (
                <button onClick={saveBiometrics} className="absolute right-2 top-2 text-[9px] font-black text-emerald-500 animate-pulse bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">SALVAR</button>
              )}
            </div>

            {/* DIMENSÃO (CINTURA) */}
            <div className="relative group/input">
              <div className={`absolute -top-2 left-3 bg-slate-900 px-2 text-[7px] font-black uppercase tracking-widest z-10 flex items-center gap-1 transition-all ${isWaistSynced ? 'text-indigo-400' : 'text-slate-500'}`}>
                <Cpu size={8} /> {isWaistSynced ? 'STATUS: ESTÁVEL' : 'Sensor_Dim'}
              </div>
              <input 
                type="number" step="0.1" 
                placeholder={String(latestStats?.waist || '--')} 
                value={waistInput || ''}
                onChange={(e) => setWaistInput(e.target.value)} 
                className={`w-full bg-slate-950/80 border-2 rounded-xl p-4 font-black text-center outline-none transition-all text-xl shadow-inner
                  ${isWaistSynced ? 'border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-slate-800 text-white focus:border-indigo-500/50'}`}
              />
              {!isWaistSynced && waistInput !== '' && (
                <button onClick={saveBiometrics} className="absolute right-2 top-2 text-[9px] font-black text-indigo-500 animate-pulse bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/30">SALVAR</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TÍTULO DO TREINO */}
      <div className="flex items-center gap-3 px-1">
        <Zap size={20} className="text-pink-500 fill-pink-500 animate-pulse" />
        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic neon-text-pink">
          {workoutData[activeDay].title}
        </h2>
      </div>

      {/* LISTAGEM DE EXERCÍCIOS */}
      <div className="space-y-4">
        {workoutData[activeDay].exercises.map((ex, i) => {
          const id = `${selectedDate}-${activeDay}-${i}`;
          const isDone = progress[id]?.done;

          // 🔥 Lógica de Tempo/Cardio: Impede "Caminhada Infinita" e trata Isométricos
          const isTimeBased = ex.sets.toLowerCase().includes('min') || 
                            ex.sets.toLowerCase().includes('seg') || 
                            ex.sets.toLowerCase().includes('s') ||
                            !ex.sets.includes('x');

          const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

          return (
            <div key={id} className={`p-5 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden ${isDone ? 'bg-cyan-950/10 border-cyan-500 shadow-[0_0_20px_rgba(0,243,255,0.3)]' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
              {isDone && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] w-full animate-[scanline_4s_linear_infinite] pointer-events-none"></div>}
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex-1">
                  <h3 className={`font-black text-lg leading-tight transition-colors ${isDone ? 'text-cyan-400' : 'text-slate-100'}`}>{ex.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1 italic">{ex.note}</p>
                </div>
                <button onClick={() => toggleCheck(id)} className={`ml-4 p-1 rounded-full transition-all duration-500 ${isDone ? 'text-cyan-500 rotate-[360deg] scale-125' : 'text-slate-800 hover:text-slate-600'}`}>
                  <CheckCircle2 size={40} fill={isDone ? "currentColor" : "none"} strokeWidth={isDone ? 3 : 1.5} />
                </button>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-slate-800/50 group-focus-within:border-cyan-500/50 transition-all shadow-inner">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {isTimeBased ? 'Tempo_Alvo' : 'Ciclos'}
                  </span>
                  <input 
                    type={isTimeBased ? "text" : "number"} 
                    className="bg-transparent text-cyan-400 font-black outline-none w-24 text-center text-sm border-b border-cyan-500/30" 
                    value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")} 
                    onChange={(e) => updateSessionSets(id, e.target.value)} 
                  />
                </div>
                
                {!isTimeBased && (
                  <div className="grid gap-3">
                    {Array.from({ length: currentSetCount }).map((_, setIdx) => (
                      <div key={setIdx} className="flex items-center gap-3 group/row">
                        <span className="text-[10px] font-black text-slate-700 w-6 group-focus-within/row:text-cyan-500 transition-colors">#{setIdx + 1}</span>
                        <div className="flex-1 flex gap-2">
                          <input type="text" placeholder="KG" value={progress[id]?.sets?.[setIdx]?.weight || ""} onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)} className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-emerald-400 font-black text-xs outline-none focus:border-emerald-500/50 transition-all text-center" />
                          <input type="text" placeholder="REPS" value={progress[id]?.sets?.[setIdx]?.reps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)} className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-indigo-400 font-black text-xs outline-none focus:border-indigo-500/50 transition-all text-center" />
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
      
      {/* FOOTER */}
      <div className="space-y-4 pt-6 pb-10">
        <textarea 
          placeholder="Relatório de danos e observações do sistema..." 
          className="w-full bg-slate-900/60 border-2 border-slate-800 rounded-2xl p-4 text-xs font-bold h-24 outline-none focus:border-cyan-500/50 transition-all text-cyan-100" 
          value={sessionNote} 
          onChange={(e) => setSessionNote(e.target.value)} 
        />
        <button 
          onClick={finishWorkout} 
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-400 py-5 font-black text-black shadow-[0_10px_30px_rgba(0,243,255,0.2)] active:scale-[0.97] transition-all"
        >
          <span className="relative z-10 uppercase tracking-[0.3em] text-sm italic">UPLOAD_SESSÃO // SIUUU</span>
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </button>
      </div>

      {/* MODAL CALENDÁRIO */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-slate-500 hover:text-cyan-400 transition-all"><X size={32} /></button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}
    </main>
  );
};

export default WorkoutView;