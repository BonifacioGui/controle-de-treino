import React, { useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send, X } from 'lucide-react';
import { getPasswordRecoveryRedirectUrl } from '../../config/appConfig';
import { supabase } from '../../services/supabaseClient';
import {
  getPasswordRecoveryRequestErrorMessage,
  logAuthDiagnostic,
} from '../../utils/authFlow';

export const PASSWORD_RECOVERY_SENT_MESSAGE = 'Se existir uma conta associada a esse e-mail, enviaremos as instruções para redefinir a senha.';

const PasswordRecoveryRequest = ({ initialEmail = '', onBack }) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const requestInFlight = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requestInFlight.current || loading) return;
    requestInFlight.current = true;
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getPasswordRecoveryRedirectUrl(),
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      logAuthDiagnostic('Falha ao solicitar recuperação de senha:', error);
      setErrorMsg(getPasswordRecoveryRequestErrorMessage(error));
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <section className="space-y-5 text-center" aria-labelledby="recovery-sent-title">
        <CheckCircle2 aria-hidden="true" className="mx-auto text-success" size={38} />
        <div>
          <h1 id="recovery-sent-title" className="font-cyber text-xl font-black uppercase tracking-wide text-main">Confira seu e-mail</h1>
          <p role="status" className="mt-3 text-sm leading-relaxed text-muted">{PASSWORD_RECOVERY_SENT_MESSAGE}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">Verifique também a pasta de spam. O link precisa abrir neste dispositivo para você definir a nova senha.</p>
        </div>
        <button type="button" onClick={onBack} className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-black text-primary">
          <ArrowLeft aria-hidden="true" size={17} /> Retornar ao login
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="recovery-request-title">
      <div className="text-center">
        <Mail aria-hidden="true" className="mx-auto text-primary" size={34} />
        <h1 id="recovery-request-title" className="mt-3 font-cyber text-xl font-black uppercase tracking-wide text-main">Redefinir senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">Informe seu e-mail para receber um link seguro de recuperação.</p>
      </div>

      {errorMsg && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/50 bg-danger/10 p-3 text-xs font-bold text-danger">
          <X aria-hidden="true" size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label htmlFor="recovery-email" className="mb-1.5 block text-xs font-black uppercase text-muted">E-mail de acesso</label>
        <input
          id="recovery-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="auth-field w-full rounded-xl border-2 border-border bg-input px-4 py-4 text-sm font-medium text-main outline-none transition focus:border-primary"
          placeholder="voce@exemplo.com"
        />
      </div>

      <button type="submit" disabled={loading || !email.trim()} className="auth-primary-action touch-target flex w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black uppercase tracking-widest disabled:opacity-40">
        {loading ? <Loader2 aria-hidden="true" size={18} className="animate-spin" /> : <Send aria-hidden="true" size={18} />}
        {loading ? 'Enviando...' : 'Enviar instruções'}
      </button>
      <button type="button" onClick={onBack} className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl text-xs font-black text-muted transition hover:text-primary">
        <ArrowLeft aria-hidden="true" size={16} /> Voltar ao login
      </button>
    </form>
  );
};

export default PasswordRecoveryRequest;
