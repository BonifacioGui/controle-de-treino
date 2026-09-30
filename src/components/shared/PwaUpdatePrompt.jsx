import { useEffect, useRef } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PwaUpdatePrompt = () => {
  const updateButtonRef = useRef(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Não foi possível registrar a atualização offline do SOLO', error);
    },
  });

  useEffect(() => {
    if (!needRefresh) return undefined;

    const previouslyFocused = document.activeElement;
    updateButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setNeedRefresh(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [needRefresh, setNeedRefresh]);

  if (!needRefresh) return null;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="pwa-update-title"
      aria-describedby="pwa-update-description"
      className="fixed inset-x-3 bottom-24 z-[10000] mx-auto w-auto max-w-md rounded-2xl border border-primary/50 bg-card/95 p-4 font-sans text-main shadow-2xl backdrop-blur-xl sm:bottom-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <RefreshCw aria-hidden="true" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="pwa-update-title" className="font-cyber text-sm font-black tracking-wide text-main">
            Nova versão disponível
          </h2>
          <p id="pwa-update-description" className="mt-1 text-xs leading-relaxed text-muted">
            Atualize quando estiver pronto. O treino em andamento continuará salvo neste dispositivo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="Lembrar de atualizar depois"
          className="touch-target -mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-input hover:text-main"
        >
          <X aria-hidden="true" size={19} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="touch-target rounded-xl border border-border px-3 text-sm font-bold text-main hover:border-primary/50"
        >
          Depois
        </button>
        <button
          ref={updateButtonRef}
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="touch-target rounded-xl bg-primary px-3 text-sm font-black text-on-primary shadow-[0_0_20px_rgba(var(--primary),.18)]"
        >
          Atualizar agora
        </button>
      </div>
    </aside>
  );
};

export default PwaUpdatePrompt;
