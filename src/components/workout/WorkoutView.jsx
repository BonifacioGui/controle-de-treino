import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  CloudOff,
  Dumbbell,
  Loader2,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';
import WorkoutHeader from './WorkoutHeader';
import BossSection from './BossSection';
import ExerciseCard from './ExerciseCard';
import ExerciseGuide from './ExerciseGuide';
import ExercisePerformanceSummary from './ExercisePerformanceSummary';
import ExerciseSearchModal from './ExerciseSearchModal';
import WorkoutQuestSummary from './WorkoutQuestSummary';
import { daysBetweenLocalDates, formatLocalDate } from '../../utils/dateUtils';
import { getExercisePerformance } from '../../utils/performanceModel';
import {
  getSessionCompletion,
  isExerciseCompleted,
  SESSION_STATUS,
} from '../../utils/sessionModel';

const WorkoutView = ({
  activeDay,
  workoutData,
  activeWorkout,
  bossEncounter,
  theme,
  experienceMode,
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
  previewQuests,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [finishConfirmation, setFinishConfirmation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [guideExercise, setGuideExercise] = useState(null);
  const [isExerciseSearchOpen, setIsExerciseSearchOpen] = useState(false);
  const [pendingExercise, setPendingExercise] = useState('');
  const [addExerciseToPlan, setAddExerciseToPlan] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const addExerciseOperationRef = useRef(null);
  const addExerciseHandledRef = useRef(false);
  const currentWorkout = activeWorkout || workoutData[activeDay];
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
  const completionPercent = completion.totalSets > 0
    ? Math.round((completion.completedSets / completion.totalSets) * 100)
    : 0;

  const selectExerciseToAdd = (exerciseName) => {
    setPendingExercise(exerciseName);
    setAddExerciseToPlan(false);
    addExerciseHandledRef.current = false;
    addExerciseOperationRef.current = globalThis.crypto?.randomUUID?.()
      || `append-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const confirmExerciseAddition = () => {
    if (!pendingExercise || addExerciseHandledRef.current) return;
    addExerciseHandledRef.current = true;
    setIsAddingExercise(true);
    const added = actions.addExerciseToActiveSession?.(pendingExercise, {
      addToPlan: addExerciseToPlan,
      operationId: addExerciseOperationRef.current,
    });
    if (!added) {
      addExerciseHandledRef.current = false;
      setErrorMessage('Não foi possível adicionar o exercício à sessão atual. Tente novamente.');
      setIsAddingExercise(false);
      return;
    }
    setPendingExercise('');
    setIsAddingExercise(false);
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
            <button type="button" onClick={actions.acknowledgeRecovery} className="touch-target rounded-xl bg-primary px-4 text-sm font-black text-on-primary">
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
          onPauseResume={actions.toggleWorkoutTimer}
          onAbandon={actions.resetWorkoutTimer}
          isTutorialDay={isTutorialDay}
          sessionActive={sessionActive}
        />

        <section className="solo-workout-hero rounded-2xl border border-primary/35 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-black leading-tight text-main sm:text-2xl">{currentWorkout.title || `Treino ${activeDay}`}</h1>
              <p className="mt-1 text-sm font-medium text-muted">{currentWorkout.focus || 'Foco geral'} <span aria-hidden="true">·</span> {currentWorkout.exercises?.length || 0} exercícios</p>
            </div>
            {sessionActive && (
              <span className="shrink-0 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-primary">Em andamento</span>
            )}
          </div>
          {lastSession && !sessionActive && (
            <p className="mt-2 text-xs text-muted">
              Último treino: {formatLocalDate(lastSession.dateKey, { year: undefined })}
              {daysSinceLast === 1 ? ' • há 1 dia' : daysSinceLast > 1 ? ` • há ${daysSinceLast} dias` : ''}
            </p>
          )}
          {!sessionActive && !isTutorialDay && (
            <>
              {completedToday && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-success"><CheckCircle2 aria-hidden="true" size={13} /> Registrado hoje · você ainda pode repetir</p>
              )}
              <button type="button" onClick={actions.startSession} className="solo-primary-action touch-target mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-black text-on-primary">
                <Play fill="currentColor" /> Iniciar treino
              </button>
            </>
          )}
          {sessionActive && (
            <div className="mt-4 border-t border-border/70 pt-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-muted"><strong className="text-main">{completion.completedSets}/{completion.totalSets}</strong> séries</span>
                <span className="font-mono font-black text-main">{completionPercent}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-input" role="progressbar" aria-label="Progresso do treino" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completionPercent}>
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-300" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          )}
        </section>

        {!sessionActive && !isTutorialDay && (
          <WorkoutQuestSummary userId={userId} questsOverride={previewQuests} />
        )}

        {sessionActive && (
          <>
            <BossSection key={userId} encounter={bossEncounter} theme={theme} experienceMode={experienceMode} userId={userId} />

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

            <button
              type="button"
              onClick={() => setIsExerciseSearchOpen(true)}
              disabled={isFinishing}
              className="touch-target flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-sm font-black text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus aria-hidden="true" size={18} /> Adicionar exercício
            </button>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-main">Nota da sessão <span className="font-normal text-muted">(opcional)</span></span>
              <textarea
                placeholder="Como foi o treino?"
                className="min-h-24 w-full rounded-xl border border-border bg-input p-4 text-base text-main outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={sessionNote}
                onChange={(event) => setSessionNote(event.target.value)}
              />
            </label>

            {completion.incompleteSets === 0 && (
              <div role="status" className="rounded-2xl border border-success/40 bg-success/10 p-4 text-center">
                <p className="font-black text-success">Todas as séries foram concluídas</p>
                <p className="mt-1 text-sm text-muted">Nenhum novo descanso será iniciado. Finalize quando estiver pronto.</p>
              </div>
            )}

            <button type="button" onClick={() => handleFinish(false)} disabled={isFinishing} className="workout-finish-action touch-target flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 text-base font-black text-on-primary shadow-[0_0_20px_rgba(var(--primary),0.25)] disabled:opacity-50">
              {isFinishing ? <><Loader2 className="animate-spin" /> Salvando treino...</> : <><CheckCircle2 /> Finalizar treino</>}
            </button>
          </>
        )}

        {!sessionActive && !isTutorialDay && (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="px-1">
              <h2 className="flex items-center gap-2 text-base font-black text-main"><Dumbbell className="text-primary" /> Exercícios</h2>
            </div>
            <ol className="space-y-2">
              {currentWorkout.exercises.map((exercise, index) => {
                const performance = getExercisePerformance(history, exercise.name, exercise);
                return (
                  <li key={`${exercise.name}-${index}`} className="rounded-xl border border-border bg-input/35 px-3 py-2.5">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <p className="min-w-0 flex-1 text-sm font-black leading-snug text-main">{index + 1}. {exercise.name}</p>
                      <span className="shrink-0 text-xs font-black text-primary">{exercise.sets}</span>
                    </div>
                    <div className="mt-0.5 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <ExercisePerformanceSummary
                          performance={performance}
                          className="text-[11px] leading-relaxed"
                          emptyText="Sem referência anterior"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setGuideExercise(exercise.name)}
                        aria-label={`Ver como fazer ${exercise.name}`}
                        className="touch-target -my-2 inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 text-[11px] font-semibold text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <CircleHelp size={14} aria-hidden="true" /> Como fazer
                      </button>
                    </div>
                    {exercise.note && <p className="mt-2 text-xs text-muted">{exercise.note}</p>}
                    {exercise.alternatives?.length > 0 && <p className="mt-2 text-xs text-muted">Alternativas: {exercise.alternatives.join(', ')}</p>}
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={actions.startSession} className="solo-primary-action touch-target flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-black text-on-primary">
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
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/50 bg-danger/10 p-4 text-sm text-main">
            <AlertTriangle className="shrink-0 text-danger" />
            <div><p className="font-bold">Não foi possível concluir a ação.</p><p className="mt-1 text-muted">{errorMessage}</p></div>
          </div>
        )}
      </main>

      {guideExercise && (
        <ExerciseGuide exerciseName={guideExercise} onClose={() => setGuideExercise(null)} />
      )}

      {isExerciseSearchOpen && (
        <ExerciseSearchModal
          onSelect={selectExerciseToAdd}
          onClose={() => setIsExerciseSearchOpen(false)}
        />
      )}

      {pendingExercise && createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="append-exercise-title" className="fixed inset-0 z-[1150] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center" onClick={() => !isAddingExercise && setPendingExercise('')}>
          <div className="w-full max-w-sm rounded-2xl border border-primary/40 bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 id="append-exercise-title" className="text-lg font-black text-main">Adicionar à sessão atual?</h2>
            <p className="mt-2 text-sm text-muted"><strong className="text-main">{pendingExercise}</strong> será incluído ao final, sem alterar as séries já registradas.</p>
            <p className="mt-3 text-xs font-bold text-primary">Padrão seguro: adicionar apenas neste treino.</p>
            <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-input/40 px-3 text-sm text-main">
              <input type="checkbox" checked={addExerciseToPlan} disabled={isAddingExercise || isFinishing} onChange={(event) => setAddExerciseToPlan(event.target.checked)} className="h-5 w-5 accent-primary" />
              <span><strong className="block">Adicionar também à ficha</strong><span className="text-xs text-muted">Desmarcado: vale apenas para este treino.</span></span>
            </label>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" disabled={isAddingExercise} onClick={() => setPendingExercise('')} className="touch-target rounded-xl border border-border font-bold text-main disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={isAddingExercise || isFinishing} onClick={confirmExerciseAddition} className="touch-target rounded-xl bg-primary font-black text-on-primary disabled:opacity-50">{isAddingExercise ? 'Adicionando...' : 'Adicionar'}</button>
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
              <button type="button" onClick={() => handleFinish(true)} className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-warning font-black text-on-warning"><RotateCcw size={17} /> Finalizar mesmo assim</button>
            </div>
          </div>
        </div>, document.body,
      )}
    </>
  );
};

export default WorkoutView;
