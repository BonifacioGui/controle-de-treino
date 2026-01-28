import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const ManageView = ({ activeDay, workoutData, addExercise, removeExercise, editExerciseBase, setView }) => {
  return (
    <main className="space-y-4 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black italic uppercase tracking-tight">
          EDITAR PLANILHA: {activeDay}
        </h2>
        <button 
          onClick={() => addExercise(activeDay)} 
          className="bg-emerald-600 p-2 rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus size={20}/>
        </button>
      </div>

      {workoutData[activeDay].exercises.map((ex, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nome do Exercício</label>
            <input 
              className="bg-transparent font-bold text-lg w-full border-b border-slate-800 focus:border-indigo-500 outline-none pb-1" 
              value={ex.name} 
              onChange={(e) => editExerciseBase(activeDay, i, 'name', e.target.value)} 
            />
          </div>
          
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Séries/Meta</label>
              <input 
                className="bg-slate-950 text-xs p-2 rounded w-full border border-slate-800 focus:border-indigo-500 outline-none" 
                value={ex.sets} 
                placeholder="Ex: 3x10"
                onChange={(e) => editExerciseBase(activeDay, i, 'sets', e.target.value)} 
              />
            </div>
            <button 
              onClick={() => removeExercise(activeDay, i)} 
              className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors mb-0.5"
            >
              <Trash2 size={18}/>
            </button>
          </div>
        </div>
      ))}

      <button 
        onClick={() => setView('workout')} 
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black mt-4 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
      >
        CONCLUIR E SALVAR PLANILHA
      </button>
    </main>
  );
};

export default ManageView;