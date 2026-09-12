import React, { useCallback, useEffect, useState } from 'react';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { readUserStoredJSON, STORAGE_KEYS } from '../../utils/storage';

const QuestBoard = ({ userId, questsOverride }) => {
  const [storedQuests, setStoredQuests] = useState(() => (
    userId ? readUserStoredJSON(userId, STORAGE_KEYS.quests, []) : []
  ));
  const quests = Array.isArray(questsOverride) ? questsOverride : storedQuests;

  const loadQuests = useCallback(() => {
    if (!Array.isArray(questsOverride)) {
      setStoredQuests(userId ? readUserStoredJSON(userId, STORAGE_KEYS.quests, []) : []);
    }
  }, [questsOverride, userId]);

  useEffect(() => {
    window.addEventListener('quest_update', loadQuests);
    window.addEventListener('storage', loadQuests);

    return () => {
      window.removeEventListener('quest_update', loadQuests);
      window.removeEventListener('storage', loadQuests);
    };
  }, [loadQuests]);

  if (quests.length === 0) return null;

  return (
    <div className="pt-1 pb-3 relative z-10 w-full">
      <div className="flex items-center gap-2 mb-3 border-b border-primary/10 pb-2">
        <Target className="text-primary" size={16} />
        <h3 className="text-sm font-black text-main dark:text-white">Missões do dia</h3>
      </div>

      <div className="space-y-2 relative z-10">
        {quests.map((quest) => (
          <div 
            key={quest.id} 
            className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3
              ${quest.completed 
                ? 'bg-primary/5 border-primary/30 shadow-sm grayscale-[20%]'
                : 'bg-input/30 dark:bg-black/20 border-border dark:border-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`transition-all duration-500 flex shrink-0 ${quest.completed ? 'text-primary' : 'text-muted'}`}>
                {quest.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>

              <div>
                <span className={`block text-sm font-black leading-tight ${quest.completed ? 'text-primary' : 'text-main dark:text-white'}`}>
                  {quest.title}
                </span>
                <span className="mt-1 block text-xs font-medium leading-tight text-muted">
                  {quest.desc}
                </span>
              </div>
            </div>

            <div className={`px-2 py-1 rounded-md text-xs font-black border uppercase whitespace-nowrap tracking-widest shrink-0
              ${quest.completed 
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-secondary/10 text-secondary border-secondary/30'
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
