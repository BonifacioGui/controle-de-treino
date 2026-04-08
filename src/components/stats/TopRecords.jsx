import React from 'react';
import { Trophy } from 'lucide-react';

const TopRecords = ({ records }) => {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <Trophy size={12} className="text-primary" /> TOP RECORDES
        </h3>
      </div>
      
      <div className="bg-card border border-border p-3 rounded-2xl w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
        {records && records.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {records.map(([name, weight]) => (
              <div 
                key={name} 
                // 🔥 AJUSTE: bg-input/50 para o claro e bg-black/20 para o escuro, dando contraste sem perder a harmonia
                className="bg-input/50 dark:bg-black/20 p-2 rounded-xl border border-warning/30 relative overflow-hidden group transition-all hover:border-warning/60 shadow-sm"
              >
                {/* Efeito hover cyberpunk sutil */}
                <div className="absolute inset-0 bg-gradient-to-tr from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <h4 
                  className="text-[9px] font-bold text-main dark:text-white truncate uppercase relative z-10" 
                  title={name}
                >
                  {name}
                </h4>
                <p className="text-lg font-black text-main dark:text-white relative z-10 mt-0.5">
                  {weight}<span className="text-[8px] ml-0.5 text-warning font-bold tracking-widest">KG</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted text-[10px] uppercase opacity-50 text-center px-4 py-6">
            Aguardando recordes de combate.
          </div>
        )}
      </div>
    </section>
  );
};

export default TopRecords;