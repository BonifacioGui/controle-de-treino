import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleHelp, Pencil, Shield, X } from 'lucide-react';

const EFFECT_LABELS = Object.freeze([
  ['workouts', 'Treinos'],
  ['quests', 'Missões'],
  ['attributes', 'Atributos'],
  ['xp', 'XP'],
  ['rewards', 'Recompensas'],
  ['progression', 'Progressão'],
  ['profileAppearance', 'Aparência do perfil'],
]);

const ClassDetailsDialog = ({ classDetails, onClose, onEdit }) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!classDetails) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button type="button" aria-label="Fechar explicação da classe" className="absolute inset-0" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="class-details-title" className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-primary/40 bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-secondary/40 bg-secondary/10 text-2xl">{classDetails.icon}</span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Entenda sua classe</p>
              <h2 id="class-details-title" className="mt-1 font-cyber text-xl font-black uppercase text-main">{classDetails.label}</h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">Tema: {classDetails.theme}</p>
            </div>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fechar" className="touch-target -m-2 flex shrink-0 items-center justify-center rounded-xl text-muted hover:text-main"><X size={22} /></button>
        </header>

        <p className="mt-5 text-sm leading-relaxed text-main">{classDetails.description}</p>

        <dl className="mt-5 space-y-4 text-sm">
          <div className="rounded-xl border border-border bg-input/60 p-4">
            <dt className="flex items-center gap-2 font-black text-main"><Shield size={17} className="text-primary" /> Por que recebi esta classe?</dt>
            <dd className="mt-2 leading-relaxed text-muted">{classDetails.assignmentReason}</dd>
          </div>
          <div className="rounded-xl border border-border bg-input/60 p-4">
            <dt className="flex items-center gap-2 font-black text-main"><CircleHelp size={17} className="text-primary" /> Relação com seus objetivos</dt>
            <dd className="mt-2 leading-relaxed text-muted">{classDetails.goalRelationship}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted">Efeitos reais no aplicativo</h3>
          <div className="mt-3 grid gap-2 min-[380px]:grid-cols-2">
            {EFFECT_LABELS.map(([key, label]) => {
              const enabled = classDetails.effects?.[key] === true;
              return (
                <div key={key} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold ${enabled ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-input/40 text-muted'}`}>
                  {enabled ? <Check size={15} /> : <X size={15} />} {label}: {enabled ? 'sim' : 'não'}
                </div>
              );
            })}
          </div>
          <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-muted"><strong className="text-main">Hoje, a classe é somente visual.</strong> Ela não muda regras, resultados ou velocidade de evolução.</p>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs leading-relaxed text-muted">{classDetails.changeHint}</p>
          <button type="button" onClick={onEdit} className="touch-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-on-primary"><Pencil size={16} /> Alterar classe</button>
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default ClassDetailsDialog;
