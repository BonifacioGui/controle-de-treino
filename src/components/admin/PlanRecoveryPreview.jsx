import React, { useState } from 'react';
import { ArchiveRestore, ChevronDown, ChevronUp } from 'lucide-react';
import { RECOVERED_WORKOUT_PLAN } from '../../data/recoveredWorkoutPlan';

const PlanRecoveryPreview = ({ onRecover }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="mx-1 rounded-2xl border border-primary/40 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <ArchiveRestore aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={22} />
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-main">Recuperar ficha A/B/C</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Prévia reconstruída a partir da ficha confirmada e dos snapshots do histórico. Seu histórico, XP, medidas e sessões não serão alterados.</p>
        </div>
      </div>

      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="touch-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-main">
        {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        {expanded ? 'Ocultar prévia' : 'Revisar ficha antes de recuperar'}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {Object.entries(RECOVERED_WORKOUT_PLAN).map(([day, workout]) => (
            <article key={day} className="rounded-xl border border-border bg-card p-3">
              <h3 className="font-black text-primary">{day} · {workout.focus}</h3>
              <ol className="mt-2 space-y-1.5 text-sm text-muted">
                {workout.exercises.map((exercise) => (
                  <li key={exercise.name} className="flex items-start justify-between gap-3">
                    <span><span className="font-bold text-main">{exercise.name}</span>{exercise.alternatives?.length > 0 ? ` · alternativa: ${exercise.alternatives.join(', ')}` : ''}</span>
                    <span className="shrink-0 font-black text-secondary">{exercise.sets}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}

          <p className="rounded-xl border border-border bg-input/60 p-3 text-sm leading-relaxed text-muted">As metas são valores iniciais e continuam editáveis depois da recuperação.</p>

          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="touch-target w-full rounded-xl bg-primary font-black text-on-primary">Quero usar esta ficha</button>
          ) : (
            <div className="rounded-xl border border-warning/40 bg-card p-3">
              <p className="text-sm font-bold text-main">Substituir a ficha atual por esta versão A/B/C?</p>
              <p className="mt-1 text-xs text-muted">Uma cópia da ficha atual será guardada antes da troca.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="touch-target rounded-xl border border-border font-bold text-main">Cancelar</button>
                <button type="button" onClick={() => { onRecover(); setConfirming(false); }} className="touch-target rounded-xl bg-warning font-black text-on-warning">Recuperar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default PlanRecoveryPreview;
