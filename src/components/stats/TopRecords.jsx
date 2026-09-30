import React from 'react';
import { Trophy } from 'lucide-react';

const TopRecords = ({ records }) => {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gold">
          <Trophy aria-hidden="true" size={13} /> TOP RECORDES
        </h3>
      </div>
      
      <div className="bg-card border border-border p-3 rounded-2xl w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
        {records && records.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {records.map((record) => {
              const normalized = Array.isArray(record)
                ? { name: record[0], primary: `${record[1]} kg`, secondary: null }
                : record;
              return (
              <div 
                key={`${normalized.name}-${normalized.mode || ''}`}
                className="group relative overflow-hidden rounded-xl border border-gold/30 bg-input/50 p-2 shadow-sm transition-all hover:border-gold/60 dark:bg-black/20"
              >
                {/* Efeito hover cyberpunk sutil */}
                <div className="absolute inset-0 bg-gradient-to-tr from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <h4 
                  className="relative z-10 break-words text-xs font-bold uppercase text-main"
                  title={normalized.name}
                >
                  {normalized.name}
                </h4>
                <p className="relative z-10 mt-1 flex items-center gap-1.5 text-sm font-black text-gold" title={normalized.primary}>
                  <Trophy aria-hidden="true" size={13} className="shrink-0" />
                  <span className="min-w-0 break-words">{normalized.primary}</span>
                </p>
                {normalized.secondary && <p className="relative z-10 mt-0.5 break-words text-[10px] font-bold text-gold" title={normalized.secondary}>{normalized.secondary}</p>}
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
