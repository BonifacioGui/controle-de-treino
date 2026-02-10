import React from 'react';
import { Plus, Trash2, Settings, Save } from 'lucide-react';

const ManageView = ({ activeDay, workoutData, addExercise, removeExercise, editExerciseBase, setView }) => {
  return (
    <main className="space-y-6 animate-in slide-in-from-right duration-500 font-cyber pb-24">
      
      {/* Header de Configuração Compacto */}
      <div className="flex justify-between items-center border-b border-secondary/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-secondary animate-[spin_4s_linear_infinite]" />
          <h2 className="text-lg font-black italic uppercase tracking-tighter neon-text-cyan text-primary">
            PROTOCOLO: <span className="text-secondary">{activeDay}</span>
          </h2>
        </div>
        <button 
          onClick={() => addExercise(activeDay)} 
          className="bg-success/10 border border-success/50 p-2 rounded-lg text-success hover:bg-success hover:text-black transition-all shadow-[0_0_10px_rgba(var(--success),0.2)] active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {/* Cards de Edição de Exercício Compactos */}
      <div className="space-y-3">
        {workoutData[activeDay].exercises.map((ex, i) => (
          <div key={i} className="bg-card border border-border p-3 rounded-xl relative group transition-all hover:border-primary/50 overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-primary transition-all duration-300"></div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.1em] ml-1">Identificação do Exercício</label>
                <input 
                  className="bg-input/50 border-b border-border focus:border-primary text-main font-bold text-sm w-full outline-none p-2 rounded-t transition-all placeholder-muted/50" 
                  value={ex.name} 
                  onChange={(e) => editExerciseBase(activeDay, i, 'name', e.target.value)} 
                />
              </div>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.1em] ml-1">Meta</label>
                  <input 
                    className="bg-input border border-border focus:border-secondary text-secondary text-sm font-black p-2 rounded-lg w-full outline-none transition-all uppercase placeholder-muted/30" 
                    value={ex.sets} 
                    placeholder="EX: 4X12"
                    onChange={(e) => editExerciseBase(activeDay, i, 'sets', e.target.value)} 
                  />
                </div>
                
                <button 
                  onClick={() => removeExercise(activeDay, i)} 
                  className="bg-input border border-red-500/30 text-red-500 p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm active:scale-95"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ação Final de Persistência */}
      <div className="pt-4">
        <button 
          onClick={() => setView('workout')} 
          className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:brightness-110 rounded-xl font-black text-white shadow-[0_5px_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 italic"
        >
          <Save size={16} /> EFETIVAR ALTERAÇÕES
        </button>
        
        <p className="text-[8px] text-muted text-center mt-4 uppercase font-black tracking-widest leading-relaxed opacity-60">
          * As alterações serão propagadas para o buffer de memória local.
        </p>
      </div>
    </main>
  );
};

export default ManageView;