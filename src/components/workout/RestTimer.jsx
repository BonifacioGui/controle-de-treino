import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

const notifyFinished = () => {
  if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
};

const RestTimer = ({ endTime, onAdjust, onSkip }) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));

  useEffect(() => {
    let notified = false;
    const update = () => {
      const next = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(next);
      if (next === 0 && !notified) {
        notified = true;
        notifyFinished();
        onSkip();
      }
    };
    update();
    const interval = window.setInterval(update, 500);
    return () => window.clearInterval(interval);
  }, [endTime, onSkip]);

  return (
    <aside aria-live="polite" aria-label="Temporizador de descanso" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[9999] mx-auto max-w-md animate-in slide-in-from-bottom-5">
      <div className="rounded-2xl border border-primary/60 bg-card/95 p-3 shadow-[0_0_24px_rgba(var(--primary),0.25)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Timer size={22} /></span>
            <div>
              <p className="text-xs font-bold text-muted">Descanso</p>
              <p className="font-mono text-3xl font-black text-main">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
            </div>
          </div>
          <button type="button" onClick={onSkip} className="touch-target rounded-xl border border-border px-4 text-sm font-black text-main">Pular</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onAdjust(15)} className="touch-target rounded-xl bg-input text-sm font-bold text-main">+15 s</button>
          <button type="button" onClick={() => onAdjust(30)} className="touch-target rounded-xl bg-input text-sm font-bold text-main">+30 s</button>
        </div>
      </div>
    </aside>
  );
};

export default RestTimer;
