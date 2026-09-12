import React from 'react';

const ProgressionDetails = ({ id, info, levelProgress, valueLabel }) => {
  if (!info) return null;

  return (
    <div
      id={id}
      role="region"
      aria-label={`Como evoluir ${info.name}`}
      className="rounded-xl border border-primary/25 bg-input/60 p-4 text-left shadow-inner"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-main">{info.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{info.summary}</p>
        </div>
        {valueLabel && <span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-black text-primary">{valueLabel}</span>}
      </div>

      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <dt className="font-black text-main">Como evoluir</dt>
          <dd className="mt-0.5 text-muted">{info.howToEarn}</dd>
        </div>
        <div>
          <dt className="font-black text-main">Como é calculado</dt>
          <dd className="mt-0.5 text-muted">{info.calculation}</dd>
        </div>
      </dl>

      {levelProgress && (
        <p className="mt-4 border-t border-border pt-3 text-xs font-bold leading-relaxed text-muted">
          Nível {levelProgress.level}: faltam {levelProgress.xpRemaining.toLocaleString('pt-BR')} XP para o nível {levelProgress.level + 1}, que começa em {levelProgress.nextThreshold.toLocaleString('pt-BR')} XP.
        </p>
      )}
    </div>
  );
};

export default ProgressionDetails;
