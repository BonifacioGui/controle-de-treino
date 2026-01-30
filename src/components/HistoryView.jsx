import React from 'react';
import { Scale, Trash2, Activity, Database } from 'lucide-react';

const HistoryView = ({ history, bodyHistory, deleteEntry, setView }) => {
  return (
    // MUDANÇA: bg-page (embora o App já defina, ajuda na transição) e cores de texto
    <main className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-cyber pb-24">
      
      {/* Header Estilo Arquivo */}
      <div className="flex items-center justify-between border-b-2 border-primary/30 pb-4 mb-8">
        <h2 className="text-xl font-black flex items-center gap-3 italic neon-text-cyan uppercase text-primary">
          <Database size={24} className="text-primary" /> Log de Operações
        </h2>
        <span className="text-[8px] font-black text-muted tracking-[0.3em]">RECOVERY.SYS</span>
      </div>
      
      {/* Listagem de Medidas Corporais (Biometria) */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-secondary uppercase tracking-widest px-1 flex items-center gap-2">
          <Scale size={14} /> Registros Biométricos
        </h3>
        {bodyHistory.map((b) => (
          // MUDANÇA: bg-card, border-secondary
          <div key={b.id} className="bg-card border border-secondary/30 p-4 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.05)] relative group overflow-hidden hover:border-secondary/60 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.8)]"></div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="font-black text-secondary text-[10px] uppercase tracking-tighter">
                {b.date} <span className="text-muted ml-2">// ENTRY_ID: {b.id.toString().slice(-4)}</span>
              </span>
              <button 
                onClick={() => deleteEntry(b.id, 'body')} 
                className="text-muted hover:text-red-500 transition-all hover:scale-110"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex gap-8">
              <div>
                <p className="text-[8px] text-muted font-black uppercase">Massa</p>
                <p className="text-lg font-black text-success leading-none">{b.weight}<span className="text-[10px] ml-1 text-main">KG</span></p>
              </div>
              <div>
                <p className="text-[8px] text-muted font-black uppercase">Cintura</p>
                <p className="text-lg font-black text-primary leading-none">{b.waist}<span className="text-[10px] ml-1 text-main">CM</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Listagem de Treinos */}
      <div className="space-y-4 pt-4">
        <h3 className="text-[10px] font-black text-primary uppercase tracking-widest px-1 flex items-center gap-2">
          <Activity size={14} /> Histórico de Combate
        </h3>
        
        {history.length === 0 && bodyHistory.length === 0 && (
          <div className="bg-card/20 border border-dashed border-border p-10 rounded-3xl text-center">
            <p className="text-muted text-[10px] font-black uppercase tracking-widest italic">Nenhum dado recuperado do buffer.</p>
          </div>
        )}

        {history.map((h) => (
          // MUDANÇA: bg-card, border-primary
          <div key={h.id} className="bg-card border border-primary/30 p-5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.05)] relative group transition-all hover:border-primary/50">
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none text-xs font-black text-muted">LOG_{h.dayName}</div>
            
            <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
              <span className="font-black text-primary text-[11px] tracking-widest uppercase italic">{h.date} • {h.dayName}</span>
              <button 
                onClick={() => deleteEntry(h.id, 'workout')} 
                className="text-muted hover:text-red-500 transition-all hover:scale-110"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            {h.note && (
              <div className="mb-4 p-2 bg-input border-l-2 border-warning rounded-r-lg">
                <p className="text-[10px] text-warning italic font-medium leading-relaxed">"{h.note}"</p>
              </div>
            )}
            
            <div className="space-y-4">
              {h.exercises.map((ex, j) => (
                <div key={j} className="flex flex-col gap-2">
                  <span className={`text-[11px] font-black uppercase tracking-tighter ${ex.done ? "text-main" : "text-muted line-through"}`}>
                    {ex.name}
                  </span>
                  
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(ex.sets) ? (
                      ex.sets.map((set, k) => (
                        <div key={k} className="flex flex-col items-center bg-input border border-border px-3 py-1 rounded-lg shadow-sm">
                          <span className="text-[7px] text-muted font-black uppercase mb-0.5">S{k+1}</span>
                          <span className="text-[10px] font-black text-success">
                            {set.weight} <span className="text-[7px] text-muted">KG</span>
                          </span>
                          <span className="text-[10px] font-black text-primary">
                            {set.reps} <span className="text-[7px] text-muted">REPS</span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] font-black bg-input border border-border px-3 py-1 rounded text-primary">
                        {ex.detail || "Treino concluído"}
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
        className="w-full py-5 bg-card hover:bg-input border-2 border-border hover:border-primary/50 rounded-2xl font-black mt-8 transition-all text-[11px] uppercase tracking-[0.4em] text-muted hover:text-primary"
      >
        Fechar Arquivos
      </button>
    </main>
  );
};

export default HistoryView;