import React from 'react';
import { Trophy } from 'lucide-react';

const TopRecords = ({ records }) => {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-muted uppercase tracking-[0.16em] flex items-center gap-2">
          <Trophy size={12} className="text-primary" /> TOP RECORDES
        </h3>
      </div>
      
      <div className="bg-card border border-border p-3 rounded-2xl w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
        {records && records.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {records.map((record) => {
              const normalized = Array.isArray(record)
                ? { name: record[0], primary: `${record[1]} kg`, secondary: null }
                : record;
              return (
              <div 
                key={`${normalized.name}-${normalized.mode || ''}`}
                className="bg-input/50 dark:bg-black/20 p-2 rounded-xl border border-warning/30 relative overflow-hidden group transition-all hover:border-warning/60 shadow-sm"
              >
                {/* Efeito hover cyberpunk sutil */}
                <div className="absolute inset-0 bg-gradient-to-tr from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <h4 
                  className="text-xs font-bold text-main truncate uppercase relative z-10"
                  title={normalized.name}
                >
                  {normalized.name}
                </h4>
                <p className="relative z-10 mt-1 truncate text-sm font-black text-main dark:text-white" title={normalized.primary}>
                  {normalized.primary}
                </p>
                {normalized.secondary && <p className="relative z-10 mt-0.5 truncate text-[10px] font-bold text-warning" title={normalized.secondary}>{normalized.secondary}</p>}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted text-xs uppercase text-center px-4 py-6">
            Aguardando recordes de combate.
          </div>
        )}
      </div>
    </section>
  );
};

export default TopRecords;
