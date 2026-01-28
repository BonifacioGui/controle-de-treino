import React from 'react';
import { History, Scale, Trash2 } from 'lucide-react';

const HistoryView = ({ history, bodyHistory, deleteEntry, setView }) => {
  return (
    <main className="space-y-4 animate-in fade-in duration-300">
      <h2 className="text-xl font-black flex items-center gap-2 italic">
        <History size={22} /> MEUS REGISTROS
      </h2>
      
      {/* Listagem de Medidas Corporais */}
      {bodyHistory.map((b) => (
        <div key={b.id} className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-2xl shadow-lg relative">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-indigo-300 flex items-center gap-2 text-xs">
              <Scale size={14}/> {b.date} (Biometria)
            </span>
            <button onClick={() => deleteEntry(b.id, 'body')} className="text-slate-600 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex gap-6 text-sm">
            <p><span className="text-slate-500 text-xs">Peso:</span> <span className="font-bold text-emerald-400">{b.weight}kg</span></p>
            <p><span className="text-slate-500 text-xs">Cintura:</span> <span className="font-bold text-indigo-400">{b.waist}cm</span></p>
          </div>
        </div>
      ))}

      {/* Listagem de Treinos */}
      {history.length === 0 && bodyHistory.length === 0 && (
        <p className="text-slate-500 text-center py-10 italic">Nenhum registro encontrado.</p>
      )}

      {history.map((h) => (
        <div key={h.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl shadow-lg relative">
          <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
            <span className="font-bold text-indigo-400 text-[11px] tracking-tight uppercase">{h.date} • {h.dayName}</span>
            <button onClick={() => deleteEntry(h.id, 'workout')} className="text-slate-600 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
          
          {h.note && <p className="text-[11px] text-amber-500/80 italic mb-3">"{h.note}"</p>}
          
          <div className="space-y-3">
            {h.exercises.map((ex, j) => (
              <div key={j} className="flex flex-col gap-1 border-b border-slate-800/30 last:border-0 pb-2 last:pb-0">
                <span className={`text-[11px] font-bold ${ex.done ? "text-slate-200" : "text-slate-600 line-through"}`}>
                  {ex.name}
                </span>
                
                <div className="flex flex-wrap gap-1.5">
                  {/* Lógica de Transição: Se ex.sets for um array (novo formato), mapeia as séries. 
                      Se não for (formato antigo), mostra o ex.detail. */}
                  {Array.isArray(ex.sets) ? (
                    ex.sets.map((set, k) => (
                      <span key={k} className="text-[9px] font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-emerald-500">
                        {set.weight}kg × {set.reps}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-emerald-500">
                      {ex.detail}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <button 
        onClick={() => setView('workout')} 
        className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold mt-4 transition-colors text-sm uppercase tracking-widest"
      >
        VOLTAR AO TREINO
      </button>
    </main>
  );
};

export default HistoryView;