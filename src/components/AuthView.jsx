import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Zap, ShieldCheck, Terminal, AlertTriangle } from 'lucide-react';

const AuthView = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Recrutamento solicitado! Verifique seu e-mail (se a confirmação estiver ativa).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-cyber relative overflow-hidden">
      {/* Efeito de Fundo Matrix/Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5"></div>

      <div className="w-full max-w-md bg-card border-2 border-primary/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(var(--primary),0.1)] relative z-10 backdrop-blur-xl">
        
        {/* Header Identificação */}
        <div className="text-center mb-10">
          <div className="inline-flex w-20 h-20 bg-primary items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.5)] mb-6 animate-pulse">
            <Zap size={40} className="text-black fill-black" />
          </div>
          <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase">
            PROJETO <span className="text-primary font-black">BOMBA</span>
          </h1>
          <p className="text-[10px] font-bold text-muted tracking-[0.4em] uppercase mt-2">Sistema de Identificação</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <p className="text-xs font-bold text-red-200 uppercase leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Codinome (E-mail)</label>
            <input 
              type="email" 
              required
              className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 text-white outline-none focus:border-primary transition-all font-mono"
              placeholder="agente@bomba.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Chave de Acesso</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 text-white outline-none focus:border-primary transition-all font-mono"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] italic transition-all active:scale-95 shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50"
          >
            {loading ? "Processando..." : isSignUp ? "SOLICITAR RECRUTAMENTO" : "AUTENTICAR ACESSO"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] font-black text-muted hover:text-white uppercase tracking-widest transition-colors"
          >
            {isSignUp ? "Já possui acesso? Clique aqui" : "Novo soldado? Iniciar cadastro"}
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center opacity-30">
          <Terminal size={14} className="text-primary" />
          <span className="text-[8px] font-bold text-muted uppercase">Encrypted Connection v4.0</span>
          <ShieldCheck size={14} className="text-primary" />
        </div>
      </div>
    </div>
  );
};

export default AuthView;