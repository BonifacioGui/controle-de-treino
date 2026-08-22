import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Dumbbell,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import { daysBetweenLocalDates, formatLocalDate } from '../../utils/dateUtils';
import { formatTime } from '../../utils/workoutUtils';
import {
  calculateCompletedVolume,
  getSessionCompletion,
  isExerciseCompleted,
  SESSION_STATUS,
} from '../../utils/sessionModel';

const WorkoutView = ({
  activeDay,
  setActiveDay,
  workoutData,
  selectedDate,
  setSelectedDate,
  progress,
  sessionNote,
  setSessionNote,
  finishWorkout,
  history,
  workoutTimer,
  syncStatus,
  actions,
  userId,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [finishConfirmation, setFinishConfirmation] = useState(null);
  const [pendingDay, setPendingDay] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const days = useMemo(() => Object.keys(workoutData || {}), [workoutData]);
  const currentWorkout = workoutData[activeDay];
  const sessionActive = [SESSION_STATUS.active, SESSION_STATUS.paused, SESSION_STATUS.finishing]
    .includes(workoutTimer.status);
  const isFinishing = workoutTimer.status === SESSION_STATUS.finishing;
  const isTutorialDay = activeDay === 'INÍCIO';

  const completedToday = history.some((entry) => (
    entry.workoutName === activeDay && entry.dateKey === selectedDate
  ));
  const historyForDay = history.filter((entry) => entry.workoutName === activeDay);
  const lastSession = historyForDay[0];
  const daysSinceLast = lastSession
    ? daysBetweenLocalDates(lastSession.dateKey, selectedDate)
    : null;
  const completion = useMemo(() => getSessionCompletion(
    currentWorkout,
    progress,
    selectedDate,
    activeDay,
  ), [activeDay, currentWorkout, progress, selectedDate]);
  const currentExerciseIndex = currentWorkout?.exercises?.findIndex((exercise, index) => {
    const id = `${selectedDate}-${activeDay}-${index}`;
    return !isExerciseCompleted(exercise, progress[id] || {});
  }) ?? -1;
  const todayStats = useMemo(() => ({
    volume: Math.round((currentWorkout?.exercises || []).reduce((sum, _exercise, index) => {
      const id = `${selectedDate}-${activeDay}-${index}`;
      return sum + calculateCompletedVolume(progress[id]?.sets || []);
    }, 0)),
    duration: formatTime(workoutTimer.elapsed),
  }), [activeDay, currentWorkout, progress, selectedDate, workoutTimer.elapsed]);

  const requestDayChange = (targetDay) => {
    if (sessionActive || targetDay === activeDay) return;
    const latest = history.find((entry) => entry.workoutName === targetDay);
    const diff = latest ? daysBetweenLocalDates(latest.dateKey, selectedDate) : null;
    if (diff !== null && diff > 0 && diff < 3) {
      setPendingDay({ name: targetDay, days: diff });
      return;
    }
    setActiveDay(targetDay);
  };

  const navigateDay = (direction) => {
    const index = days.indexOf(activeDay);
    if (index < 0 || days.length === 0) return;
    requestDayChange(days[(index + direction + days.length) % days.length]);
  };

  const handleFinish = async (allowPartial = false) => {
    if (isFinishing) return;
    setErrorMessage('');
    try {
      const result = await finishWorkout({ allowPartial });
      if (result?.requiresConfirmation) {
        setFinishConfirmation(result.completion);
        return;
      }
      setFinishConfirmation(null);
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível finalizar agora. Seus dados continuam neste dispositivo.');
      actions.restoreAfterFailedFinish?.();
    }
  };

  if (!currentWorkout) return null;

  return (
    <>
      <main className="relative space-y-4 pb-32">
        {workoutTimer.recovered && sessionActive && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/50 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-primary">Treino em andamento encontrado</p>
              <p className="mt-1 text-sm text-muted">Seu progresso e cronômetro foram recuperados neste dispositivo.</p>
            </div>
            <button type="button" onClick={actions.acknowledgeRecovery} className="touch-target rounded-xl bg-primary px-4 text-sm font-black text-black">
              Continuar treino
            </button>
          </div>
        )}

        <WorkoutHeader
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isCalendarOpen={isCalendarOpen}
          setIsCalendarOpen={setIsCalendarOpen}
          workoutTimer={workoutTimer}
          onStart={actions.startSession}
          onPauseResume={actions.toggleWorkoutTimer}
          onAbandon={actions.resetWorkoutTimer}
          isTutorialDay={isTutorialDay}
          sessionActive={sessionActive}
          userId={userId}
        />

        <section className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => navigateDay(-1)} disabled={sessionActive} aria-label="Treino anterior" className="touch-target flex items-center justify-center rounded-xl text-primary disabled:opacity-30">
              <ChevronLeft size={25} />
            </button>
            <div className="min-w-0 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Treino selecionado</p>
              <h1 className="truncate text-xl font-black text-main">{currentWorkout.title || `Treino ${activeDay}`}</h1>
              <p className="mt-1 text-sm text-muted">{currentWorkout.focus || 'Foco geral'} • {currentWorkout.exercises?.length || 0} exercícios</p>
            </div>
            <button type="button" onClick={() => navigateDay(1)} disabled={sessionActive} aria-label="Próximo treino" className="touch-target flex items-center justify-center rounded-xl text-primary disabled:opacity-30">
              <ChevronRight size={25} />
            </button>
          </div>
          {lastSession && !sessionActive && (
            <p className="mt-3 text-center text-sm text-muted">
              Última sessão: {formatLocalDate(lastSession.dateKey)}
              {daysSinceLast === 1 ? ' • há 1 dia' : daysSinceLast > 1 ? ` • há ${daysSinceLast} dias` : ''}
            </p>
          )}
        </section>

        {sessionActive && (
          <>
            <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-primary">Treino em andamento</p>
                <p className="mt-1 text-sm text-muted">{completion.completedSets}/{completion.totalSets} séries concluídas</p>
              </div>
              <p className="font-mono text-xl font-black text-main">{formatTime(workoutTimer.elapsed)}</p>
            </div>

            <BossSection
              currentWorkout={currentWorkout}
              todayVolume={todayStats.volume}
              history={history}
              selectedDate={selectedDate}
              activeDay={activeDay}
            />

            <div className="space-y-3">
              {currentWorkout.exercises.map((exercise, index) => {
                const id = `${selectedDate}-${activeDay}-${index}`;
                return (
                  <ExerciseCard
                    key={id}
                    id={id}
                    index={index}
                    ex={exercise}
                    progress={progress}
                    history={history}
                    sessionActive={sessionActive}
                    isCurrent={currentExerciseIndex === index}
                    updateSetData={actions.updateSetData}
                    updateSessionSets={actions.updateSessionSets}
                    onSwap={actions.onSwap}
                    skipExercise={actions.skipExercise}
                    toggleSetComplete={actions.toggleSetComplete}
                  />
                );
              })}
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-main">Nota da sessão <span className="font-normal text-muted">(opcional)</span></span>
              <textarea
                placeholder="Como foi o treino?"
                className="min-h-24 w-full rounded-xl border border-border bg-input p-4 text-base text-main outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={sessionNote}
                onChange={(event) => setSessionNote(event.target.value)}
              />
            </label>

            <button type="button" onClick={() => handleFinish(false)} disabled={isFinishing} className="touch-target flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 text-base font-black text-black shadow-[0_0_20px_rgba(var(--primary),0.25)] disabled:opacity-50">
              {isFinishing ? <><Loader2 className="animate-spin" /> Salvando treino...</> : <><CheckCircle2 /> Finalizar treino</>}
            </button>
          </>
        )}

        {!sessionActive && !isTutorialDay && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-main"><Dumbbell className="text-primary" /> Exercícios</h2>
              <p className="mt-1 text-sm text-muted">Confira sua ficha antes de iniciar. Nada será registrado até você confirmar cada série.</p>
            </div>
            <ol className="space-y-2">
              {currentWorkout.exercises.map((exercise, index) => (
                <li key={`${exercise.name}-${index}`} className="rounded-xl border border-border bg-input/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-main">{index + 1}. {exercise.name}</span>
                    <span className="shrink-0 text-sm font-black text-primary">{exercise.sets}</span>
                  </div>
                  {exercise.note && <p className="mt-2 text-sm text-muted">{exercise.note}</p>}
                  {exercise.alternatives?.length > 0 && <p className="mt-2 text-xs text-muted">Alternativas: {exercise.alternatives.join(', ')}</p>}
                </li>
              ))}
            </ol>
            {completedToday ? (
              <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-center">
                <p className="font-black text-success">Treino já registrado nesta data</p>
                <p className="mt-1 text-sm text-muted">Você ainda pode iniciar outra sessão se desejar.</p>
              </div>
            ) : null}
            <button type="button" onClick={actions.startSession} className="touch-target flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-black text-black shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <Play fill="currentColor" /> Iniciar treino
            </button>
          </section>
        )}

        {syncStatus === 'offline' && sessionActive && (
          <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-muted">
            <CloudOff className="shrink-0 text-warning" /> Offline — alterações salvas neste dispositivo.
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-main">
            <AlertTriangle className="shrink-0 text-red-500" />
            <div><p className="font-bold">Não foi possível concluir.</p><p className="mt-1 text-muted">{errorMessage}</p></div>
          </div>
        )}
      </main>

      {pendingDay && createPortal(
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-warning/50 bg-card p-6">
            <h2 className="text-lg font-black text-main">Treinar novamente?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Você realizou este treino há {pendingDay.days} {pendingDay.days === 1 ? 'dia' : 'dias'}. Deseja abrir o treino novamente?</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPendingDay(null)} className="touch-target rounded-xl border border-border font-bold text-main">Voltar</button>
              <button type="button" onClick={() => { setActiveDay(pendingDay.name); setPendingDay(null); }} className="touch-target rounded-xl bg-warning font-black text-black">Treinar mesmo assim</button>
            </div>
          </div>
        </div>, document.body,
      )}

      {finishConfirmation && createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="finish-partial-title" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-warning/50 bg-card p-6">
            <AlertTriangle className="mb-4 text-warning" size={32} />
            <h2 id="finish-partial-title" className="text-lg font-black text-main">Ainda existem {finishConfirmation.incompleteSets} séries não concluídas.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Você pode voltar e completar o treino ou salvar esta sessão como parcial. Somente séries confirmadas contam para volume, XP e recordes.</p>
            <div className="mt-6 space-y-3">
              <button type="button" onClick={() => setFinishConfirmation(null)} className="touch-target w-full rounded-xl border border-primary font-black text-primary">Voltar ao treino</button>
              <button type="button" onClick={() => handleFinish(true)} className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-warning font-black text-black"><RotateCcw size={17} /> Finalizar mesmo assim</button>
            </div>
          </div>
        </div>, document.body,
      )}
    </>
  );
};

export default WorkoutView;
