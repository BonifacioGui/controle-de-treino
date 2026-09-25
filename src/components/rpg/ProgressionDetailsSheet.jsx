import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ProgressionDetails from './ProgressionDetails';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const ProgressionDetailsSheet = ({ isOpen, onClose, title, items = [] }) => {
  const titleId = useId();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    returnFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)];
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

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
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const returnTarget = returnFocusRef.current;
      if (returnTarget instanceof HTMLElement && returnTarget.isConnected) returnTarget.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[min(86vh,46rem)] w-full overflow-y-auto overflow-x-hidden rounded-t-3xl border border-border bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 text-main shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-5"
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted/35 sm:hidden" />
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 pb-3 backdrop-blur-md">
          <h2 id={titleId} className="font-cyber text-base font-black uppercase tracking-wide text-main sm:text-lg">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="touch-target flex shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-input hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <ProgressionDetails
              key={item.key || item.info?.name || index}
              info={item.info}
              levelProgress={item.levelProgress}
              valueLabel={item.valueLabel}
              progressValueLabel={item.progressValueLabel}
              compactHeading={items.length === 1}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="touch-target mt-4 w-full rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-black uppercase tracking-wide text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Fechar
        </button>
      </section>
    </div>,
    document.body,
  );
};

export default ProgressionDetailsSheet;
