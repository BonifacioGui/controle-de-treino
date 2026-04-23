import React, { useState } from 'react';
import { X } from 'lucide-react';

const ExerciseSearchModal = ({ exercises, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-card w-full max-w-sm rounded-2xl border border-primary/30 flex flex-col max-h-[75vh] overflow-hidden shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex justify-between items-center bg-input/50">
          <h3 className="font-black text-primary uppercase text-sm tracking-widest">SISTEMA DE BUSCA</h3>
          <button onClick={onClose} className="text-muted p-1 hover:text-red-500 transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        <div className="p-3">
          <input 
            type="text" 
            placeholder="Filtrar base de dados..." 
            className="bg-input dark:bg-black/60 w-full p-3 rounded-xl border border-border dark:border-white/5 text-main dark:text-white text-xs outline-none focus:border-primary/50 transition-all placeholder:text-muted" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            autoFocus 
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          {exercises
            .filter(ex => ex.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(ex => (
              <button 
                key={ex} 
                onClick={() => {
                  onSelect(ex);
                  onClose();
                }} 
                className="w-full text-left p-4 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-primary/10 dark:hover:bg-white/5 text-muted hover:text-primary"
              >
                {ex}
              </button>
            ))
          }
          
          {/* Feedback caso a busca não encontre nada */}
          {exercises.filter(ex => ex.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="text-center p-4 text-muted text-[10px] uppercase font-bold">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseSearchModal;