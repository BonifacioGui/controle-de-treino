import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, Trophy } from 'lucide-react';

const ExercisePerformanceSummary = ({
  performance,
  className = '',
  emptyText = 'Sem referência anterior',
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ left: 12, top: 12 });
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = useId();

  const positionPopover = useCallback(() => {
    const button = buttonRef.current;
    if (!button || typeof window === 'undefined') return;
    const rect = button.getBoundingClientRect();
    const viewportPadding = 12;
    const width = Math.min(288, window.innerWidth - (viewportPadding * 2));
    const measuredHeight = popoverRef.current?.offsetHeight || 118;
    const left = Math.min(
      Math.max(viewportPadding, rect.left + (rect.width / 2) - (width / 2)),
      window.innerWidth - width - viewportPadding,
    );
    const below = rect.bottom + 8;
    const top = below + measuredHeight <= window.innerHeight - viewportPadding
      ? below
      : Math.max(viewportPadding, rect.top - measuredHeight - 8);
    setPopoverPosition({ left, top });
  }, []);

  useEffect(() => {
    if (!isHelpOpen) return undefined;
    positionPopover();
    const closeOnOutside = (event) => {
      if (buttonRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      setIsHelpOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsHelpOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('resize', positionPopover);
    window.addEventListener('scroll', positionPopover, true);
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', positionPopover);
      window.removeEventListener('scroll', positionPopover, true);
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isHelpOpen, positionPopover]);

  if (!performance?.lastSummary) {
    return <p className={`text-muted ${className}`}>{emptyText}</p>;
  }

  const { lastSummary, lastBestIsPr, pr } = performance;

  return (
    <div className={`text-muted ${className}`}>
      <div className="inline-flex items-center gap-1">
        <span className="text-[0.9em] font-black uppercase tracking-[0.12em]">Referência</span>
        <button
          ref={buttonRef}
          type="button"
          aria-label="O que significa Referência?"
          aria-expanded={isHelpOpen}
          aria-controls={popoverId}
          onClick={() => setIsHelpOpen((current) => !current)}
          className="touch-target -my-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <CircleHelp aria-hidden="true" size={14} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-main">
        <span className="font-semibold">{lastSummary}</span>
        {lastBestIsPr && (
          <span className="inline-flex shrink-0 items-center gap-1 font-black text-gold" aria-label="Esta referência também é o recorde histórico">
            <Trophy aria-hidden="true" size={13} /> PR
          </span>
        )}
      </div>

      {pr && !lastBestIsPr && (
        <div className="mt-1.5 inline-flex items-start gap-x-1 font-semibold text-gold">
          <Trophy aria-hidden="true" size={13} className="mt-0.5 shrink-0" />
          <span>PR {pr.primary}{pr.secondary ? <span className="ml-1 font-normal">• {pr.secondary}</span> : null}</span>
        </div>
      )}

      {isHelpOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          className="fixed z-[1200] w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-primary/35 bg-card p-3 text-left text-xs leading-relaxed text-muted shadow-2xl"
          style={popoverPosition}
        >
          <p className="font-black text-main">Referência</p>
          <p className="mt-1">Melhor série registrada no último treino deste exercício. Use como base para ajustar sua carga ou repetições hoje.</p>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default ExercisePerformanceSummary;
