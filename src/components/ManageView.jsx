import React from 'react';
import { Plus, Trash2, Settings, Save, Zap } from 'lucide-react';

const ManageView = ({ activeDay, workoutData, addExercise, removeExercise, editExerciseBase, setView }) => {
  return (
    <main className="space-y-6 animate-in slide-in-from-right duration-500 font-cyber pb-10">
      
      {/* Header de Configuração */}
      <div className="flex justify-between items-center border-b-2 border-pink-500/30 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Settings size={22} className="text-pink-500 animate-[spin_4s_linear_infinite]" />
          <h2 className="text-xl font-black italic uppercase tracking-tighter neon-text-cyan">
            PROTOCOLO: <span className="text-pink-500">{activeDay}</span>
          </h2>
        </div>
        <button 
          onClick={() => addExercise(activeDay)} 
          className="bg-emerald-500/20 border border-emerald-500/50 p-2 rounded-lg text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Cards de Edição de Exercício */}
      <div className="space-y-4">
        {workoutData[activeDay].exercises.map((ex, i) => (
          <div key={i} className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl relative group transition-all hover:border-cyan-500/30">
            <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-cyan-500 transition-all duration-300"></div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identificação do Exercício</label>
                <input 
                  className="bg-slate-900/50 border-b-2 border-slate-800 focus:border-cyan-500 text-cyan-100 font-bold text-base w-full outline-none p-2 rounded-t-lg transition-all" 
                  value={ex.name} 
                  onChange={(e) => editExerciseBase(activeDay, i, 'name', e.target.value)} 
                />
              </div>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Meta de Performance (Séries x Reps)</label>
                  <input 
                    className="bg-slate-950 border border-slate-800 focus:border-pink-500 text-pink-400 text-xs font-black p-3 rounded-xl w-full outline-none transition-all uppercase" 
                    value={ex.sets} 
                    placeholder="EX: 4X12"
                    onChange={(e) => editExerciseBase(activeDay, i, 'sets', e.target.value)} 
                  />
                </div>
                
                <button 
                  onClick={() => removeExercise(activeDay, i)} 
                  className="bg-slate-900 border border-red-500/30 text-red-500 p-3 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg mb-0.5"
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
          className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 rounded-2xl font-black text-black shadow-[0_10px_30px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 italic"
        >
          <Save size={18} /> EFETIVAR ALTERAÇÕES
        </button>
        
        <p className="text-[9px] text-slate-600 text-center mt-6 uppercase font-black tracking-widest leading-relaxed">
          * As alterações serão propagadas para o buffer de memória local. <br/>
          Pressione <span className="text-indigo-400">Save</span> para sincronizar o banco de dados.
        </p>
      </div>
    </main>
  );
};

export default ManageView;