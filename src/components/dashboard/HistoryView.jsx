import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudOff,
  Database,
  Download,
  Pencil,
  Save,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { formatLocalDate } from '../../utils/dateUtils';
import { calculateCompletedVolume } from '../../utils/sessionModel';

const ShareCard = lazy(() => import('../export/ShareCard'));
const SESSIONS_PER_PAGE = 6;

const formatDuration = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remaining = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const groupByMonth = (history) => history.reduce((groups, session) => {
  const title = formatLocalDate(session.dateKey, { month: 'long', year: 'numeric' });
  const key = title.charAt(0).toUpperCase() + title.slice(1);
  return { ...groups, [key]: [...(groups[key] || []), session] };
}, {});

const SetEditor = ({ set, setIndex, onChange }) => (
  <div className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2">
    <span className="text-center text-xs font-black text-muted">{setIndex + 1}</span>
    <input type="text" inputMode="decimal" aria-label={`Carga da série ${setIndex + 1}`} value={set.weight || ''} onChange={(event) => onChange(setIndex, 'weight', event.target.value)} placeholder="kg" className="h-11 rounded-xl border border-border bg-input px-2 text-center text-base font-bold text-main" />
    <input type="text" inputMode="numeric" aria-label={`Repetições da série ${setIndex + 1}`} value={set.reps || ''} onChange={(event) => onChange(setIndex, 'reps', event.target.value)} placeholder="reps" className="h-11 rounded-xl border border-border bg-input px-2 text-center text-base font-bold text-main" />
  </div>
);

const ExerciseSummary = ({ exercise, editing, onChangeSet }) => {
  const completedSets = (exercise.sets || []).filter((set) => set.completed);
  return (
    <div className="border-b border-border p-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-main">{exercise.name}</p>
        <span className={`text-xs font-bold ${exercise.skipped ? 'text-warning' : 'text-muted'}`}>
          {exercise.skipped ? 'Pulado' : `${completedSets.length} séries`}
        </span>
      </div>
      {editing ? (
        <div className="mt-3 space-y-2">
          {(exercise.sets || []).map((set, setIndex) => <SetEditor key={setIndex} set={set} setIndex={setIndex} onChange={onChangeSet} />)}
        </div>
      ) : (
        completedSets.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {completedSets.map((set, setIndex) => (
              <span key={setIndex} className="rounded-lg border border-border bg-input px-2 py-1 text-xs font-bold text-main">
                {set.weight ? `${set.weight} kg` : set.duration ? `${set.duration} s` : set.distance ? `${set.distance} km` : ''}
                {set.reps ? `${set.weight ? ' × ' : ''}${set.reps} reps` : ''}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  );
};

const SessionCard = ({ session, onDelete, onUpdate, onCardAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session);
  const entryId = session.id || session.localId;
  const synced = session.syncStatus === 'synced';

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, index) => index === exerciseIndex ? {
        ...exercise,
        sets: exercise.sets.map((set, currentSetIndex) => currentSetIndex === setIndex ? { ...set, [field]: value } : set),
      } : exercise),
    }));
  };

  const save = async () => {
    await onUpdate(entryId, draft);
    setEditing(false);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-main">{session.workoutName}</h3>
            {session.partial && <span className="rounded-md bg-warning/15 px-2 py-1 text-[11px] font-black text-warning">Parcial</span>}
          </div>
          <p className="mt-1 text-sm text-muted">{formatLocalDate(session.dateKey, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted">
            <span>{Math.round(session.totalVolume || 0).toLocaleString('pt-BR')} kg</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {formatDuration(session.duration)}</span>
            <span className={`flex items-center gap-1 ${synced ? 'text-green-500' : 'text-warning'}`}>{synced ? <Cloud size={13} /> : <CloudOff size={13} />}{synced ? 'Sincronizado' : 'Salvo neste dispositivo'}</span>
          </div>
        </button>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Recolher sessão' : 'Abrir sessão'} className="touch-target flex items-center justify-center rounded-xl text-muted"><ChevronDown className={expanded ? 'rotate-180' : ''} /></button>
      </div>

      {expanded && (
        <div className="border-t border-border">
          <div className="flex flex-wrap gap-2 p-3">
            <button type="button" onClick={() => onCardAction(session, 'download')} className="touch-target inline-flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-main"><Download size={16} /> Baixar card</button>
            <button type="button" onClick={() => onCardAction(session, 'share')} className="touch-target inline-flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-main"><Share2 size={16} /> Compartilhar</button>
            {!editing ? (
              <button type="button" onClick={() => setEditing(true)} className="touch-target ml-auto inline-flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-main"><Pencil size={16} /> Editar</button>
            ) : (
              <>
                <button type="button" onClick={() => { setDraft(session); setEditing(false); }} className="touch-target ml-auto flex items-center justify-center rounded-xl border border-border px-3" aria-label="Cancelar edição"><X size={17} /></button>
                <button type="button" onClick={save} className="touch-target inline-flex items-center gap-2 rounded-xl bg-primary px-3 text-xs font-black text-black"><Save size={16} /> Salvar</button>
              </>
            )}
            <button type="button" onClick={() => onDelete(entryId)} aria-label="Excluir sessão" className="touch-target flex items-center justify-center rounded-xl border border-red-500/40 px-3 text-red-500"><Trash2 size={17} /></button>
          </div>
          {editing ? (
            <label className="block px-3 pb-3"><span className="mb-2 block text-xs font-bold text-muted">Nota da sessão</span><textarea value={draft.note || ''} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} className="min-h-20 w-full rounded-xl border border-border bg-input p-3 text-sm text-main" /></label>
          ) : session.note ? <p className="mx-3 mb-3 rounded-xl bg-warning/5 p-3 text-sm text-muted">{session.note}</p> : null}
          <div className="border-t border-border">
            {(editing ? draft.exercises : session.exercises).map((exercise, exerciseIndex) => (
              <ExerciseSummary key={`${exercise.name}-${exerciseIndex}`} exercise={exercise} editing={editing} onChangeSet={(setIndex, field, value) => updateSet(exerciseIndex, setIndex, field, value)} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

const HistoryView = ({ history, deleteEntry, updateEntry, setView }) => {
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [cardAction, setCardAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const shareCardRef = useRef(null);
  const historyTopRef = useRef(null);
  const totalPages = Math.max(1, Math.ceil(history.length / SESSIONS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const firstSessionIndex = (safePage - 1) * SESSIONS_PER_PAGE;
  const paginatedHistory = history.slice(firstSessionIndex, firstSessionIndex + SESSIONS_PER_PAGE);
  const groups = groupByMonth(paginatedHistory);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const goToPage = (page) => {
    const nextPage = Math.min(totalPages, Math.max(1, page));
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => historyTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  useEffect(() => {
    if (!cardAction || !shareCardRef.current) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const { toBlob, toPng } = await import('html-to-image');
        const { session, type } = cardAction;
        const filename = `SOLO-${session.dateKey}.png`;
        if (type === 'download') {
          const link = document.createElement('a');
          link.download = filename;
          link.href = await toPng(shareCardRef.current, { cacheBust: true, pixelRatio: 1 });
          link.click();
          setToastMessage('Card baixado com sucesso.');
        } else {
          const blob = await toBlob(shareCardRef.current, { cacheBust: true, pixelRatio: 1 });
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: `Treino de ${formatLocalDate(session.dateKey)}`, files: [file] });
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            setToastMessage('Compartilhamento indisponível; o card foi baixado.');
          }
        }
      } catch (error) {
        if (error?.name !== 'AbortError') setToastMessage('Não foi possível gerar o card agora.');
      } finally {
        setCardAction(null);
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [cardAction]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <>
      <main ref={historyTopRef} className="scroll-mt-4 space-y-5 pb-24">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div><h2 className="flex items-center gap-2 text-xl font-black text-main"><Database className="text-primary" /> Histórico</h2><p className="mt-1 text-sm text-muted">{history.length} {history.length === 1 ? 'sessão registrada' : 'sessões registradas'}</p></div>
        </header>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center"><p className="font-black text-main">Nenhum treino registrado</p><p className="mt-2 text-sm text-muted">Suas sessões concluídas aparecerão aqui.</p></div>
        ) : Object.entries(groups).map(([month, sessions]) => (
          <section key={month} className="space-y-3"><h3 className="text-sm font-black capitalize text-muted">{month}</h3>{sessions.map((session) => <SessionCard key={session.id || session.localId} session={session} onDelete={setItemToDelete} onUpdate={updateEntry} onCardAction={(entry, type) => setCardAction({ session: entry, type })} />)}</section>
        ))}

        {history.length > 0 && (
          <nav aria-label="Paginação do histórico" className="rounded-2xl border border-border bg-card p-3">
            <p className="mb-3 text-center text-xs font-bold text-muted">
              Exibindo {firstSessionIndex + 1}–{Math.min(firstSessionIndex + SESSIONS_PER_PAGE, history.length)} de {history.length}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} className="touch-target inline-flex items-center justify-center gap-1 rounded-xl border border-border px-3 text-sm font-bold text-main disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={18} /> Anterior</button>
              <span className="px-2 text-center text-sm font-black text-primary" aria-live="polite">{safePage}/{totalPages}</span>
              <button type="button" onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} className="touch-target inline-flex items-center justify-center gap-1 rounded-xl border border-border px-3 text-sm font-bold text-main disabled:cursor-not-allowed disabled:opacity-35">Próxima <ChevronRight size={18} /></button>
            </div>
          </nav>
        )}

        <button type="button" onClick={() => setView('workout')} className="touch-target w-full rounded-xl border border-primary font-black text-primary">Voltar ao treino</button>
      </main>

      {itemToDelete && createPortal(
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/50 bg-card p-6">
            <AlertTriangle className="mb-4 text-red-500" size={32} /><h2 className="text-lg font-black text-main">Excluir esta sessão?</h2><p className="mt-2 text-sm text-muted">Esta ação remove o registro local e, quando aplicável, o registro sincronizado.</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => setItemToDelete(null)} className="touch-target rounded-xl border border-border font-bold text-main">Cancelar</button><button type="button" onClick={() => { deleteEntry(itemToDelete, 'workout'); setItemToDelete(null); }} className="touch-target rounded-xl bg-red-600 font-black text-white">Excluir</button></div>
          </div>
        </div>, document.body,
      )}

      {cardAction && (
        <Suspense fallback={null}>
          <ShareCard cardRef={shareCardRef} stats={{ duration: formatDuration(cardAction.session.duration), volume: Math.round(cardAction.session.totalVolume || cardAction.session.exercises.reduce((sum, exercise) => sum + calculateCompletedVolume(exercise.sets), 0)).toString(), prs: cardAction.session.prsBroken || 0 }} bossName={cardAction.session.workoutName} streak={cardAction.session.streak || 1} xp={cardAction.session.bonusXp || 0} currentLevel={cardAction.session.level || 1} totalXp={0} bossHp={5000} variant="rpg" />
        </Suspense>
      )}

      {toastMessage && createPortal(<div role="status" className="fixed bottom-24 left-1/2 z-[99999] -translate-x-1/2 rounded-full border border-primary/50 bg-card px-5 py-3 text-sm font-bold text-main shadow-xl">{toastMessage}</div>, document.body)}
    </>
  );
};

export default HistoryView;
