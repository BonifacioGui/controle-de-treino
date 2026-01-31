import React from 'react';
import { Plus, Trash2, Settings, Save } from 'lucide-react';

const ManageView = ({ activeDay, workoutData, addExercise, removeExercise, editExerciseBase, setView }) => {
  return (
    // MUDANÇA: bg-page e text-main implícitos pelo App, mas font-cyber e pb-24 ajustados
    <main className="space-y-6 animate-in slide-in-from-right duration-500 font-cyber pb-24">
      
      {/* Header de Configuração */}
      <div className="flex justify-between items-center border-b-2 border-secondary/30 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-secondary animate-[spin_4s_linear_infinite]" />
          <h2 className="text-xl font-black italic uppercase tracking-tighter neon-text-cyan text-primary">
            PROTOCOLO: <span className="text-secondary">{activeDay}</span>
          </h2>
        </div>
        <button 
          onClick={() => addExercise(activeDay)} 
          className="bg-success/10 border border-success/50 p-2 rounded-lg text-success hover:bg-success hover:text-black transition-all shadow-[0_0_15px_rgba(var(--success),0.2)]"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Cards de Edição de Exercício */}
      <div className="space-y-4">
        {workoutData[activeDay].exercises.map((ex, i) => (
          // MUDANÇA: bg-card, border-border
          <div key={i} className="bg-card border border-border p-5 rounded-2xl relative group transition-all hover:border-primary/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-primary transition-all duration-300"></div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-muted uppercase tracking-[0.2em] ml-1">Identificação do Exercício</label>
                {/* MUDANÇA: bg-input, text-main */}
                <input 
                  className="bg-input/50 border-b-2 border-border focus:border-primary text-main font-bold text-base w-full outline-none p-2 rounded-t-lg transition-all placeholder-muted" 
                  value={ex.name} 
                  onChange={(e) => editExerciseBase(activeDay, i, 'name', e.target.value)} 
                />
              </div>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[8px] font-black text-muted uppercase tracking-[0.2em] ml-1">Meta de Performance</label>
                  {/* MUDANÇA: bg-input, text-secondary */}
                  <input 
                    className="bg-input border border-border focus:border-secondary text-secondary text-xs font-black p-3 rounded-xl w-full outline-none transition-all uppercase placeholder-muted/50" 
                    value={ex.sets} 
                    placeholder="EX: 4X12"
                    onChange={(e) => editExerciseBase(activeDay, i, 'sets', e.target.value)} 
                  />
                </div>
                
                <button 
                  onClick={() => removeExercise(activeDay, i)} 
                  className="bg-input border border-red-500/30 text-red-500 p-3 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg mb-0.5"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ação Final de Persistência */}
      <div className="pt-6">
        <button 
          onClick={() => setView('workout')} 
          // CORREÇÃO: Usar from-primary to-secondary para pegar as cores do tema
          className="w-full py-5 bg-gradient-to-r from-primary to-secondary hover:brightness-110 rounded-2xl font-black text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 italic"
        >
          <Save size={18} /> EFETIVAR ALTERAÇÕES
        </button>
        
        <p className="text-[9px] text-muted text-center mt-6 uppercase font-black tracking-widest leading-relaxed">
          * As alterações serão propagadas para o buffer de memória local. <br/>
          Pressione <span className="text-indigo-400">Save</span> para sincronizar o banco de dados.
        </p>
      </div>
    </main>
  );
};

export default ManageView;