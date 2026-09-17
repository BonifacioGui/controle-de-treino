import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Dumbbell,
  Move3D,
  ShieldCheck,
  Wind,
  X,
} from 'lucide-react';
import { getExerciseInstructions } from '../../data/exerciseInstructions';

const ExerciseGuide = ({ exerciseName, onClose }) => {
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const guide = getExerciseInstructions(exerciseName);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || [])];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-guide-title"
      aria-describedby="exercise-guide-description"
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:max-h-[88dvh] sm:max-w-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-border bg-input/55 px-4 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div aria-hidden="true" className="mx-auto mb-3 h-1 w-12 rounded-full bg-muted/35 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                {guide.category}
              </span>
              <h2 id="exercise-guide-title" className="mt-2 text-lg font-black leading-tight text-main sm:text-xl">
                {guide.exerciseName}
              </h2>
              <p id="exercise-guide-description" className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                Guia rápido de execução. Ajuste carga e amplitude ao seu nível.
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar guia de execução"
              className="touch-target flex shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted transition hover:border-primary/50 hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          <section aria-labelledby="exercise-guide-steps">
            <h3 id="exercise-guide-steps" className="flex items-center gap-2 text-sm font-black text-main">
              <Move3D size={17} className="text-primary" aria-hidden="true" /> Sequência visual
            </h3>
            <ol className="mt-3 grid gap-2 min-[430px]:grid-cols-3">
              {guide.cues.map((cue, index) => (
                <li key={cue} className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-3">
                  <span className="absolute right-2 top-1 text-3xl font-black text-primary/10" aria-hidden="true">{index + 1}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/35 bg-card text-xs font-black text-primary">{index + 1}</span>
                  <p className="relative mt-3 text-xs font-black leading-relaxed text-main">{cue}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-2xl border border-border bg-input/35 p-4">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                <ShieldCheck size={16} aria-hidden="true" /> Posição inicial
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{guide.position}</p>
            </section>
            <section className="rounded-2xl border border-border bg-input/35 p-4">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-secondary">
                <Dumbbell size={16} aria-hidden="true" /> Execução
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{guide.execution}</p>
            </section>
          </div>

          <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Wind size={16} aria-hidden="true" /> Respiração
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{guide.breathing}</p>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-2xl border border-danger/25 bg-danger/5 p-4">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-danger">
                <AlertTriangle size={16} aria-hidden="true" /> Evite estes erros
              </h3>
              <ul className="mt-3 space-y-2">
                {guide.errors.map((error) => (
                  <li key={error} className="flex gap-2 text-xs leading-relaxed text-muted">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    {error}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-input/35 p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-main">Músculos envolvidos</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {guide.muscles.map((muscle) => (
                  <span key={muscle} className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[11px] font-bold text-secondary">
                    {muscle}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <p className="rounded-xl border border-border px-3 py-2 text-[11px] leading-relaxed text-muted">
            Este guia é educativo e não substitui avaliação profissional. Interrompa o exercício se houver dor aguda, tontura ou perda de controle.
          </p>
        </div>

        <footer className="border-t border-border bg-card p-3 sm:px-6 sm:py-4">
          <button type="button" onClick={onClose} className="touch-target w-full rounded-xl bg-primary px-4 text-sm font-black text-on-primary">
            Entendi
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
};

export default ExerciseGuide;
