import React from 'react';
import { Plus, Trash2, Settings, Save } from 'lucide-react';

const ManageView = ({ activeDay, workoutData, addExercise, removeExercise, editExerciseBase, setView }) => {
  return (
    <main className="space-y-8 animate-in slide-in-from-right duration-500 font-cyber pb-32">
      
      {/* Header de Configuração */}
      <div className="flex justify-between items-center border-b-2 border-secondary/30 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-secondary animate-[spin_4s_linear_infinite]" />
          <h2 className="text-2xl font-black italic uppercase tracking-tighter neon-text-cyan text-primary">
            PROTOCOLO: <span className="text-secondary">{activeDay}</span>
          </h2>
        </div>
        <button 
          onClick={() => addExercise(activeDay)} 
          className="bg-success/10 border border-success/50 p-3 rounded-xl text-success hover:bg-success hover:text-black transition-all shadow-[0_0_15px_rgba(var(--success),0.2)] active:scale-95"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Cards de Edição de Exercício */}
      <div className="space-y-5">
        {workoutData[activeDay].exercises.map((ex, i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-2xl relative group transition-all hover:border-primary/50 overflow-hidden shadow-md">
            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-primary transition-all duration-300"></div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted uppercase tracking-[0.2em] ml-1">Identificação do Exercício</label>
                <input 
                  className="bg-input/50 border-b-2 border-border focus:border-primary text-main font-bold text-lg w-full outline-none p-3 rounded-t-lg transition-all placeholder-muted/50" 
                  value={ex.name} 
                  onChange={(e) => editExerciseBase(activeDay, i, 'name', e.target.value)} 
                />
              </div>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-black text-muted uppercase tracking-[0.2em] ml-1">Meta de Performance</label>
                  <input 
                    className="bg-input border border-border focus:border-secondary text-secondary text-base font-black p-4 rounded-xl w-full outline-none transition-all uppercase placeholder-muted/30" 
                    value={ex.sets} 
                    placeholder="EX: 4X12"
                    onChange={(e) => editExerciseBase(activeDay, i, 'sets', e.target.value)} 
                  />
                </div>
                
                <button 
                  onClick={() => removeExercise(activeDay, i)} 
                  className="bg-input border border-red-500/30 text-red-500 p-4 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"
                >
                  <Trash2 size={24}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ação Final de Persistência */}
      <div className="pt-8">
        <button 
          onClick={() => setView('workout')} 
          className="w-full py-6 bg-gradient-to-r from-primary to-secondary hover:brightness-110 rounded-2xl font-black text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] active:scale-95 transition-all uppercase tracking-[0.2em] text-base flex items-center justify-center gap-3 italic"
        >
          <Save size={20} /> EFETIVAR ALTERAÇÕES
        </button>
        
        <p className="text-[10px] text-muted text-center mt-6 uppercase font-black tracking-widest leading-relaxed opacity-60">
          * As alterações serão propagadas para o buffer de memória local. <br/>
          Pressione <span className="text-primary">Save</span> para sincronizar.
        </p>
      </div>
    </main>
  );
};

export default ManageView;