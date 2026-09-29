import React from 'react';
import { Trophy } from 'lucide-react';

const ExercisePerformanceSummary = ({
  performance,
  className = '',
  emptyText = 'Sem registro anterior para este exercício.',
}) => {
  if (!performance?.lastSummary) {
    return <p className={`text-muted ${className}`}>{emptyText}</p>;
  }

  const { lastSummary, lastBestIsPr, pr } = performance;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-muted ${className}`}>
      <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1">
        <span className="font-bold">Melhor da última:</span>
        <span>{lastSummary}</span>
      </span>

      {lastBestIsPr && (
        <span className="inline-flex shrink-0 items-center text-gold" aria-label="Recorde histórico">
          <Trophy aria-hidden="true" size={13} />
        </span>
      )}

      {pr && !lastBestIsPr && (
        <span className="inline-flex items-center gap-x-1 font-semibold text-gold">
          <Trophy aria-hidden="true" size={13} className="shrink-0" />
          <span>PR: {pr.primary}{pr.secondary ? <span className="ml-1 font-normal">• {pr.secondary}</span> : null}</span>
        </span>
      )}
    </div>
  );
};

export default ExercisePerformanceSummary;
