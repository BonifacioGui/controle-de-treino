import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  RefreshCcw,
  Settings2,
  SkipForward,
  Trophy,
  X,
} from 'lucide-react';
import { isSameExercise } from '../../utils/workoutUtils';
import { parseDecimalInput, parsePositiveInteger } from '../../utils/numberUtils';
import {
  calculateCompletedVolume,
  getExerciseMode,
  getExpectedSetCount,
  isExerciseCompleted,
} from '../../utils/sessionModel';
import {
  formatEnteredLoad,
  getLoadModeOption,
  getSetLoadMode,
  isCanonicalLoadMode,
  LOAD_MODES,
} from '../../utils/loadModel';
import { getMaxCompletedLoad } from '../../utils/progressionUtils';

const formatPreviousSet = (set, mode, exercise) => {
  if (!set) return null;
  if (mode === 'duration') return set.duration ? `${set.duration} s` : null;
  if (mode === 'distance') return set.distance ? `${set.distance} km` : null;
  if (mode === 'bodyweight' || mode === 'reps') return set.reps ? `${set.reps} repetições` : null;
  if (!set.weight && !set.reps) return null;
  const loadLabel = formatEnteredLoad(set, exercise) || 'carga não informada';
  return `${loadLabel} × ${set.reps || '—'}`;
};

const Field = ({ label, value, onChange, inputMode = 'decimal', placeholder }) => {
  const parsed = parseDecimalInput(value);
  const invalid = Boolean(value && (parsed === null || parsed < 0));
  return (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        aria-label={label}
        aria-invalid={invalid}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        className={`exercise-input h-12 w-full rounded-xl border bg-input px-2 text-center text-base font-black text-main outline-none transition focus-visible:ring-2 focus-visible:ring-primary/70 ${
          invalid ? 'border-danger' : 'border-border focus:border-primary'
        }`}
      />
    </label>
  );
};

const ExerciseCard = ({
  ex,
  id,
  index,
  progress,
  history,
  isCurrent,
  updateSetData,
  updateSessionSets,
  toggleSetComplete,
  skipExercise,
  onSwap,
}) => {
  const exerciseProgress = progress[id] || {};
  const displayName = exerciseProgress.swappedName || ex.name;
  const mode = getExerciseMode(ex);
  const loadMode = getSetLoadMode({}, ex);
  const loadModeOption = getLoadModeOption(loadMode);
  const expectedSets = getExpectedSetCount(ex, exerciseProgress.actualSets);
  const completedSets = (exerciseProgress.sets || []).slice(0, expectedSets)
    .filter((set) => set.completed).length;
  const isDone = isExerciseCompleted(ex, exerciseProgress);
  const [manualExpanded, setManualExpanded] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [swapChoice, setSwapChoice] = useState(displayName);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [validationSet, setValidationSet] = useState(null);
  const expanded = manualExpanded ?? (isCurrent && !isDone);

  const exerciseHistory = history
    .flatMap((session) => session.exercises.map((exercise) => ({
      ...exercise,
      dateKey: session.dateKey,
    })))
    .filter((exercise) => isSameExercise(displayName, exercise.name))
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));

  const lastExercise = exerciseHistory.find((exercise) => exercise.sets?.some((set) => set.completed));
  const previousLabel = formatPreviousSet(
    lastExercise?.sets?.find((set) => set.completed),
    mode,
    { ...ex, loadMode },
  );
  const loadPr = isCanonicalLoadMode(loadMode)
    ? getMaxCompletedLoad(exerciseHistory, displayName, loadMode)
    : 0;
  const currentMaxLoad = getMaxCompletedLoad([{
    ...ex,
    name: displayName,
    loadMode,
    sets: exerciseProgress.sets || [],
  }], displayName, loadMode);
  const currentLoadPr = isCanonicalLoadMode(loadMode) && loadPr > 0 && currentMaxLoad > loadPr;
  const volume = calculateCompletedVolume(exerciseProgress.sets || [], { ...ex, loadMode });

  const usePreviousValues = () => {
    if (!lastExercise?.sets) return;
    Array.from({ length: expectedSets }).forEach((_, setIndex) => {
      const previous = lastExercise.sets[setIndex] || lastExercise.sets[lastExercise.sets.length - 1];
      if (!previous) return;
      ['weight', 'reps', 'duration', 'distance', 'rpe'].forEach((field) => {
        if (previous[field] !== undefined && previous[field] !== '') {
          updateSetData(id, setIndex, field, previous[field]);
        }
      });
    });
  };

  const isSetValid = (set) => {
    if (mode === 'duration') return (parseDecimalInput(set.duration) ?? 0) > 0;
    if (mode === 'distance') return (parseDecimalInput(set.distance) ?? 0) > 0;
    if (mode === 'bodyweight' || mode === 'reps') return parsePositiveInteger(set.reps) !== null;
    const weight = parseDecimalInput(set.weight);
    return weight !== null && weight >= 0 && parsePositiveInteger(set.reps) !== null;
  };

  const renderFields = (set, setIndex) => {
    if (mode === 'duration') {
      return <Field label={`Tempo da série ${setIndex + 1}, em segundos`} placeholder="SEG" value={set.duration} onChange={(event) => updateSetData(id, setIndex, 'duration', event.target.value)} />;
    }
    if (mode === 'distance') {
      return <Field label={`Distância da série ${setIndex + 1}, em quilômetros`} placeholder="KM" value={set.distance} onChange={(event) => updateSetData(id, setIndex, 'distance', event.target.value)} />;
    }
    if (mode === 'bodyweight' || mode === 'reps') {
      return <Field label={`Repetições da série ${setIndex + 1}`} placeholder="REPS" inputMode="numeric" value={set.reps} onChange={(event) => updateSetData(id, setIndex, 'reps', event.target.value)} />;
    }
    const loadPlaceholder = loadMode === LOAD_MODES.perSide
      ? 'LADO'
      : loadMode === LOAD_MODES.perHand
        ? 'HALTER'
        : loadMode === LOAD_MODES.assisted
          ? 'ASSIST.'
          : 'KG';
    return (
      <>
        <Field label={`${loadModeOption.label} da série ${setIndex + 1}, em quilos`} placeholder={loadPlaceholder} value={set.weight} onChange={(event) => updateSetData(id, setIndex, 'weight', event.target.value)} />
        <Field label={`Repetições da série ${setIndex + 1}`} placeholder="REPS" inputMode="numeric" value={set.reps} onChange={(event) => updateSetData(id, setIndex, 'reps', event.target.value)} />
      </>
    );
  };

  return (
    <article className={`exercise-card rounded-2xl border bg-card transition ${isDone ? 'exercise-card--complete border-success/50' : isCurrent ? 'exercise-card--current border-primary/60 shadow-[0_0_20px_rgba(var(--primary),0.12)]' : 'border-border'}`}>
      <button
        type="button"
        onClick={() => setManualExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="exercise-index inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border border-border px-1 text-xs font-black">{String(index + 1).padStart(2, '0')}</span>
            {isDone && <Check size={18} className="shrink-0 text-success" aria-hidden="true" />}
            <h3 className="truncate text-base font-black text-main">{displayName}</h3>
            {currentLoadPr && (
              <span className="exercise-pr-badge inline-flex items-center gap-1 rounded-md border border-gold/50 bg-gold/10 px-2 py-1 text-xs font-black text-gold">
                <Trophy size={12} /> PR de carga
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-muted">
            {exerciseProgress.skipped ? 'Exercício pulado' : `${completedSets}/${expectedSets} séries`}
            {volume > 0 ? ` • ${Math.round(volume).toLocaleString('pt-BR')} kg` : ''}
          </p>
        </div>
        {expanded ? <ChevronUp size={22} className="shrink-0 text-primary" /> : <ChevronDown size={22} className="shrink-0 text-muted" />}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-3 pb-4 pt-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              {previousLabel ? (
                <p className="text-xs text-muted"><span className="font-bold text-main">Anterior:</span> {previousLabel}</p>
              ) : (
                <p className="text-xs text-muted">Sem registro anterior para este exercício.</p>
              )}
              {loadPr > 0 && <p className="mt-1 text-xs font-semibold text-gold">Melhor carga canônica confirmada: {loadPr.toLocaleString('pt-BR')} kg</p>}
            </div>
            {lastExercise && (
              <button type="button" onClick={usePreviousValues} className="touch-target inline-flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-primary hover:bg-primary/10">
                <Copy size={15} /> Usar anteriores
              </button>
            )}
          </div>

          {ex.note && <p className="rounded-xl bg-input px-3 py-2 text-sm leading-relaxed text-muted">{ex.note}</p>}

          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted">
            <span className="font-black text-primary">Registro de carga:</span> {loadModeOption.label}.
            {loadMode === LOAD_MODES.perSide && ` Barra configurada: ${Number(ex.barWeight ?? 20).toLocaleString('pt-BR')} kg.`}
            {loadMode === LOAD_MODES.assisted && ' Esta carga não entra em PR ou dano de Boss.'}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-muted">
              Séries
              <input
                type="text"
                inputMode="numeric"
                aria-label="Quantidade de séries"
                className="h-11 w-14 rounded-xl border border-border bg-input text-center text-base font-black text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={exerciseProgress.actualSets || expectedSets}
                onChange={(event) => updateSessionSets(id, event.target.value)}
              />
            </label>
            <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="touch-target inline-flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-muted hover:text-primary">
              <Settings2 size={16} /> {showAdvanced ? 'Ocultar detalhes' : 'RPE e opções'}
            </button>
          </div>

          <div className="space-y-2">
            {Array.from({ length: expectedSets }).map((_, setIndex) => {
              const set = exerciseProgress.sets?.[setIndex] || {};
              const rpe = parseDecimalInput(set.rpe);
              const valid = set.completed || isSetValid(set);
              const rpeLabel = rpe === null ? null : rpe >= 10 ? 'máximo' : rpe >= 9 ? 'muito alto' : rpe >= 8 ? 'alto' : rpe >= 7 ? 'moderado' : 'leve';
              return (
                <div key={setIndex} className={`exercise-set-row rounded-xl border p-2 ${set.completed ? 'is-complete border-success/40 bg-success/5' : 'border-border bg-input/30'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-center text-sm font-black text-muted">{setIndex + 1}</span>
                    <div className="flex min-w-0 flex-1 gap-2">{renderFields(set, setIndex)}</div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!valid) {
                          setValidationSet(setIndex);
                          return;
                        }
                        setValidationSet(null);
                        toggleSetComplete(id, setIndex, ex.restSeconds ?? 90);
                      }}
                      aria-label={set.completed ? `Reabrir série ${setIndex + 1}` : `Concluir série ${setIndex + 1}`}
                      className={`touch-target flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition active:scale-95 ${set.completed ? 'border-success bg-success text-on-success' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
                    >
                      {set.completed ? <Check size={24} /> : <Circle size={22} />}
                    </button>
                  </div>
                  {validationSet === setIndex && !valid && <p role="alert" className="mt-2 pl-8 text-xs font-bold text-danger">Preencha valores válidos antes de concluir a série.</p>}
                  {showAdvanced && (
                    <div className="mt-2 flex items-center gap-2 pl-8">
                      <Field label={`RPE da série ${setIndex + 1}`} placeholder="RPE" inputMode="decimal" value={set.rpe} onChange={(event) => updateSetData(id, setIndex, 'rpe', event.target.value)} />
                      <span className="min-w-20 text-xs text-muted">{rpeLabel ? `RPE ${rpe} — ${rpeLabel}` : 'Opcional'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showAdvanced && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
              {ex.alternatives?.length > 0 && (
                <button type="button" onClick={() => { setSwapChoice(displayName); setShowSwap(true); }} className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-warning/50 px-3 text-xs font-bold text-warning hover:bg-warning/10">
                  <RefreshCcw size={16} /> Substituir exercício
                </button>
              )}
              {!confirmSkip ? (
                <button type="button" onClick={() => setConfirmSkip(true)} className="touch-target inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-muted hover:text-main">
                  <SkipForward size={16} /> {exerciseProgress.skipped ? 'Retomar exercício' : 'Pular exercício'}
                </button>
              ) : (
                <div className="flex flex-1 gap-2">
                  <button type="button" onClick={() => setConfirmSkip(false)} className="touch-target flex-1 rounded-xl border border-border text-xs font-bold">Cancelar</button>
                  <button type="button" onClick={() => { skipExercise(id, !exerciseProgress.skipped); setConfirmSkip(false); }} className="touch-target flex-1 rounded-xl bg-warning text-xs font-black text-on-warning">Confirmar</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showSwap && createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby={`swap-title-${index}`} className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/80 p-3 sm:items-center">
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-warning/50 bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 id={`swap-title-${index}`} className="text-base font-black text-main">Substituir exercício</h3>
              <button type="button" onClick={() => setShowSwap(false)} aria-label="Fechar seletor" className="touch-target flex items-center justify-center rounded-xl text-muted hover:text-main"><X /></button>
            </div>
            <div className="space-y-2">
              {[ex.name, ...(ex.alternatives || [])].map((option) => {
                const selected = swapChoice === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSwapChoice(option)}
                    className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 text-left text-sm text-main transition-colors ${selected ? 'border-warning bg-warning/10' : 'border-border hover:border-warning/50'}`}
                  >
                    <span aria-hidden="true" className={`h-4 w-4 shrink-0 rounded-full border-2 ${selected ? 'border-warning bg-warning shadow-[inset_0_0_0_3px_var(--color-card)]' : 'border-muted'}`} />
                    {option}
                  </button>
                );
              })}
            </div>
            <p className="mt-5 text-sm text-muted">Onde deseja aplicar esta troca?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => { onSwap(id, swapChoice, { scope: 'session', exerciseIndex: index }); setShowSwap(false); }} className="touch-target rounded-xl border border-primary px-3 text-sm font-black text-primary">Somente nesta sessão</button>
              <button type="button" onClick={() => { onSwap(id, swapChoice, { scope: 'plan', exerciseIndex: index }); setShowSwap(false); }} className="touch-target rounded-xl bg-warning px-3 text-sm font-black text-on-warning">Alterar no plano</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </article>
  );
};

export default ExerciseCard;
