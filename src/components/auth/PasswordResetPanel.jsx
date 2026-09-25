import React, { useRef, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { getPasswordUpdateErrorMessage, logAuthDiagnostic } from '../../utils/authFlow';

const PasswordResetPanel = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const updateInFlight = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (updateInFlight.current || loading) return;
    if (password.length < 8) {
      setErrorMsg('Use pelo menos 8 caracteres na nova senha.');
      return;
    }
    if (password !== confirmation) {
      setErrorMsg('As senhas informadas não coincidem.');
      return;
    }

    updateInFlight.current = true;
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmation('');
      setCompleted(true);
    } catch (error) {
      logAuthDiagnostic('Falha ao atualizar senha:', error);
      setErrorMsg(getPasswordUpdateErrorMessage(error));
    } finally {
      updateInFlight.current = false;
      setLoading(false);
    }
  };

  const returnToLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      onComplete();
    }
  };

  if (completed) {
    return (
      <section className="space-y-5 text-center" aria-labelledby="password-updated-title">
        <CheckCircle2 aria-hidden="true" className="mx-auto text-success" size={40} />
        <div>
          <h1 id="password-updated-title" className="font-cyber text-xl font-black uppercase tracking-wide text-main">Senha atualizada</h1>
          <p role="status" className="mt-3 text-sm leading-relaxed text-muted">Sua nova senha foi salva com segurança. Você já pode entrar novamente.</p>
        </div>
        <button type="button" onClick={returnToLogin} disabled={loading} className="auth-primary-action touch-target flex w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black uppercase tracking-widest disabled:opacity-40">
          {loading && <Loader2 aria-hidden="true" size={18} className="animate-spin" />}
          Entrar com a nova senha
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="password-reset-title">
      <div className="text-center">
        <KeyRound aria-hidden="true" className="mx-auto text-primary" size={36} />
        <h1 id="password-reset-title" className="mt-3 font-cyber text-xl font-black uppercase tracking-wide text-main">Criar nova senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">Defina uma senha com pelo menos 8 caracteres.</p>
      </div>

      {errorMsg && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/50 bg-danger/10 p-3 text-xs font-bold text-danger">
          <X aria-hidden="true" size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-xs font-black uppercase text-muted">Nova senha</label>
          <div className="auth-field flex items-center rounded-xl border-2 border-border bg-input px-4 py-3 focus-within:border-primary">
            <Lock aria-hidden="true" size={18} className="mr-3 shrink-0 text-muted" />
            <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-main outline-none" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="touch-target flex items-center justify-center rounded-lg text-muted hover:text-primary">
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-black uppercase text-muted">Confirmar nova senha</label>
          <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="auth-field w-full rounded-xl border-2 border-border bg-input px-4 py-4 text-sm text-main outline-none transition focus:border-primary" />
        </div>
      </div>

      <button type="submit" disabled={loading || !password || !confirmation} className="auth-primary-action touch-target flex w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black uppercase tracking-widest disabled:opacity-40">
        {loading && <Loader2 aria-hidden="true" size={18} className="animate-spin" />}
        {loading ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  );
};

export default PasswordResetPanel;
