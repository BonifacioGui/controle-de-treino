import React from 'react';
import { History, Scale, Trash2, Activity, Database } from 'lucide-react';

const HistoryView = ({ history, bodyHistory, deleteEntry, setView }) => {
  return (
    <main className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-cyber pb-10">
      
      {/* Header Estilo Arquivo */}
      <div className="flex items-center justify-between border-b-2 border-cyan-500/30 pb-4 mb-8">
        <h2 className="text-xl font-black flex items-center gap-3 italic neon-text-cyan uppercase">
          <Database size={24} className="text-cyan-400" /> Log de Operações
        </h2>
        <span className="text-[8px] font-black text-slate-600 tracking-[0.3em]">RECOVERY.SYS</span>
      </div>
      
      {/* Listagem de Medidas Corporais (Biometria) - Tema Pink Neon */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest px-1 flex items-center gap-2">
          <Scale size={14} /> Registros Biométricos
        </h3>
        {bodyHistory.map((b) => (
          <div key={b.id} className="bg-slate-900/40 border border-pink-500/30 p-4 rounded-2xl shadow-[0_0_15px_rgba(255,0,255,0.05)] relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 shadow-[0_0_10px_rgba(255,0,255,0.8)]"></div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="font-black text-pink-400 text-[10px] uppercase tracking-tighter">
                {b.date} <span className="text-slate-600 ml-2">// ENTRY_ID: {b.id.toString().slice(-4)}</span>
              </span>
              <button 
                onClick={() => deleteEntry(b.id, 'body')} 
                className="text-slate-600 hover:text-red-500 transition-all hover:scale-110"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex gap-8">
              <div>
                <p className="text-[8px] text-slate-500 font-black uppercase">Massa</p>
                <p className="text-lg font-black text-emerald-400 leading-none">{b.weight}<span className="text-[10px] ml-1">KG</span></p>
              </div>
              <div>
                <p className="text-[8px] text-slate-500 font-black uppercase">Cintura</p>
                <p className="text-lg font-black text-cyan-400 leading-none">{b.waist}<span className="text-[10px] ml-1">CM</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Listagem de Treinos - Tema Cyan Neon */}
      <div className="space-y-4 pt-4">
        <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest px-1 flex items-center gap-2">
          <Activity size={14} /> Histórico de Combate
        </h3>
        
        {history.length === 0 && bodyHistory.length === 0 && (
          <div className="bg-slate-900/20 border border-dashed border-slate-800 p-10 rounded-3xl text-center">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">Nenhum dado recuperado do buffer.</p>
          </div>
        )}

        {history.map((h) => (
          <div key={h.id} className="bg-slate-900/40 border border-cyan-500/30 p-5 rounded-2xl shadow-[0_0_20px_rgba(0,0,243,0.05)] relative group transition-all hover:border-cyan-500/50">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none text-xs font-black">LOG_{h.dayName}</div>
            
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <span className="font-black text-cyan-400 text-[11px] tracking-widest uppercase italic">{h.date} • {h.dayName}</span>
              <button 
                onClick={() => deleteEntry(h.id, 'workout')} 
                className="text-slate-700 hover:text-red-500 transition-all hover:scale-110"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            {h.note && (
              <div className="mb-4 p-2 bg-black/40 border-l-2 border-amber-500/50 rounded-r-lg">
                <p className="text-[10px] text-amber-500 italic font-medium leading-relaxed">"{h.note}"</p>
              </div>
            )}
            
            <div className="space-y-4">
              {h.exercises.map((ex, j) => (
                <div key={j} className="flex flex-col gap-2">
                  <span className={`text-[11px] font-black uppercase tracking-tighter ${ex.done ? "text-slate-200" : "text-slate-700 line-through"}`}>
                    {ex.name}
                  </span>
                  
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(ex.sets) ? (
                      ex.sets.map((set, k) => (
                        <div key={k} className="flex flex-col items-center bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
                          <span className="text-[7px] text-slate-600 font-black uppercase mb-0.5">S{k+1}</span>
                          <span className="text-[10px] font-black text-emerald-400">
                            {set.weight} <span className="text-[7px] text-slate-500">KG</span>
                          </span>
                          <span className="text-[10px] font-black text-cyan-400">
                            {set.reps} <span className="text-[7px] text-slate-500">REPS</span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] font-black bg-slate-950 border border-slate-800 px-3 py-1 rounded text-cyan-500">
                        {ex.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Botão de Retorno */}
      <button 
        onClick={() => setView('workout')} 
        className="w-full py-5 bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-cyan-500/50 rounded-2xl font-black mt-8 transition-all text-[11px] uppercase tracking-[0.4em] text-slate-500 hover:text-cyan-400"
      >
        Fechar Arquivos
      </button>
    </main>
  );
};

export default HistoryView;