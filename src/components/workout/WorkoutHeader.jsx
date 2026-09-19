import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Calendar,
  Pause,
  Play,
  Timer as TimerIcon,
  Trash2,
  X,
} from 'lucide-react';
import CyberCalendar from '../dashboard/CyberCalendar';
import { formatLocalDate } from '../../utils/dateUtils';
import { formatTime } from '../../utils/workoutUtils';

const formatWorkoutDate = (dateKey) => {
  const label = formatLocalDate(dateKey, {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: undefined,
  });
  return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : '';
};

const WorkoutHeader = ({
  selectedDate,
  setSelectedDate,
  isCalendarOpen,
  setIsCalendarOpen,
  workoutTimer,
  onPauseResume,
  onAbandon,
  isTutorialDay,
  sessionActive,
}) => {
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);

  const confirmAbandon = () => {
    onAbandon();
    setIsAbandonModalOpen(false);
  };

  return (
    <section className="relative z-10 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
      <div className="relative z-10 space-y-2">
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          disabled={sessionActive}
          aria-label={`Selecionar data. Data atual: ${formatLocalDate(selectedDate)}`}
          className="touch-target flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-2 text-left transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Data do treino</p>
            <p className="truncate text-sm font-black text-main sm:text-base">
              {formatWorkoutDate(selectedDate)}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-input text-primary">
            <Calendar size={18} />
          </span>
        </button>

        {sessionActive && !isTutorialDay && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-input p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${workoutTimer.isRunning ? 'bg-primary text-on-primary' : 'bg-card text-muted'}`}>
                <TimerIcon size={20} />
              </span>
              <div>
                <p className="text-xs font-bold text-muted">Duração</p>
                <p className="font-mono text-2xl font-black text-main">{formatTime(workoutTimer.elapsed)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPauseResume}
                aria-label={workoutTimer.isRunning ? 'Pausar treino' : 'Retomar treino'}
                className="touch-target flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-main hover:text-primary"
              >
                {workoutTimer.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button
                type="button"
                onClick={() => setIsAbandonModalOpen(true)}
                aria-label="Encerrar e descartar esta sessão"
                className="touch-target flex h-11 w-11 items-center justify-center rounded-xl border border-danger/50 bg-danger/10 text-danger"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isCalendarOpen && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Calendário" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={() => setIsCalendarOpen(false)}>
          <div className="relative flex justify-center" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setIsCalendarOpen(false)} aria-label="Fechar calendário" className="touch-target absolute -top-12 right-0 text-white"><X size={30} /></button>
            <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>,
        document.body,
      )}

      {isAbandonModalOpen && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="abandon-title" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-danger/60 bg-card p-6 shadow-2xl">
            <AlertTriangle className="mb-4 text-danger" size={34} />
            <h2 id="abandon-title" className="text-xl font-black text-main">Encerrar este treino?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">As séries e o tempo desta sessão serão descartados deste dispositivo. O histórico já salvo não será alterado.</p>
            <div className="mt-6 space-y-3">
              <button type="button" onClick={() => setIsAbandonModalOpen(false)} className="touch-target w-full rounded-xl border border-primary font-black text-primary">Continuar treino</button>
              <button type="button" onClick={confirmAbandon} className="touch-target w-full rounded-xl bg-danger font-black text-on-danger">Encerrar e descartar</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
};

export default WorkoutHeader;
