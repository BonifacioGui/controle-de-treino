import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const WorkoutSelector = ({ workoutData, activeDay, sessionActive, workoutStatuses = {}, onSelect }) => {
  const activeCardRef = useRef(null);
  const selectorRef = useRef(null);

  useEffect(() => {
    let resizeFrame;
    const revealActiveCard = (behavior = 'smooth') => {
      const card = activeCardRef.current;
      const selector = selectorRef.current;
      if (!card || !selector) return;
      const left = card.offsetLeft - ((selector.clientWidth - card.clientWidth) / 2);
      selector.scrollTo({ left: Math.max(0, left), behavior });
    };
    const frame = window.requestAnimationFrame(() => revealActiveCard());
    const onResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => revealActiveCard('auto'));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', onResize);
    };
  }, [activeDay]);

  return (
    <nav ref={selectorRef} aria-label="Treinos do plano" className="mb-3 flex scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {Object.entries(workoutData || {}).map(([day, workout]) => {
        const isActive = activeDay === day;
        const locked = sessionActive && !isActive;
        const status = workoutStatuses[day];
        return (
          <button
            type="button"
            key={day}
            ref={isActive ? activeCardRef : null}
            onClick={() => !locked && !isActive && onSelect(day, status)}
            disabled={locked}
            aria-current={isActive ? 'page' : undefined}
            data-workout-day={day}
            className={`relative min-h-14 w-[168px] shrink-0 rounded-xl border px-3 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:w-[210px] ${isActive ? 'border-primary bg-primary/10 text-main shadow-[0_0_14px_rgba(var(--primary),0.14)]' : 'border-border bg-card text-main'}`}
          >
            <span className="block truncate text-sm font-black">{workout.title || `Treino ${day}`}</span>
            <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-muted">{workout.focus || 'Foco geral'}</span>
              {isActive && <span className="shrink-0 font-black text-primary">Selecionado</span>}
              {!isActive && status?.completedOnDate && <span className="flex shrink-0 items-center gap-0.5 font-black text-success"><Check size={11} /> Feito</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default WorkoutSelector;
