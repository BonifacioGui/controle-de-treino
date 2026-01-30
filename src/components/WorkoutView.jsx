import React, { useState } from 'react';
import { Calendar, CheckCircle2, Zap, Cpu, X, Trophy, Star } from 'lucide-react';
import CyberCalendar from './CyberCalendar';

const WorkoutView = ({ 
  activeDay, workoutData, selectedDate, setSelectedDate, 
  weightInput, setWeightInput, waistInput, setWaistInput, 
  latestStats, progress, toggleCheck, updateSetData, 
  updateSessionSets, sessionNote, setSessionNote, finishWorkout,
  bodyHistory, history, 
  saveBiometrics 
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    // MUDANÇA: bg-page e text-main já vêm do App, mas garantimos transições suaves aqui
    <main className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-20">
      
      {/* 🛠️ PAINEL DE CONTROLE: BIOMETRIA E TEMPO */}
      {/* MUDANÇA: bg-card, border-border */}
      <div className="bg-card border-2 border-border p-5 rounded-3xl relative overflow-hidden group shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        
        <div className="flex flex-col gap-5 relative z-10">
          
          {/* 📅 SELETOR CRONOLÓGICO */}
          {/* MUDANÇA: bg-input, border-primary */}
          <div 
            onClick={() => setIsCalendarOpen(true)}
            className="bg-input p-4 rounded-2xl border-2 border-primary/20 flex items-center justify-between relative hover:border-primary/50 transition-all cursor-pointer overflow-hidden shadow-inner group/calendar"
          >
            <div className="absolute top-0 left-4 -translate-y-1/2 bg-card px-2 text-[7px] font-black text-primary uppercase tracking-[0.3em] z-20">Temporal_Sync</div>
            
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-main italic leading-none drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                {selectedDate.split('-').reverse()[0]}
              </span>
              <div className="flex flex-col -space-y-1">
                <span className="text-[10px] font-black text-primary uppercase">
                  {dateObj.toLocaleDateString('pt-BR', { month: 'long' })}
                </span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">
                  {dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border transition-all duration-500 ${isCalendarOpen ? 'bg-primary text-black shadow-[0_0_15px_var(--primary)]' : 'bg-primary/5 border-primary/30 text-primary'}`}>
              <Calendar size={22} />
            </div>
          </div>

          {/* 🧬 SENSORES BIOMÉTRICOS */}
          <div className="grid grid-cols-2 gap-3">
            {/* MASSA (PESO) */}
            <div className="relative group/input">
              <div className={`absolute -top-2 left-3 bg-card px-2 text-[7px] font-black uppercase tracking-widest z-10 flex items-center gap-1 transition-all ${isWeightSynced ? 'text-success' : 'text-muted'}`}>
                <Cpu size={8} /> {isWeightSynced ? 'STATUS: ESTÁVEL' : 'Sensor_Massa'}
              </div>
              <input 
                type="number" step="0.1" 
                placeholder={String(latestStats?.weight || '--')} 
                value={weightInput || ''} 
                onChange={(e) => setWeightInput(e.target.value)} 
                className={`w-full bg-input border-2 rounded-xl p-4 font-black text-center outline-none transition-all text-xl shadow-inner placeholder-muted/50
                  ${isWeightSynced ? 'border-success/50 text-success shadow-[0_0_15px_rgba(var(--success),0.1)]' : 'border-border text-main focus:border-success/50'}`}
              />
              {!isWeightSynced && weightInput !== '' && (
                <button onClick={saveBiometrics} className="absolute right-2 top-2 text-[9px] font-black text-success animate-pulse bg-success/10 px-2 py-1 rounded border border-success/30">SALVAR</button>
              )}
            </div>

            {/* DIMENSÃO (CINTURA) */}
            <div className="relative group/input">
              <div className={`absolute -top-2 left-3 bg-card px-2 text-[7px] font-black uppercase tracking-widest z-10 flex items-center gap-1 transition-all ${isWaistSynced ? 'text-secondary' : 'text-muted'}`}>
                <Cpu size={8} /> {isWaistSynced ? 'STATUS: ESTÁVEL' : 'Sensor_Dim'}
              </div>
              <input 
                type="number" step="0.1" 
                placeholder={String(latestStats?.waist || '--')} 
                value={waistInput || ''}
                onChange={(e) => setWaistInput(e.target.value)} 
                className={`w-full bg-input border-2 rounded-xl p-4 font-black text-center outline-none transition-all text-xl shadow-inner placeholder-muted/50
                  ${isWaistSynced ? 'border-secondary/50 text-secondary shadow-[0_0_15px_rgba(var(--secondary),0.1)]' : 'border-border text-main focus:border-secondary/50'}`}
              />
              {!isWaistSynced && waistInput !== '' && (
                <button onClick={saveBiometrics} className="absolute right-2 top-2 text-[9px] font-black text-secondary animate-pulse bg-secondary/10 px-2 py-1 rounded border border-secondary/30">SALVAR</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TÍTULO DO TREINO */}
      <div className="flex items-center gap-3 px-1">
        {/* MUDANÇA: text-secondary */}
        <Zap size={20} className="text-secondary fill-secondary animate-pulse" />
        <h2 className="text-xl font-black text-main uppercase tracking-tighter italic drop-shadow-[0_0_5px_rgba(var(--secondary),0.5)]">
          {workoutData[activeDay].title}
        </h2>
      </div>

      {/* LISTAGEM DE EXERCÍCIOS */}
      <div className="space-y-4">
        {workoutData[activeDay].exercises.map((ex, i) => {
          const id = `${selectedDate}-${activeDay}-${i}`;
          const isDone = progress[id]?.done;

          const isTimeBased = ex.sets.toLowerCase().includes('min') || 
                              ex.sets.toLowerCase().includes('seg') || 
                              ex.sets.toLowerCase().includes('s') ||
                              !ex.sets.includes('x');

          const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

          // 🏆 LÓGICA DE PR (PERSONAL RECORD)
          const exercisePR = (history || [])
            .flatMap(s => s.exercises)
            .filter(e => e.name === ex.name)
            .reduce((max, e) => {
              const sessionMax = Math.max(...(e.sets?.map(s => parseFloat(s.weight) || 0) || [0]));
              return Math.max(max, sessionMax);
            }, 0);

          const isBreakingPR = (progress[id]?.sets || []).some(s => parseFloat(s.weight) > exercisePR && exercisePR > 0);

          return (
            // MUDANÇA: bg-card, border-border, border-primary (se feito), border-warning (se PR)
            <div key={id} className={`p-5 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden 
              ${isBreakingPR ? 'border-warning shadow-[0_0_30px_rgba(245,158,11,0.2)] bg-warning/5' : 
                isDone ? 'bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]' : 'bg-card border-border hover:border-primary/30'}`}>
              
              {isDone && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[200%] w-full animate-[scanline_4s_linear_infinite] pointer-events-none"></div>}
              
              {/* Badge de Recorde */}
              {exercisePR > 0 && (
                <div className={`absolute top-0 right-12 px-3 py-1 rounded-b-lg flex items-center gap-1 transition-all z-20 ${isBreakingPR ? 'bg-warning text-black animate-bounce shadow-lg' : 'bg-input text-muted'}`}>
                  <Trophy size={10} className={isBreakingPR ? "fill-black" : ""} />
                  <span className="text-[8px] font-black uppercase tracking-widest">PR: {exercisePR}KG</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex-1">
                  {/* MUDANÇA: Cores dinâmicas no título */}
                  <h3 className={`font-black text-lg leading-tight transition-colors flex items-center gap-2 ${isBreakingPR ? 'text-warning' : isDone ? 'text-primary' : 'text-main'}`}>
                    {ex.name}
                    {isBreakingPR && <Star size={16} className="text-warning fill-warning animate-pulse" />}
                  </h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-tighter mt-1 italic">{ex.note}</p>
                </div>
                <button onClick={() => toggleCheck(id)} className={`ml-4 p-1 rounded-full transition-all duration-500 ${isDone ? 'text-primary rotate-[360deg] scale-125' : 'text-muted hover:text-main'}`}>
                  <CheckCircle2 size={40} fill={isDone ? "currentColor" : "none"} strokeWidth={isDone ? 3 : 1.5} />
                </button>
              </div>
              
              <div className="space-y-4 relative z-10">
                {/* MUDANÇA: bg-input/50 */}
                <div className="flex items-center gap-3 bg-input/50 p-3 rounded-xl border border-border group-focus-within:border-primary/50 transition-all shadow-inner">
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest">
                    {isTimeBased ? 'Tempo_Alvo' : 'Ciclos'}
                  </span>
                  {/* MUDANÇA: text-primary, border-primary */}
                  <input 
                    type={isTimeBased ? "text" : "number"} 
                    className="bg-transparent text-primary font-black outline-none w-24 text-center text-sm border-b border-primary/30" 
                    value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")} 
                    onChange={(e) => updateSessionSets(id, e.target.value)} 
                  />
                </div>
                
                {!isTimeBased && (
                  <div className="grid gap-3">
                    {Array.from({ length: currentSetCount }).map((_, setIdx) => (
                      <div key={setIdx} className="flex items-center gap-3 group/row">
                        <span className="text-[10px] font-black text-muted w-6 group-focus-within/row:text-primary transition-colors">#{setIdx + 1}</span>
                        <div className="flex-1 flex gap-2">
                          {/* MUDANÇA: bg-input, border-border, text-success/warning */}
                          <input 
                            type="text" placeholder="KG" 
                            value={progress[id]?.sets?.[setIdx]?.weight || ""} 
                            onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)} 
                            className={`w-full bg-input border rounded-lg p-2 font-black text-xs outline-none transition-all text-center
                              ${parseFloat(progress[id]?.sets?.[setIdx]?.weight) > exercisePR && exercisePR > 0 
                                ? 'border-warning text-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                                : 'border-border text-success focus:border-success/50'}`} 
                          />
                          <input type="text" placeholder="REPS" value={progress[id]?.sets?.[setIdx]?.reps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)} className="w-full bg-input border border-border rounded-lg p-2 text-secondary font-black text-xs outline-none focus:border-secondary/50 transition-all text-center" />
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
          className="w-full bg-card border-2 border-border rounded-2xl p-4 text-xs font-bold h-24 outline-none focus:border-primary/50 transition-all text-main placeholder-muted" 
          value={sessionNote} 
          onChange={(e) => setSessionNote(e.target.value)} 
        />
        {/* MUDANÇA: Gradiente ou Cor Sólida baseada no tema. Usei bg-primary para garantir compatibilidade */}
        <button 
          onClick={finishWorkout} 
          className="group relative w-full overflow-hidden rounded-2xl bg-primary py-5 font-black text-black shadow-[0_10px_30px_rgba(var(--primary),0.3)] active:scale-[0.97] transition-all hover:bg-primary/90"
        >
          <span className="relative z-10 uppercase tracking-[0.3em] text-sm italic">UPLOAD_SESSÃO // SIUUU</span>
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