import React, { useState, useEffect } from 'react';
import { Scroll, CheckCircle2, Circle } from 'lucide-react';

const QuestBoard = () => {
  const [quests, setQuests] = useState([]);

  const loadQuests = () => {
    // Adicionei um log para garantir que ele está lendo
    const saved = JSON.parse(localStorage.getItem('daily_quests') || '[]');
    setQuests(saved);
  };

  useEffect(() => {
    loadQuests();

    // AGORA ELE OUVE O EVENTO CERTO
    window.addEventListener('quest_update', loadQuests);
    
    // Mantemos o 'storage' caso você abra em outra aba
    window.addEventListener('storage', loadQuests);

    return () => {
      window.removeEventListener('quest_update', loadQuests);
      window.removeEventListener('storage', loadQuests);
    };
  }, []);

  if (quests.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Scroll className="text-primary" size={20} />
        {/* 🔥 AJUSTE: text-main dark:text-white */}
        <h3 className="font-black text-main dark:text-white uppercase tracking-wider text-sm">Contratos Diários</h3>
      </div>

      <div className="space-y-3 relative z-10">
        {quests.map((quest) => (
          <div 
            key={quest.id} 
            className={`p-3 rounded-xl border transition-all duration-500 flex items-center justify-between gap-3
              ${quest.completed 
                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]' 
                : 'bg-input/80 dark:bg-black/20 border-border/50 dark:border-white/5 opacity-80' // 🔥 AJUSTE: Dinâmico claro/escuro
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`transition-all duration-500 ${quest.completed ? 'text-primary scale-110' : 'text-muted'}`}>
                {quest.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>

              <div>
                {/* 🔥 AJUSTE: text-main dark:text-white quando não completado */}
                <span className={`text-xs font-black uppercase tracking-wide block ${quest.completed ? 'text-primary' : 'text-main dark:text-white'}`}>
                  {quest.title}
                </span>
                <span className="text-[10px] text-muted font-bold block leading-tight mt-0.5">
                  {quest.desc}
                </span>
              </div>
            </div>

            <div className={`px-2 py-1 rounded text-[9px] font-black border uppercase whitespace-nowrap
              ${quest.completed 
                ? 'bg-primary text-black border-primary' 
                : 'bg-warning/10 dark:bg-black text-warning border-warning/30' // 🔥 AJUSTE: Evitando fundo preto fixo no modo claro
              }`}>
              +{quest.reward} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestBoard;