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
        <div className="border border-danger/50 bg-danger/10 text-danger p-3 rounded-xl mb-6 text-xs font-black uppercase text-center flex items-center justify-center gap-2 animate-in fade-in shadow-sm">
            <X size={16} className="shrink-0" /> 
            <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      {/* CABEÇALHO LOGIN */}
      <div className="flex flex-col items-center text-center mb-10 mt-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="auth-wordmark font-cyber font-black text-5xl sm:text-6xl tracking-[0.15em] bg-[length:200%_auto] bg-clip-text text-transparent leading-none uppercase transition-all duration-500">
            SOLO
          </h1>
          <div className="relative h-10 w-auto flex items-center justify-center shrink-0">
            <img 
              src={logoSolo} 
              alt="SOLO Logo" 
              className="auth-logo object-contain h-full w-auto transition-all duration-300 relative z-10"
            />
          </div>
        </div>
        <p className="auth-tagline font-mono text-xs text-muted uppercase tracking-[0.28em] mt-5 pl-3 border-l-2 border-border">
          Where <span className="text-main font-bold">Discipline</span> Becomes{' '}
          <span className="text-secondary font-extrabold">Dopamine</span>
        </p>
      </div>

      {/* SEÇÃO DE INPUTS */}
      <div className="space-y-5">
        
        {/* Campo E-mail */}
        <div className="group">
          <label htmlFor="email-input" className="mb-1.5 block cursor-pointer text-xs font-black uppercase text-muted transition-colors group-focus-within:text-primary">
            E-mail de Acesso
          </label>
          <div className="auth-field flex items-center w-full bg-input border-2 border-border rounded-xl px-4 py-4 focus-within:border-primary transition-all duration-300">
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
          <div className="auth-field flex items-center w-full bg-input border-2 border-border rounded-xl px-4 py-4 focus-within:border-primary transition-all duration-300">
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
        className="auth-primary-action w-full mt-2 font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:hover:scale-100 uppercase tracking-widest text-sm"
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
          className="touch-target rounded-lg px-4 text-xs font-black text-muted transition-colors hover:bg-primary/5 hover:text-primary"
        >
          Novo no SOLO? <span className="hover:underline">Criar Conta</span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
