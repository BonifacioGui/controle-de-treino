import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle } from 'lucide-react';

const QuestBoard = () => {
  const [quests, setQuests] = useState([]);

  const loadQuests = () => {
    const saved = JSON.parse(localStorage.getItem('daily_quests') || '[]');
    setQuests(saved);
  };

  useEffect(() => {
    loadQuests();
    window.addEventListener('quest_update', loadQuests);
    window.addEventListener('storage', loadQuests);

    return () => {
      window.removeEventListener('quest_update', loadQuests);
      window.removeEventListener('storage', loadQuests);
    };
  }, []);

  // 🔥 A MÁGICA: Se não tem missão, ele simplesmente não renderiza NADA.
  if (quests.length === 0) return null;

  return (
    <div className="pt-1 pb-3 relative z-10 w-full">
      <div className="flex items-center gap-2 mb-3 border-b border-[#00f3ff]/10 pb-2">
        <Target className="text-[#00f3ff]" size={16} />
        <h3 className="font-black text-main dark:text-white uppercase tracking-[0.2em] text-[11px]">Ordens do Dia</h3>
      </div>

      <div className="space-y-2 relative z-10">
        {quests.map((quest) => (
          <div 
            key={quest.id} 
            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3
              ${quest.completed 
                ? 'bg-[#00f3ff]/5 border-[#00f3ff]/30 shadow-[0_0_8px_rgba(0,243,255,0.1)] grayscale-[20%]' 
                : 'bg-input/30 dark:bg-black/20 border-border dark:border-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`transition-all duration-500 flex shrink-0 ${quest.completed ? 'text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.6)]' : 'text-muted'}`}>
                {quest.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>

              <div>
                <span className={`text-[11px] font-black uppercase tracking-wide block leading-tight ${quest.completed ? 'text-[#00f3ff]' : 'text-main dark:text-white'}`}>
                  {quest.title}
                </span>
                <span className="text-[9px] text-muted font-bold block leading-tight mt-0.5 uppercase">
                  {quest.desc}
                </span>
              </div>
            </div>

            <div className={`px-2 py-1 rounded-md text-[8px] font-black border uppercase whitespace-nowrap tracking-widest shrink-0
              ${quest.completed 
                ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff]/30' 
                : 'bg-[#ff00ff]/10 text-[#ff00ff] border-[#ff00ff]/30 drop-shadow-[0_0_5px_rgba(255,0,255,0.2)]'
              }`}
            >
              +{quest.reward} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestBoard;