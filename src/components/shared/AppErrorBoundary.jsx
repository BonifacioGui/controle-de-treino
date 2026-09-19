import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { isChunkLoadError } from '../../utils/chunkRecovery';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Falha não recuperada na interface do SOLO', error, errorInfo);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunkLoadFailed = isChunkLoadError(error);

    return (
      <main className="flex min-h-screen items-center justify-center bg-page p-4 font-sans text-main">
        <section
          role="alert"
          aria-labelledby="app-recovery-title"
          className="w-full max-w-md rounded-3xl border border-danger/40 bg-card p-6 text-center shadow-2xl"
        >
          <AlertTriangle aria-hidden="true" className="mx-auto text-danger" size={44} />
          <h1 id="app-recovery-title" className="mt-4 font-cyber text-xl font-black tracking-wide text-main">
            {chunkLoadFailed ? 'Nova versão detectada' : 'Não foi possível abrir esta tela'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {chunkLoadFailed
              ? 'Os arquivos do aplicativo foram atualizados enquanto esta página estava aberta.'
              : 'Ocorreu uma falha inesperada na interface.'}
            {' '}Seu treino salvo neste dispositivo foi preservado.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="touch-target mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-black text-on-primary"
          >
            <RefreshCw aria-hidden="true" size={18} /> Atualizar página
          </button>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
