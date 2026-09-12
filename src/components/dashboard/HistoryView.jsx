import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Camera,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  CloudOff,
  Database,
  Download,
  Loader2,
  Pencil,
  Share2,
  Swords,
  Trash2,
  X,
} from 'lucide-react';
import { formatLocalDate } from '../../utils/dateUtils';
import { groupHistoryByDate } from '../../utils/historyGrouping';
import { calculateCompletedVolume } from '../../utils/sessionModel';
import { calculateSessionXp } from '../../utils/xpModel';
import { formatEnteredLoad } from '../../utils/loadModel';
import { OVERLOAD_STATUS } from '../../utils/overloadModel';
import ShareCardControls from '../export/ShareCardControls';
import { createShareCardFieldSelection } from '../export/ShareCardUtils';

const ShareCard = lazy(() => import('../export/ShareCard'));

const VOLUME_STATUS_PRESENTATION = Object.freeze({
  [OVERLOAD_STATUS.overload]: {
    label: 'Volume: aumento',
    className: 'border-success/35 bg-success/10 text-success',
  },
  [OVERLOAD_STATUS.maintenance]: {
    label: 'Volume: manutenção',
    className: 'border-border bg-input text-muted',
  },
  [OVERLOAD_STATUS.reduction]: {
    label: 'Volume: redução',
    className: 'border-warning/40 bg-warning/10 text-warning',
  },
});

const formatDuration = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remaining = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const getSessionShareStats = (session) => ({
  duration: formatDuration(session.duration),
  volume: Math.round(
    session.totalVolume
    || (session.exercises || []).reduce((sum, exercise) => sum + calculateCompletedVolume(exercise.sets, exercise), 0),
  ).toString(),
  prs: session.prsBroken || 0,
});

const ExerciseSummary = ({ exercise }) => {
  const completedSets = (exercise.sets || []).filter((set) => set.completed);
  return (
    <div className="border-b border-border p-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-main">{exercise.name}</p>
        <span className={`text-xs font-bold ${exercise.skipped ? 'text-warning' : 'text-muted'}`}>
          {exercise.skipped ? 'Pulado' : `${completedSets.length} séries`}
        </span>
      </div>
      {completedSets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {completedSets.map((set, setIndex) => (
            <span key={setIndex} className="rounded-lg border border-border bg-input px-2 py-1 text-xs font-bold text-main">
              {set.weight ? formatEnteredLoad(set, exercise) : set.duration ? `${set.duration} s` : set.distance ? `${set.distance} km` : ''}
              {set.reps ? `${set.weight ? ' × ' : ''}${set.reps} reps` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const SessionCard = ({ session, onDelete, onCardAction, onReopen }) => {
  const [expanded, setExpanded] = useState(false);
  const entryId = session.id || session.localId;
  const synced = session.syncStatus === 'synced';
  const volumeStatus = VOLUME_STATUS_PRESENTATION[session.overloadStatus];

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-main">{session.workoutTitle || session.workoutName}</h3>
            {session.partial && <span className="rounded-md bg-warning/15 px-2 py-1 text-[11px] font-black text-warning">Parcial</span>}
            {volumeStatus && <span className={`rounded-md border px-2 py-1 text-[11px] font-black ${volumeStatus.className}`}>{volumeStatus.label}</span>}
          </div>
          <p className="mt-1 text-sm text-muted">{formatLocalDate(session.dateKey, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted">
            <span>{Math.round(session.totalVolume || 0).toLocaleString('pt-BR')} kg</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {formatDuration(session.duration)}</span>
            <span className={`flex items-center gap-1 ${synced ? 'text-success' : 'text-warning'}`}>{synced ? <Cloud size={13} /> : <CloudOff size={13} />}{synced ? 'Sincronizado' : 'Salvo neste dispositivo'}</span>
          </div>
          {session.bossEncounter && (
            <p className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${session.bossEncounter.defeated ? 'text-success' : 'text-secondary'}`}>
              <Swords size={14} /> {session.bossEncounter.bossName} {session.bossEncounter.defeated ? 'derrotado' : 'enfrentado'} • {Math.round(session.bossEncounter.damage).toLocaleString('pt-BR')} / {Math.round(session.bossEncounter.maxHp).toLocaleString('pt-BR')}
            </p>
          )}
        </button>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Recolher sessão' : 'Abrir sessão'} className="touch-target flex items-center justify-center rounded-xl text-muted"><ChevronDown className={expanded ? 'rotate-180' : ''} /></button>
      </div>

      {expanded && (
        <div className="border-t border-border">
          <div className="flex flex-wrap gap-2 p-3">
            <button type="button" onClick={() => onCardAction(session, 'download')} className="touch-target inline-flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-main"><Download size={16} /> Baixar card</button>
            <button type="button" onClick={() => onCardAction(session, 'share')} className="touch-target inline-flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-main"><Share2 size={16} /> Compartilhar</button>
            <button type="button" onClick={() => onReopen(entryId)} className="touch-target inline-flex items-center gap-2 rounded-xl border border-primary/50 px-3 text-xs font-black text-primary"><Pencil size={16} /> Corrigir treino</button>
            <button type="button" onClick={() => onDelete(entryId)} aria-label="Excluir sessão" className="touch-target flex items-center justify-center rounded-xl border border-danger/40 px-3 text-danger"><Trash2 size={17} /></button>
          </div>
          {session.note ? <p className="mx-3 mb-3 rounded-xl bg-warning/5 p-3 text-sm text-muted">{session.note}</p> : null}
          <div className="border-t border-border">
            {session.exercises.map((exercise, exerciseIndex) => (
              <ExerciseSummary key={`${exercise.name}-${exerciseIndex}`} exercise={exercise} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

const sessionCountLabel = (count) => `${count} ${count === 1 ? 'sessão' : 'sessões'}`;
const formatDayLabel = (dateKey) => {
  const label = formatLocalDate(dateKey, { weekday: 'long', day: '2-digit', month: 'long', year: undefined });
  return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : '';
};

const DayAccordion = ({ day, onDelete, onUpdate, onCardAction, onReopen }) => {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left">
        <CalendarDays size={18} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-main">{formatDayLabel(day.dateKey)}</span>
          <span className="text-xs font-bold text-muted">{sessionCountLabel(day.sessionCount)}</span>
        </span>
        <ChevronRight size={19} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border bg-background/35 p-3">
          {day.sessions.map((session, index) => (
            <SessionCard
              key={session.id || session.localId || `${day.dateKey}-${index}`}
              session={session}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onCardAction={onCardAction}
              onReopen={onReopen}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const WeekAccordion = ({ week, defaultOpen, onDelete, onUpdate, onCardAction, onReopen }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-input/35">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black uppercase tracking-wide text-main">{week.label}</span>
          <span className="text-xs font-bold text-muted">{sessionCountLabel(week.sessionCount)}</span>
        </span>
        <ChevronRight size={20} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="space-y-2 border-t border-border p-3">
          {week.days.map((day) => (
            <DayAccordion key={day.key} day={day} onDelete={onDelete} onUpdate={onUpdate} onCardAction={onCardAction} onReopen={onReopen} />
          ))}
        </div>
      )}
    </section>
  );
};

const MonthAccordion = ({ month, defaultOpen, onDelete, onUpdate, onCardAction, onReopen }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/75">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
        <CalendarRange size={20} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black uppercase tracking-wide text-main">{month.label}</span>
          <span className="text-xs font-bold text-muted">{sessionCountLabel(month.sessionCount)}</span>
        </span>
        <ChevronRight size={20} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border p-3">
          {month.weeks.map((week, index) => (
            <WeekAccordion
              key={week.key}
              week={week}
              defaultOpen={defaultOpen && index === 0}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onCardAction={onCardAction}
              onReopen={onReopen}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const YearAccordion = ({ year, defaultOpen, onDelete, onUpdate, onCardAction, onReopen }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-sm">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
        <Database size={21} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted">Ano</span>
          <span className="block text-lg font-black text-main">{year.label}</span>
        </span>
        <span className="hidden text-xs font-bold text-muted sm:block">{sessionCountLabel(year.sessionCount)}</span>
        <ChevronDown size={21} className={`shrink-0 text-primary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-primary/20 bg-background/20 p-3">
          {year.months.map((month, index) => (
            <MonthAccordion
              key={month.key}
              month={month}
              defaultOpen={defaultOpen && index === 0}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onCardAction={onCardAction}
              onReopen={onReopen}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const HistoryView = ({ history, deleteEntry, updateEntry, reopenEntry, setView }) => {
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [cardDraft, setCardDraft] = useState(null);
  const [shareCardNode, setShareCardNode] = useState(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState(null);
  const [cardImageFile, setCardImageFile] = useState(null);
  const [isCardGenerating, setIsCardGenerating] = useState(false);
  const previousCardPreviewUrl = useRef(null);
  const cardDialogRef = useRef(null);
  const cardCloseButtonRef = useRef(null);
  const cardReturnFocusRef = useRef(null);
  const groups = useMemo(() => groupHistoryByDate(history), [history]);

  useEffect(() => {
    if (!cardDraft || !shareCardNode) return undefined;
    let cancelled = false;
    if (previousCardPreviewUrl.current) {
      URL.revokeObjectURL(previousCardPreviewUrl.current);
      previousCardPreviewUrl.current = null;
    }
    setCardPreviewUrl(null);
    setCardImageFile(null);
    setIsCardGenerating(true);
    const timer = window.setTimeout(async () => {
      try {
        const { toBlob } = await import('html-to-image');
        const blob = await toBlob(shareCardNode, {
          backgroundColor: '#050B14',
          cacheBust: true,
          pixelRatio: 1,
          skipFonts: true,
          filter: (node) => node.tagName === 'IMG' ? node.complete : true,
        });
        if (!blob || cancelled) return;
        if (previousCardPreviewUrl.current) URL.revokeObjectURL(previousCardPreviewUrl.current);
        const nextPreviewUrl = URL.createObjectURL(blob);
        previousCardPreviewUrl.current = nextPreviewUrl;
        const filename = `SOLO-${cardDraft.session.dateKey || 'TREINO'}.png`;
        setCardImageFile(new File([blob], filename, { type: 'image/png' }));
        setCardPreviewUrl(nextPreviewUrl);
      } catch {
        if (!cancelled) setToastMessage('Não foi possível gerar a prévia do card agora.');
      } finally {
        if (!cancelled) setIsCardGenerating(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cardDraft, shareCardNode]);

  useEffect(() => () => {
    if (previousCardPreviewUrl.current) URL.revokeObjectURL(previousCardPreviewUrl.current);
  }, []);

  const closeCardComposer = useCallback(() => {
    if (previousCardPreviewUrl.current) {
      URL.revokeObjectURL(previousCardPreviewUrl.current);
      previousCardPreviewUrl.current = null;
    }
    setCardPreviewUrl(null);
    setCardImageFile(null);
    setCardDraft(null);
    setIsCardGenerating(false);
  }, []);

  const isCardComposerOpen = Boolean(cardDraft);

  useEffect(() => {
    if (!isCardComposerOpen) return undefined;
    const dialog = cardDialogRef.current;
    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.inert ?? false;
    if (appRoot) appRoot.inert = true;
    cardCloseButtonRef.current?.focus();

    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCardComposer();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) {
        event.preventDefault();
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

    dialog?.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      dialog?.removeEventListener('keydown', handleDialogKeyDown);
      if (appRoot) appRoot.inert = wasInert;
      cardReturnFocusRef.current?.focus();
      cardReturnFocusRef.current = null;
    };
  }, [closeCardComposer, isCardComposerOpen]);

  const openCardComposer = (session, preferredAction) => {
    const stats = getSessionShareStats(session);
    cardReturnFocusRef.current = document.activeElement;
    setCardPreviewUrl(null);
    setCardImageFile(null);
    setIsCardGenerating(true);
    setCardDraft({
      session,
      preferredAction,
      variant: 'rpg',
      selfieUrl: null,
      fieldSelection: createShareCardFieldSelection({
        hasPr: Number(stats.prs) > 0,
        hasBoss: Boolean(session.bossEncounter),
      }),
    });
  };

  const updateCardDraft = (updates) => {
    setIsCardGenerating(true);
    setCardDraft((current) => current ? { ...current, ...updates } : current);
  };

  const handleHistorySelfie = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateCardDraft({ selfieUrl: reader.result });
    reader.onerror = () => setToastMessage('Não foi possível carregar esta foto.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const executeCardAction = async (type) => {
    if (!cardDraft || !cardImageFile || !cardPreviewUrl) return;
    const { session } = cardDraft;
    try {
      if (type === 'share' && navigator.canShare?.({ files: [cardImageFile] })) {
        await navigator.share({ title: `Treino de ${formatLocalDate(session.dateKey)}`, files: [cardImageFile] });
        setToastMessage('Card compartilhado.');
      } else {
        const link = document.createElement('a');
        link.download = cardImageFile.name;
        link.href = cardPreviewUrl;
        link.click();
        setToastMessage(type === 'share' ? 'Compartilhamento indisponível; o card foi baixado.' : 'Card baixado com sucesso.');
      }
      closeCardComposer();
    } catch (error) {
      if (error?.name !== 'AbortError') setToastMessage('Não foi possível compartilhar o card agora.');
    }
  };

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const draftStats = cardDraft ? getSessionShareStats(cardDraft.session) : null;
  const hasDraftPr = Number(draftStats?.prs) > 0;
  const hasDraftBoss = Boolean(cardDraft?.session.bossEncounter);

  return (
    <>
      <main className="space-y-5 pb-24">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div><h2 className="flex items-center gap-2 text-xl font-black text-main"><Database className="text-primary" /> Histórico</h2><p className="mt-1 text-sm text-muted">{history.length} {history.length === 1 ? 'sessão registrada' : 'sessões registradas'}</p></div>
        </header>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center"><p className="font-black text-main">Nenhum treino registrado</p><p className="mt-2 text-sm text-muted">Suas sessões concluídas aparecerão aqui.</p></div>
        ) : groups.map((year, index) => (
          <YearAccordion
            key={year.key}
            year={year}
            defaultOpen={index === 0}
            onDelete={setItemToDelete}
            onUpdate={updateEntry}
            onCardAction={openCardComposer}
            onReopen={(entryId) => {
              try {
                reopenEntry(entryId);
                setView('workout');
              } catch (error) {
                setToastMessage(error.message || 'Não foi possível reabrir esta sessão.');
              }
            }}
          />
        ))}

        <button type="button" onClick={() => setView('workout')} className="touch-target w-full rounded-xl border border-primary font-black text-primary">Voltar ao treino</button>
      </main>

      {itemToDelete && createPortal(
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/50 bg-card p-6">
            <AlertTriangle className="mb-4 text-danger" size={32} /><h2 className="text-lg font-black text-main">Excluir esta sessão?</h2><p className="mt-2 text-sm text-muted">Esta ação remove o registro local e, quando aplicável, o registro sincronizado.</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setItemToDelete(null)} className="touch-target rounded-xl border border-border font-bold text-main">Cancelar</button><button type="button" onClick={() => { deleteEntry(itemToDelete, 'workout'); setItemToDelete(null); }} className="touch-target rounded-xl bg-danger font-black text-on-danger">Excluir</button></div>
          </div>
        </div>, document.body,
      )}

      {cardDraft && createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="history-share-title" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
          <section ref={cardDialogRef} className="max-h-[95dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-primary/40 bg-card p-5 shadow-2xl">
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-cyber text-xs font-black uppercase tracking-[0.18em] text-primary">Share Card</p>
                <h2 id="history-share-title" className="mt-1 text-xl font-black text-main">Escolha o que compartilhar</h2>
                <p className="mt-1 text-sm text-muted">A prévia é atualizada com suas escolhas.</p>
              </div>
              <button ref={cardCloseButtonRef} type="button" onClick={closeCardComposer} aria-label="Fechar Share Card" className="touch-target flex shrink-0 items-center justify-center rounded-xl text-muted hover:text-main"><X /></button>
            </header>

            <div className="space-y-3">
              <div className="flex rounded-xl border border-border bg-input p-1">
                <button type="button" aria-pressed={cardDraft.variant === 'rpg'} onClick={() => updateCardDraft({ variant: 'rpg' })} className={`touch-target flex-1 rounded-lg text-sm font-bold ${cardDraft.variant === 'rpg' ? 'bg-primary/15 text-primary' : 'text-muted'}`}>Modo RPG</button>
                <button type="button" aria-pressed={cardDraft.variant === 'data'} onClick={() => updateCardDraft({ variant: 'data' })} className={`touch-target flex-1 rounded-lg text-sm font-bold ${cardDraft.variant === 'data' ? 'bg-primary/15 text-primary' : 'text-muted'}`}>Modo dados</button>
              </div>

              <ShareCardControls
                value={cardDraft.fieldSelection}
                onChange={(fieldSelection) => updateCardDraft({ fieldSelection })}
                hasPr={hasDraftPr}
                hasBoss={hasDraftBoss}
              />

              <div className="relative mx-auto aspect-[9/16] w-full max-w-[230px] overflow-hidden rounded-xl border border-primary/40 bg-black">
                {isCardGenerating && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60"><Loader2 className="animate-spin text-primary" aria-label="Atualizando prévia" /></div>}
                {cardPreviewUrl && <img src={cardPreviewUrl} alt="Prévia do card do treino" className="h-full w-full object-contain" />}
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="touch-target inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-main">
                  <Camera size={18} /> {cardDraft.selfieUrl ? 'Trocar selfie' : 'Adicionar selfie'}
                  <input type="file" accept="image/*" capture="user" className="sr-only" onChange={handleHistorySelfie} />
                </label>
                {cardDraft.selfieUrl && <button type="button" onClick={() => updateCardDraft({ selfieUrl: null })} className="touch-target rounded-xl border border-border px-3 text-sm font-bold text-muted">Remover selfie</button>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {cardDraft.preferredAction === 'share' ? (
                  <>
                    <button type="button" onClick={() => executeCardAction('share')} disabled={isCardGenerating || !cardImageFile} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-on-primary disabled:opacity-40"><Share2 size={17} /> Compartilhar</button>
                    <button type="button" onClick={() => executeCardAction('download')} disabled={isCardGenerating || !cardImageFile} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border text-sm font-black text-main disabled:opacity-40"><Download size={17} /> Baixar</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => executeCardAction('download')} disabled={isCardGenerating || !cardImageFile} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-on-primary disabled:opacity-40"><Download size={17} /> Baixar</button>
                    <button type="button" onClick={() => executeCardAction('share')} disabled={isCardGenerating || !cardImageFile} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border text-sm font-black text-main disabled:opacity-40"><Share2 size={17} /> Compartilhar</button>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>, document.body,
      )}

      {cardDraft && (
        <Suspense fallback={null}>
          <ShareCard cardRef={setShareCardNode} stats={draftStats} workoutTitle={cardDraft.session.workoutTitle || cardDraft.session.workoutName} bossEncounter={cardDraft.session.bossEncounter || null} streak={cardDraft.session.streak ?? 0} xp={calculateSessionXp(cardDraft.session)} currentLevel={cardDraft.session.level || 1} totalXp={0} variant={cardDraft.variant} selfieUrl={cardDraft.selfieUrl} fieldSelection={cardDraft.fieldSelection} />
        </Suspense>
      )}

      {toastMessage && createPortal(<div role="status" className="fixed bottom-24 left-1/2 z-[99999] -translate-x-1/2 rounded-full border border-primary/50 bg-card px-5 py-3 text-sm font-bold text-main shadow-xl">{toastMessage}</div>, document.body)}
    </>
  );
};

export default HistoryView;
