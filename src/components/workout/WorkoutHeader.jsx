import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Pause,
  Play,
  Timer as TimerIcon,
  Trash2,
  X,
} from 'lucide-react';
import CyberCalendar from '../dashboard/CyberCalendar';
import QuestBoard from '../rpg/QuestBoard';
import { formatLocalDate } from '../../utils/dateUtils';
import { formatTime } from '../../utils/workoutUtils';
import { readUserStoredJSON, STORAGE_KEYS } from '../../utils/storage';

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
  userId,
}) => {
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [hasQuests, setHasQuests] = useState(false);

  useEffect(() => {
    const checkQuests = () => setHasQuests(userId
      ? readUserStoredJSON(userId, STORAGE_KEYS.quests, []).length > 0
      : false);
    checkQuests();
    window.addEventListener('quest_update', checkQuests);
    return () => window.removeEventListener('quest_update', checkQuests);
  }, [userId]);

  const confirmAbandon = () => {
    onAbandon();
    setIsAbandonModalOpen(false);
  };

  return (
    <section className="relative z-10 overflow-hidden rounded-2xl border border-primary/30 bg-card p-4 shadow-sm">
      <div className="relative z-10 space-y-3">
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          disabled={sessionActive}
          aria-label={`Selecionar data. Data atual: ${formatLocalDate(selectedDate)}`}
          className="touch-target flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Data do treino</p>
            <p className="mt-1 text-base font-black capitalize text-main sm:text-lg">
              <span className="sm:hidden">{formatLocalDate(selectedDate, { weekday: 'short', day: '2-digit', month: 'long', year: undefined })}</span>
              <span className="hidden sm:inline">{formatLocalDate(selectedDate, { weekday: 'short', day: '2-digit', month: 'long' })}</span>
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/40 bg-input text-primary">
            <Calendar size={20} />
          </span>
        </button>

        {!isTutorialDay && hasQuests && (
          <div>
            <button
              type="button"
              onClick={() => setShowQuests((current) => !current)}
              aria-expanded={showQuests}
              className="touch-target flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm font-bold text-primary"
            >
              <span className="flex items-center gap-2"><Crosshair size={16} /> Missões diárias</span>
              {showQuests ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showQuests && <div className="mt-2"><QuestBoard userId={userId} /></div>}
          </div>
        )}

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
