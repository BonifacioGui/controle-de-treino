import React from 'react';
import { Bell, BellOff, CheckCheck, ChevronRight, Clock3, Dumbbell, X } from 'lucide-react';

const formatNotificationDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const NotificationCenter = ({
  isOpen,
  onClose,
  items,
  unreadCount,
  preferences,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onCategoryChange,
  onPause,
  onAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex justify-end">
      <button type="button" aria-label="Fechar notificações" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside aria-label="Central de notificações" className="relative flex h-full w-full max-w-md flex-col border-l border-primary/40 bg-card text-main shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="flex items-center gap-2 font-cyber text-lg font-black uppercase"><Bell className="text-primary" size={20} /> Notificações</p>
            <p className="mt-1 text-xs text-muted">{unreadCount > 0 ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}` : 'Tudo em dia'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="touch-target -m-2 flex items-center justify-center rounded-xl text-muted hover:text-main"><X size={23} /></button>
        </header>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <button type="button" onClick={onMarkAllRead} disabled={unreadCount === 0} className="touch-target inline-flex items-center gap-2 text-xs font-black text-primary disabled:opacity-40"><CheckCheck size={16} /> Marcar tudo como lido</button>
          <button type="button" onClick={() => onPause(preferences.pauseUntil ? 0 : 7)} className="touch-target inline-flex items-center gap-2 text-xs font-bold text-muted"><Clock3 size={15} /> {preferences.pauseUntil ? 'Retomar alertas' : 'Pausar 7 dias'}</button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          {items.length === 0 ? (
            <div className="mt-12 text-center">
              <BellOff className="mx-auto text-muted" size={38} />
              <p className="mt-4 font-black text-main">Nenhum alerta pendente</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">O SOLO avisará quando a ficha e o histórico indicarem algum grupo abaixo da frequência planejada.</p>
            </div>
          ) : items.map((item) => (
            <article key={item.id} className={`rounded-2xl border p-4 ${item.read ? 'border-border bg-input/35' : 'border-primary/50 bg-primary/5 shadow-[0_0_16px_rgba(var(--primary),0.08)]'}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Dumbbell size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black leading-snug text-main">{item.title}</h3>
                    {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--secondary),0.8)]" aria-label="Não lida" />}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.message}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">{formatNotificationDate(item.createdAt)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex items-center gap-3">
                  {!item.read && <button type="button" onClick={() => onMarkRead(item.id)} className="touch-target text-[11px] font-bold text-primary">Marcar como lida</button>}
                  <button type="button" onClick={() => onDismiss(item.id)} className="touch-target text-[11px] font-bold text-muted hover:text-danger">Dispensar</button>
                </div>
                {item.action && <button type="button" onClick={() => onAction(item)} className="touch-target inline-flex items-center gap-1 text-[11px] font-black text-primary">{item.action.label}<ChevronRight size={15} /></button>}
              </div>
            </article>
          ))}
        </div>

        <footer className="border-t border-border bg-input/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">Categorias</p>
          <label className="touch-target mt-2 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 text-sm font-bold">
            Acompanhamento da ficha
            <input type="checkbox" checked={preferences.muscleGaps !== false} onChange={(event) => onCategoryChange('muscleGaps', event.target.checked)} className="h-5 w-5 appearance-auto accent-cyan-400" />
          </label>
          {preferences.pauseUntil && <p className="mt-2 text-xs text-muted">Alertas pausados até {preferences.pauseUntil.split('-').reverse().join('/')}.</p>}
        </footer>
      </aside>
    </div>
  );
};

export default NotificationCenter;
