import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  DownloadCloud,
  LogOut,
  Moon,
  RefreshCw,
  ShieldAlert,
  Sun,
  User,
  X,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { getLocalDateKey } from '../../utils/dateUtils';
import { getSoloBackup } from '../../utils/storage';

const SidebarMenu = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  setView,
  hasPendingChanges,
  syncStatus,
  onSync,
}) => {
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleClose = () => {
    setConfirmLogout(false);
    onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleClose();
  };

  const handleBackup = () => {
    const data = JSON.stringify(getSoloBackup(), null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `solo-backup-v1-${getLocalDateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    handleClose();
  };

  const navigateTo = (route) => {
    setView(route);
    handleClose();
  };

  if (!isOpen) return null;

  const isSyncing = syncStatus === 'syncing';
  const SyncIcon = hasPendingChanges ? CloudOff : Cloud;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <aside aria-label="Menu" className="relative flex h-full w-80 flex-col border-l border-primary/60 bg-card p-6 text-main shadow-2xl">
        <div className="mb-7 flex items-center justify-between border-b border-border pb-4">
          <div><h2 className="text-xl font-black">Menu</h2><p className="mt-1 text-xs text-muted">Preferências e dados</p></div>
          <button type="button" onClick={handleClose} aria-label="Fechar menu" className="touch-target flex items-center justify-center rounded-xl text-muted hover:text-main"><X size={26} /></button>
        </div>

        <div className="mb-7 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Aparência</p>
          <button type="button" onClick={() => setTheme(theme === 'light' ? 'driver' : 'light')} className="touch-target flex w-full items-center justify-between rounded-xl border border-border bg-input px-4 text-sm font-bold text-main">
            <span>{theme === 'light' ? 'Tema claro' : 'Tema escuro'}</span>
            {theme === 'light' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Conta e dados</p>
          <button type="button" onClick={() => navigateTo('profile')} className="touch-target flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold text-main hover:border-primary/50"><User size={18} /> Perfil e biometria</button>
          <button type="button" onClick={handleBackup} className="touch-target flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold text-main hover:border-primary/50"><DownloadCloud size={18} /> Baixar backup local</button>
          <button type="button" onClick={onSync} disabled={!hasPendingChanges || isSyncing} className="touch-target flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 text-sm font-bold text-main disabled:opacity-60">
            <span className="flex items-center gap-3"><SyncIcon size={18} /> {hasPendingChanges ? 'Sincronização pendente' : 'Dados sincronizados'}</span>
            {isSyncing && <RefreshCw size={17} className="animate-spin text-primary" />}
          </button>
        </div>

        <div className="border-t border-border pt-5">
          {!confirmLogout ? (
            <button type="button" onClick={() => setConfirmLogout(true)} className="touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/5 font-black text-red-500"><LogOut size={18} /> Sair da conta</button>
          ) : (
            <div className="rounded-xl border border-red-500/50 bg-red-500/5 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-red-500"><ShieldAlert size={18} /> Confirmar saída?</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{hasPendingChanges ? 'Há alterações ainda não sincronizadas. Elas serão mantidas neste dispositivo e poderão ser enviadas quando você entrar novamente.' : 'Os dados locais do SOLO serão mantidos neste dispositivo.'}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmLogout(false)} className="touch-target rounded-xl border border-border text-sm font-bold text-main">Cancelar</button>
                <button type="button" onClick={handleLogout} className="touch-target rounded-xl bg-red-600 text-sm font-black text-white">Sair</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default SidebarMenu;
