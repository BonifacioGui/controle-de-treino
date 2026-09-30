import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail, RefreshCw, TriangleAlert } from 'lucide-react';
import { getEmailConfirmationRedirectUrl } from '../../config/appConfig';
import { supabase } from '../../services/supabaseClient';
import {
  getResendErrorMessage,
  isAuthRateLimitError,
  logAuthDiagnostic,
} from '../../utils/authFlow';

export const EMAIL_RESEND_COOLDOWN_SECONDS = 60;

const EmailConfirmationPanel = ({ email, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const resendInFlight = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const resendConfirmation = async () => {
    if (!email || resendInFlight.current || loading || cooldown > 0) return;
    resendInFlight.current = true;
    setLoading(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: getEmailConfirmationRedirectUrl() },
      });
      if (error) throw error;
      setCooldown(EMAIL_RESEND_COOLDOWN_SECONDS);
      setFeedback({ type: 'success', message: 'Solicitação enviada. Confira sua caixa de entrada e spam.' });
    } catch (error) {
      logAuthDiagnostic('Falha ao solicitar reenvio de confirmação:', error);
      if (isAuthRateLimitError(error)) setCooldown(EMAIL_RESEND_COOLDOWN_SECONDS);
      setFeedback({
        type: 'error',
        message: getResendErrorMessage(error),
      });
    } finally {
      resendInFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5 text-center animate-in zoom-in duration-300" aria-labelledby="confirmation-title">
      <div className="mx-auto inline-flex rounded-full border border-primary/30 bg-primary/10 p-5 text-primary shadow-[0_0_30px_rgba(0,243,255,0.2)]">
        <Mail aria-hidden="true" size={44} />
      </div>
      <div>
        <h2 id="confirmation-title" className="font-cyber text-xl font-black uppercase tracking-[0.1em] text-primary">Verifique seu e-mail</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Se este endereço estiver apto para cadastro, enviaremos um link de confirmação para{' '}
          <strong className="break-all text-main">{email}</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-input/60 p-3 text-left text-xs leading-relaxed text-muted">
        <p className="flex items-start gap-2"><Mail aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={16} /> Confira a caixa de entrada e também a pasta de spam.</p>
        <p className="mt-2 flex items-start gap-2"><TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={16} /> Caso já possua uma conta, retorne ao login. Por segurança, esta tela não confirma se o endereço já está cadastrado.</p>
      </div>

      {feedback && (
        <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-3 text-xs font-bold ${feedback.type === 'error' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-success/40 bg-success/10 text-success'}`}>
          {feedback.message}
        </p>
      )}

      <button
        type="button"
        onClick={resendConfirmation}
        disabled={loading || cooldown > 0}
        className="touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/5 px-4 text-sm font-black text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <RefreshCw aria-hidden="true" size={18} />}
        {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar e-mail'}
      </button>

      {onBack && (
        <button type="button" onClick={onBack} className="touch-target inline-flex items-center justify-center gap-2 rounded-lg px-4 text-xs font-black text-muted hover:text-primary">
          <ArrowLeft aria-hidden="true" size={16} /> Retornar ao login
        </button>
      )}
    </section>
  );
};

export default EmailConfirmationPanel;
