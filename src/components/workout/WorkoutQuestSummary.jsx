import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Crosshair } from 'lucide-react';
import QuestBoard from '../rpg/QuestBoard';
import { readUserStoredJSON, STORAGE_KEYS } from '../../utils/storage';

const WorkoutQuestSummary = ({ userId, questsOverride }) => {
  const [expanded, setExpanded] = useState(false);
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    const loadQuests = () => setQuests(Array.isArray(questsOverride)
      ? questsOverride
      : (userId ? readUserStoredJSON(userId, STORAGE_KEYS.quests, []) : []));
    loadQuests();
    window.addEventListener('quest_update', loadQuests);
    return () => window.removeEventListener('quest_update', loadQuests);
  }, [questsOverride, userId]);

  if (quests.length === 0) return null;
  const completed = quests.filter((quest) => quest.completed).length;

  return (
    <section className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="touch-target flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm text-main"><Crosshair size={17} className="shrink-0 text-secondary" /><span><span className="font-black">Missões</span> <span className="text-muted">• {completed}/{quests.length} concluídas</span></span></span>
        {expanded ? <ChevronUp className="shrink-0 text-muted" size={18} /> : <ChevronDown className="shrink-0 text-muted" size={18} />}
      </button>
      {expanded && <div className="border-t border-border p-2"><QuestBoard userId={userId} questsOverride={questsOverride} /></div>}
    </section>
  );
};

export default WorkoutQuestSummary;
