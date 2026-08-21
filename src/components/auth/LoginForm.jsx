import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { LogIn, Eye, EyeOff, Loader2, X, User, Lock } from 'lucide-react';
import logoSolo from '../../assets/logo-solo.svg';

const LoginForm = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault(); 
    
    setLoading(true);
    setErrorMsg('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Tradução rápida de erros comuns para manter a imersão
      const msg = error.message === 'Invalid login credentials' 
        ? 'Credenciais de acesso inválidas.' 
        : error.message;
      setErrorMsg(msg);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-left duration-300">
      
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-[11px] font-black uppercase text-center flex items-center justify-center gap-2 animate-in fade-in shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <X size={16} className="shrink-0" /> 
            <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      {/* CABEÇALHO LOGIN */}
      <div className="flex flex-col items-center text-center mb-10 mt-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-sans font-black text-5xl sm:text-6xl tracking-[0.15em] bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent leading-none uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all duration-500">
            SOLO
          </h1>
          <div className="relative h-10 w-auto flex items-center justify-center shrink-0">
            <img 
              src={logoSolo} 
              alt="SOLO Logo" 
              className="object-contain h-full w-auto drop-shadow-[0_0_8px_rgba(0,243,255,0.7)] transition-all duration-300 relative z-10" 
            />
          </div>
        </div>
        <p className="font-mono text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.35em] mt-5 pl-3 border-l-2 border-slate-700/80">
          Where <span className="text-slate-100 font-bold">Discipline</span> Becomes{' '}
          <span className="text-secondary drop-shadow-[0_0_8px_rgba(var(--secondary),0.6)] font-extrabold">Dopamine</span>
        </p>
      </div>

      {/* SEÇÃO DE INPUTS */}
      <div className="space-y-5">
        
        {/* Campo E-mail */}
        <div className="group">
          <label htmlFor="email-input" className="mb-1.5 block cursor-pointer text-xs font-black uppercase text-muted transition-colors group-focus-within:text-primary">
            E-mail de Acesso
          </label>
          <div className="flex items-center w-full bg-input border-2 border-border rounded-xl px-4 py-4 focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(0,243,255,0.15)] transition-all duration-300">
            <User className="text-muted shrink-0 mr-3.5 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              id="email-input"
              type="email" 
              required
              className="flex-1 bg-transparent outline-none font-sans font-medium text-sm text-main placeholder:text-muted/40" 
              placeholder="cypher@solo.app" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
        </div>

        {/* Campo Senha */}
        <div className="relative group">
          <label htmlFor="password-input" className="mb-1.5 block cursor-pointer text-xs font-black uppercase text-muted transition-colors group-focus-within:text-primary">
            Senha de Acesso
          </label>
          <div className="flex items-center w-full bg-input border-2 border-border rounded-xl px-4 py-4 focus-within:border-primary focus-within:shadow-[0_0_15px_rgba(0,243,255,0.15)] transition-all duration-300">
            <Lock className="text-muted shrink-0 mr-3.5 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              id="password-input"
              type={showPassword ? 'text' : 'password'} 
              required
              className="flex-1 bg-transparent outline-none font-sans font-medium text-sm text-main placeholder:text-muted/40 tracking-widest placeholder:tracking-normal" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)} 
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="touch-target flex items-center justify-center rounded-xl text-muted transition-colors hover:text-primary"
            >
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading || !email || !password} 
        className="w-full mt-2 bg-gradient-to-r from-primary via-[#4050ff] to-secondary bg-[length:200%_auto] animate-gradient text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:hover:scale-100 uppercase tracking-widest text-sm"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> VERIFICANDO...</>
        ) : (
          <><LogIn size={18}/> ENTRAR</>
        )}
      </button>

      {/* Link de Switch */}
      <div className="text-center pt-2">
        <button 
          type="button"
          onClick={onSwitch} 
          className="touch-target rounded-lg px-4 text-xs font-black text-muted transition-colors hover:bg-white/5 hover:text-primary"
        >
          Novo no SOLO? <span className="hover:underline">Criar Conta</span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
