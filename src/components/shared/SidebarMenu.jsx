import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  ClipboardList,
  DownloadCloud,
  FileUp,
  LogOut,
  Moon,
  RefreshCw,
  ShieldAlert,
  Sun,
  User,
  Vibrate,
  X,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { getLocalDateKey } from '../../utils/dateUtils';
import { getSoloBackup } from '../../utils/storage';
import {
  getHapticCapability,
  getHapticCapabilityMessage,
  getHapticTestMessage,
  HAPTIC_PLATFORMS,
  HAPTIC_TYPES,
  triggerHaptic,
} from '../../utils/haptics';

const EXPERIENCE_OPTIONS = [
  {
    value: 'immersive',
    label: 'Imersiva',
    description: 'Neon intenso, grade tática e profundidade máxima.',
  },
  {
    value: 'balanced',
    label: 'Equilibrada',
    description: 'Identidade SOLO com efeitos moderados para o dia a dia.',
  },
  {
    value: 'discreet',
    label: 'Discreta',
    description: 'Visual limpo, sem grade, brilhos ou animações decorativas.',
  },
];

const SidebarMenu = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  experienceMode,
  setExperienceMode,
  hapticFeedback,
  setHapticFeedback,
  setView,
  hasPendingChanges,
  syncStatus,
  onSync,
  userId,
}) => {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [hapticStatus, setHapticStatus] = useState('');
  const hapticCapability = getHapticCapability();

  const handleClose = () => {
    setConfirmLogout(false);
    onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleClose();
  };

  const handleBackup = () => {
    const data = JSON.stringify(getSoloBackup(userId), null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `solo-backup-v3-${getLocalDateKey()}.json`;
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

  const testHaptic = () => {
    const result = triggerHaptic(HAPTIC_TYPES.setComplete);
    setHapticStatus(getHapticTestMessage(result));
  };

  if (!isOpen) return null;

  const isSyncing = syncStatus === 'syncing';
  const SyncIcon = hasPendingChanges ? CloudOff : Cloud;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <aside aria-label="Menu" className="relative flex h-full w-80 flex-col overflow-y-auto overscroll-contain border-l border-primary/60 bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-main shadow-2xl">
        <div className="mb-7 flex items-center justify-between border-b border-border pb-4">
          <div><h2 className="text-xl font-black">Menu</h2><p className="mt-1 text-xs text-muted">Preferências e dados</p></div>
          <button type="button" onClick={handleClose} aria-label="Fechar menu" className="touch-target flex items-center justify-center rounded-xl text-muted hover:text-main"><X size={26} /></button>
        </div>

        <div className="mb-7 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Aparência</p>
          <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="touch-target flex w-full items-center justify-between rounded-xl border border-border bg-input px-4 text-sm font-bold text-main">
            <span>{theme === 'light' ? 'Tema claro' : 'Tema escuro'}</span>
            {theme === 'light' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Experiência</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-input p-1">
              {EXPERIENCE_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setExperienceMode(value)} aria-pressed={experienceMode === value} className={`min-h-11 rounded-lg px-1 text-[11px] font-black transition-colors ${experienceMode === value ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'text-muted'}`}>
                  {label}
                </button>
              ))}
            </div>
            <p role="status" className="mt-2 min-h-8 px-1 text-xs leading-relaxed text-muted">
              {EXPERIENCE_OPTIONS.find(({ value }) => value === experienceMode)?.description}
            </p>
          </fieldset>
          <div className="rounded-xl border border-border bg-input p-3">
            <label className="touch-target flex cursor-pointer items-center justify-between text-sm font-bold text-main">
              <span className="flex items-center gap-2"><Vibrate size={18} className="text-primary" /> Vibração</span>
              <input type="checkbox" checked={hapticFeedback} onChange={(event) => setHapticFeedback(event.target.checked)} className="h-5 w-5 appearance-auto rounded border-border accent-cyan-400" />
            </label>
            <p className="mt-1 text-xs leading-relaxed text-muted">Pulso ao concluir série e alerta distinto no fim do descanso. O aviso visual de descanso fica ativo mesmo sem vibração.</p>
            <p className="mt-2 rounded-lg border border-border bg-card/60 p-2 text-xs leading-relaxed text-muted">{getHapticCapabilityMessage(hapticCapability)}</p>
            <button type="button" onClick={testHaptic} disabled={!hapticCapability.supported || hapticCapability.platform === HAPTIC_PLATFORMS.ios} className="mt-3 min-h-11 w-full rounded-lg border border-primary/40 text-xs font-black text-primary disabled:cursor-not-allowed disabled:opacity-50">Testar vibração</button>
            {hapticStatus && <p role="status" className="mt-2 text-xs text-muted">{hapticStatus}</p>}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Treino</p>
          <button type="button" onClick={() => navigateTo('manage')} className="touch-target flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold text-main hover:border-primary/50"><ClipboardList size={18} /> Editar plano</button>
          <button type="button" onClick={() => navigateTo('importer')} className="touch-target flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold text-main hover:border-primary/50"><FileUp size={18} /> Importar ficha</button>
          <p className="pt-3 text-xs font-bold uppercase tracking-widest text-muted">Conta e dados</p>
          <button type="button" onClick={() => navigateTo('profile')} className="touch-target flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold text-main hover:border-primary/50"><User size={18} /> Perfil e biometria</button>
          <button type="button" onClick={handleBackup} className="touch-target flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-bold text-main hover:border-primary/50"><DownloadCloud size={18} /> Baixar backup local</button>
          <button type="button" onClick={onSync} disabled={!hasPendingChanges || isSyncing} className="touch-target flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 text-sm font-bold text-main disabled:opacity-60">
            <span className="flex items-center gap-3"><SyncIcon size={18} /> {hasPendingChanges ? 'Sincronização pendente' : 'Dados sincronizados'}</span>
            {isSyncing && <RefreshCw size={17} className="animate-spin text-primary" />}
          </button>
        </div>

        <div className="border-t border-border pt-5">
          {!confirmLogout ? (
            <button type="button" onClick={() => setConfirmLogout(true)} className="touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/5 font-black text-danger"><LogOut size={18} /> Sair da conta</button>
          ) : (
            <div className="rounded-xl border border-danger/50 bg-danger/5 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-danger"><ShieldAlert size={18} /> Confirmar saída?</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{hasPendingChanges ? 'Há alterações ainda não sincronizadas. Elas serão mantidas neste dispositivo e poderão ser enviadas quando você entrar novamente.' : 'Os dados locais do SOLO serão mantidos neste dispositivo.'}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmLogout(false)} className="touch-target rounded-xl border border-border text-sm font-bold text-main">Cancelar</button>
                <button type="button" onClick={handleLogout} className="touch-target rounded-xl bg-danger text-sm font-black text-on-danger">Sair</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default SidebarMenu;
