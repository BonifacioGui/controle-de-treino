import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Zap, ShieldCheck, User, Target, ChevronRight, Check, X, Eye, EyeOff, LogIn, Scale, Ruler, Calendar as CalendarIcon, Mail, Loader2, ArrowLeft } from 'lucide-react';
import CyberCalendar from '../dashboard/CyberCalendar'; 
import logoSolo from '../../assets/logo-solo.svg';

// ============================================================================
// 🔥 CONFIGURAÇÕES GLOBAIS
// ============================================================================

const STEPS = {
  CREDENTIALS: 1,
  BIOMETRICS: 2,
  GOAL: 3,
  CLASS: 4,
};

const TOTAL_STEPS = Object.keys(STEPS).length;

const GENDER_OPTIONS = [
  { id: 'male', label: 'Masculino' },
  { id: 'female', label: 'Feminino' }
];

const GOAL_OPTIONS = [
  { id: 'hypertrophy', label: 'Ganho de Massa', Icon: ShieldCheck, desc: 'Foco em construir músculo e força bruta' },
  { id: 'weight_loss', label: 'Queima de Gordura', Icon: Zap, desc: 'Foco em déficit calórico e definição' },
  { id: 'endurance', label: 'Condicionamento', Icon: Target, desc: 'Foco em resistência e fôlego' }
];

const RPG_CLASSES = [
  { id: 'warrior', male: 'Mercenário', female: 'Mercenária', icon: '⚔️', desc: 'Combate tático e versatilidade' },
  { id: 'assassin', male: 'Infiltrador', female: 'Sombra', icon: '🗡️', desc: 'Agilidade e letalidade' },
  { id: 'mage', male: 'Mago Street', female: 'Bruxa Street', icon: '🔮', desc: 'Manipula código como magia' },
  { id: 'paladin', male: 'Ciborgue', female: 'Ciborgue', icon: '🛡️', desc: 'Implantes pesados e blindagem' },
  { id: 'barbarian', male: 'Titã', female: 'Titã', icon: '🦍', desc: 'Força bruta imparável' },
  { id: 'ranger', male: 'Nômade', female: 'Nômade', icon: '🏹', desc: 'Resistência no deserto de asfalto' },
  { id: 'monk', male: 'Biohacker', female: 'Biohacker', icon: '🧬', desc: 'Modificação e controle corporal' },
  { id: 'necromancer', male: 'Ceifador', female: 'Ceifadora', icon: '💀', desc: 'Ressurgir após a falha' }
];

const PASSWORD_RULES = [
  { label: '8+ caracteres', test: (p) => p.length >= 8 },
  { label: 'Um número', test: (p) => /\d/.test(p) },
  { label: 'Símbolo (!@#$)', test: (p) => /[!@#$%^&*]/.test(p) },
  { label: 'Letra Maiúscula', test: (p) => /[A-Z]/.test(p) },
];

const INITIAL_METADATA = {
  username: '',
  birthdate: '',
  gender: '', 
  height: '', 
  weight: '', 
  goal: GOAL_OPTIONS[0].id,
  class: RPG_CLASSES[0].id 
};

const formatNumberInput = (value) => value.replace(/[^0-9.]/g, '');

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true); 
  const [step, setStep] = useState(STEPS.CREDENTIALS);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showCalendar, setShowCalendar] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [metadata, setMetadata] = useState(INITIAL_METADATA);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = PASSWORD_RULES.every(rule => rule.test(password));
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isStep2Valid = metadata.username && metadata.birthdate && metadata.gender && metadata.height && metadata.weight;

  const displayDate = metadata.birthdate ? metadata.birthdate.split('-').reverse().join('/') : 'Selecione';

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata.username,
            birthdate: metadata.birthdate,
            gender: metadata.gender,
            height: parseFloat(metadata.height),
            starting_weight: parseFloat(metadata.weight), 
            goal: metadata.goal,
            class: metadata.class, 
            level: 1,
            xp: 0,
            joined_at: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
      if (data?.user) setIsSignedUp(true);

    } catch (err) {
      let friendlyMsg = err.message;
      if (err.message === 'User already registered') {
        friendlyMsg = 'Este e-mail já está em uso por outro usuário.';
      }
      setErrorMsg(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  const resetAuth = () => { setIsSignedUp(false); setIsLogin(true); setStep(STEPS.CREDENTIALS); };

  return (
    <div className="min-h-screen bg-page text-main flex items-center justify-center p-4 font-cyber relative overflow-hidden pb-20">
      
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-card border-2 border-border p-8 rounded-3xl shadow-2xl relative z-10 transition-all duration-500">

        {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl mb-6 text-xs font-bold uppercase text-center flex items-center justify-center gap-2 animate-in fade-in">
                <X size={16} /> {errorMsg}
            </div>
        )}

        {isSignedUp ? (
          <div className="text-center space-y-6 animate-in zoom-in duration-300">
            <div className="inline-flex p-4 rounded-full bg-primary/20 text-primary mb-4 border border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <Mail size={48} />
            </div>
            <h2 className="font-sans font-black text-2xl tracking-[0.1em] bg-gradient-to-r from-primary via-[#4050ff] to-secondary bg-clip-text text-transparent uppercase">
              Cadastro Concluído
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Enviamos um link de verificação para <br/><span className="text-primary font-bold">{email}</span>. <br/><br/>
              Acesse sua caixa de entrada e confirme para liberar o acesso ao sistema.
            </p>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
              Atenção: O acesso será bloqueado até a confirmação!
            </div>
            <button onClick={resetAuth} className="w-full bg-input border-2 border-border text-main font-black p-4 rounded-xl hover:border-primary transition-all mt-4">
              RETORNAR AO LOGIN
            </button>
          </div>

        ) : isLogin ? (
          <div className="space-y-6 animate-in slide-in-from-left duration-300">
            
            {/* CABEÇALHO LOGIN - IDENTIDADE SOLO */}
            <div className="flex flex-col items-center text-center mb-10 mt-2">
              <div className="flex items-center gap-4">
                <h1 className="font-sans font-black text-4xl md:text-5xl tracking-[0.2em] bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent leading-none uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] hover:drop-shadow-[0_0_15px_rgba(255,0,255,0.6)] transition-all duration-500">
                  SOLO
                </h1>
                
                <div className="relative w-16 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary blur-md opacity-30 transition-opacity duration-500"></div>
                  <img 
                    src={logoSolo} 
                    alt="SOLO Logo" 
                    className="logo-respirando object-contain relative z-10 w-full h-full"
                  />
                </div>
              </div>
              
              <p className="font-mono text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.35em] mt-4 pl-2 border-l-2 border-slate-700/80">
                Where <span className="text-slate-100 font-bold">Discipline</span> Becomes{' '}
                <span className="text-secondary drop-shadow-[0_0_8px_rgba(var(--secondary),0.6)] font-extrabold">
                  Dopamine
                </span>
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-muted mb-1 block">E-mail de Acesso</label>
              <input type="email" className="w-full bg-input border-2 border-border py-4 px-4 rounded-xl focus:border-primary outline-none transition-all font-black" placeholder="cypher@solo.app" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="relative">
              <label className="text-[10px] font-black uppercase text-muted mb-1 block">Senha de Acesso</label>
              <input type={showPassword ? 'text' : 'password'} className="w-full bg-input border-2 border-border py-4 pr-12 pl-4 rounded-xl focus:border-primary outline-none transition-all font-black tracking-widest" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 translate-y-[2px] text-muted hover:text-primary transition-colors">
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            <button onClick={handleLogin} disabled={loading || !email || !password} className="w-full bg-primary text-black font-black p-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> VERIFICANDO...</>
              ) : (
                <><LogIn size={20}/> ACESSAR O SISTEMA</>
              )}
            </button>

            <div className="text-center pt-4">
              <button onClick={() => setIsLogin(false)} className="text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-colors">Novo no SOLO? Criar Conta</button>
            </div>
          </div>

        ) : (
          <div>
            {/* CABEÇALHO CADASTRO - COM CORES DO APP */}
            <div className="relative text-center mb-8">
              <button onClick={() => setIsLogin(true)} className="absolute left-0 top-0 p-2 -ml-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-white/5 z-20">
                <ArrowLeft size={24} />
              </button>

              <div className="relative w-16 h-10 mx-auto mb-3 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary blur-md opacity-30 transition-opacity duration-500"></div>
                <img src={logoSolo} alt="SOLO Logo" className="w-full h-full object-contain relative z-10" />
              </div>

              <h2 className="font-sans font-black text-2xl tracking-[0.15em] bg-gradient-to-r from-primary via-[#4050ff] to-secondary bg-clip-text text-transparent leading-none uppercase">
                CRIAR CONTA
              </h2>
              
              <div className="flex gap-2 w-full mt-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-gradient-to-r from-primary to-secondary shadow-[0_0_8px_rgba(var(--primary),0.8)]' : 'bg-border/50'}`} />
                ))}
              </div>
            </div>

            {/* ETAPA 1: CREDENCIAIS */}
            {step === STEPS.CREDENTIALS && (
              <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted mb-1 block flex items-center justify-between">
                    E-mail
                    {email.length > 0 && !isEmailValid && <span className="text-red-500 text-[9px]">Formato Inválido</span>}
                  </label>
                  <input type="email" className={`w-full bg-input border-2 py-4 px-4 rounded-xl outline-none transition-all ${email.length > 0 && !isEmailValid ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-primary'}`} placeholder="ex: cypher@solo.app" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-muted mb-1 block">Senha</label>
                  <input type={showPassword ? 'text' : 'password'} className="w-full bg-input border-2 border-border py-4 pr-12 pl-4 rounded-xl focus:border-primary outline-none transition-all" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 translate-y-[2px] text-muted hover:text-primary">
                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-muted mb-1 flex items-center justify-between">
                    Confirmar Senha
                    {confirmPassword.length > 0 && (
                      <span className={passwordsMatch ? 'text-green-500' : 'text-red-500'}>
                        {passwordsMatch ? 'Batem ✔' : 'Diferentes ✖'}
                      </span>
                    )}
                  </label>
                  <input type={showConfirmPassword ? 'text' : 'password'} className={`w-full bg-input border-2 py-4 pr-12 pl-4 rounded-xl outline-none transition-all ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-500/50 focus:border-green-500' : 'border-red-500/50 focus:border-red-500') : 'border-border focus:border-primary'}`} placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 translate-y-[2px] text-muted hover:text-primary">
                    {showConfirmPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-black/20 p-3 rounded-xl border border-border/50">
                  {PASSWORD_RULES.map((rule, i) => {
                    const isValid = rule.test(password);
                    return (
                      <div key={i} className={`flex items-center gap-2 text-[9px] font-bold uppercase transition-colors ${isValid ? 'text-green-500' : 'text-muted'}`}>
                        {isValid ? <Check size={12}/> : <X size={12}/>} {rule.label}
                      </div>
                    );
                  })}
                </div>

                <button disabled={!isEmailValid || !isPasswordValid || !passwordsMatch} onClick={nextStep} className="w-full bg-primary text-black font-black p-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                  PRÓXIMA FASE <ChevronRight size={20}/>
                </button>
              </div>
            )}

            {/* ETAPA 2: IDENTIDADE E BIOMETRIA */}
            {step === STEPS.BIOMETRICS && (
              <div className="space-y-4 animate-in slide-in-from-right duration-300 relative">
                
                <div>
                  <label className="text-[10px] font-black uppercase text-muted mb-1 block">Username (Codinome)</label>
                  <div className="flex items-center w-full bg-input border-2 border-border rounded-xl focus-within:border-primary transition-all px-4 py-4">
                    <User className="text-muted shrink-0 mr-3" size={20}/>
                    <input type="text" className="flex-1 bg-transparent outline-none uppercase font-black w-full" placeholder="CYPHER_01" value={metadata.username} onChange={(e) => setMetadata({...metadata, username: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Data de Nascimento</label>
                    <button onClick={() => setShowCalendar(true)} className="w-full bg-input border-2 border-border py-4 px-4 rounded-xl flex items-center justify-between text-left focus:border-primary outline-none transition-all hover:border-primary/50">
                      <span className={`text-xs font-black uppercase ${metadata.birthdate ? 'text-main' : 'text-muted'}`}>{displayDate}</span>
                      <CalendarIcon size={16} className="text-muted" />
                    </button>
                    {showCalendar && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setShowCalendar(false)}></div>
                        <div className="absolute top-full left-0 mt-2 z-[101]">
                          <CyberCalendar selectedDate={metadata.birthdate} onSelect={(date) => setMetadata({...metadata, birthdate: date})} onClose={() => setShowCalendar(false)} />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Sexo Biológico</label>
                    <select className="w-full bg-input border-2 border-border py-4 px-4 rounded-xl focus:border-primary outline-none transition-all text-xs font-black uppercase appearance-none" value={metadata.gender} onChange={(e) => setMetadata({...metadata, gender: e.target.value})}>
                      <option value="" disabled>Selecione</option>
                      {GENDER_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Altura (cm)</label>
                    <div className="flex items-center w-full bg-input border-2 border-border rounded-xl focus-within:border-primary transition-all px-4 py-4">
                      <Ruler className="text-muted shrink-0 mr-3" size={20}/>
                      <input type="text" inputMode="decimal" className="flex-1 bg-transparent outline-none font-black w-full" placeholder="175" value={metadata.height} onChange={(e) => setMetadata({...metadata, height: formatNumberInput(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Peso (kg)</label>
                    <div className="flex items-center w-full bg-input border-2 border-border rounded-xl focus-within:border-primary transition-all px-4 py-4">
                      <Scale className="text-muted shrink-0 mr-3" size={20}/>
                      <input type="text" inputMode="decimal" className="flex-1 bg-transparent outline-none font-black w-full" placeholder="70.5" value={metadata.weight} onChange={(e) => setMetadata({...metadata, weight: formatNumberInput(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 relative z-0">
                  <button onClick={prevStep} className="flex-1 border-2 border-border py-4 rounded-xl font-black uppercase text-xs hover:bg-white/5 transition-all">Voltar</button>
                  <button disabled={!isStep2Valid} onClick={nextStep} className="flex-[2] bg-primary text-black font-black py-4 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-30">
                    PROSSEGUIR
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: OBJETIVO (META) */}
            {step === STEPS.GOAL && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted mb-3 block text-center">Defina sua Missão Principal</label>
                  <div className="grid grid-cols-1 gap-3">
                    {GOAL_OPTIONS.map((opt) => {
                      const isSelected = metadata.goal === opt.id;
                      const IconComponent = opt.Icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setMetadata({...metadata, goal: opt.id})}
                          className={`p-4 rounded-xl border-2 flex flex-col items-start transition-all ${isSelected ? 'border-primary bg-primary/10 text-primary scale-[1.01]' : 'border-border text-muted hover:border-primary/50'}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-black uppercase text-sm flex items-center gap-3"><IconComponent size={20}/> {opt.label}</span>
                            {isSelected && <Check size={18}/>}
                          </div>
                          <span className="text-[10px] mt-2 opacity-70 ml-8 text-left">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={prevStep} className="flex-1 border-2 border-border py-4 rounded-xl font-black uppercase text-xs hover:bg-white/5">Voltar</button>
                  <button onClick={nextStep} className="flex-[2] bg-primary text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-[1.05] transition-all">
                    ESCOLHER CLASSE
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 4: A ESCOLHA DO AVATAR */}
            {step === STEPS.CLASS && (
              <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted mb-3 block text-center">Selecione sua Classe de Combate</label>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-2 scrollbar-hide py-1">
                    {RPG_CLASSES.map((cls) => {
                      const displayName = metadata.gender === 'female' ? cls.female : cls.male;
                      const isSelected = metadata.class === cls.id;
                      return (
                        <button
                          key={cls.id}
                          onClick={() => setMetadata({...metadata, class: cls.id})}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all duration-300 ${isSelected ? 'border-primary bg-primary/10 text-primary scale-[1.05] shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'border-border text-muted hover:border-primary/50 hover:bg-white/5'}`}
                        >
                          <span className="text-3xl mb-2">{cls.icon}</span>
                          <span className="font-black uppercase text-xs tracking-wide">{displayName}</span>
                          <span className="text-[9px] font-bold mt-1.5 opacity-70 leading-tight">{cls.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={prevStep} className="flex-1 border-2 border-border py-4 rounded-xl font-black uppercase text-xs hover:bg-white/5">Voltar</button>
                  <button onClick={handleSignUp} disabled={loading} className="flex-[2] bg-primary text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-[1.05] transition-all flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> CRIANDO...</> : 'FINALIZAR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthView;