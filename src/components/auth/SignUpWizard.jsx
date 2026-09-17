import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Zap, ShieldCheck, User, Target, ChevronRight, Check, X, Eye, EyeOff, Scale, Ruler, Calendar as CalendarIcon, Loader2, ArrowLeft, Dumbbell } from 'lucide-react';
import CyberCalendar from '../dashboard/CyberCalendar'; 
import EmailConfirmationPanel from './EmailConfirmationPanel';
import { getEmailConfirmationRedirectUrl } from '../../config/appConfig';
import {
  MAX_PROFILE_GOALS,
  PROFILE_CLASSES,
  PROFILE_GOALS,
  toCompatibleProfileGoals,
  toggleGoalSelection,
} from '../../utils/profileMetadata';

const STEPS = { CREDENTIALS: 1, BIOMETRICS: 2, GOAL: 3, CLASS: 4 };
const TOTAL_STEPS = Object.keys(STEPS).length;

const GENDER_OPTIONS = [
  { id: 'male', label: 'Masculino' },
  { id: 'female', label: 'Feminino' }
];

const GOAL_ICONS = {
  hypertrophy: ShieldCheck,
  weight_loss: Zap,
  strength: Dumbbell,
  endurance: Target,
};

const PASSWORD_RULES = [
  { label: '8+ caracteres', test: (p) => p.length >= 8 },
  { label: 'Um número', test: (p) => /\d/.test(p) },
  { label: 'Símbolo (!@#$)', test: (p) => /[!@#$%^&*]/.test(p) },
  { label: 'Letra Maiúscula', test: (p) => /[A-Z]/.test(p) },
];

const INITIAL_METADATA = { username: '', birthdate: '', gender: '', height: '', weight: '', goals: [PROFILE_GOALS[0].id], class: PROFILE_CLASSES[0].id };
const formatNumberInput = (value) => value.replace(/[^0-9.]/g, '');

const SignUpWizard = ({ onSwitch }) => {
  const [step, setStep] = useState(STEPS.CREDENTIALS);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [metadata, setMetadata] = useState(INITIAL_METADATA);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = PASSWORD_RULES.every(rule => rule.test(password));
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isStep2Valid = metadata.username && metadata.birthdate && metadata.gender && metadata.height && metadata.weight;
  const isGoalStepValid = metadata.goals.length > 0 && metadata.goals.length <= MAX_PROFILE_GOALS;

  const displayDate = metadata.birthdate ? metadata.birthdate.split('-').reverse().join('/') : 'Selecione';

  const handleSignUp = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: getEmailConfirmationRedirectUrl(),
          data: {
            username: metadata.username, birthdate: metadata.birthdate, gender: metadata.gender,
            height: parseFloat(metadata.height), starting_weight: parseFloat(metadata.weight), 
            ...toCompatibleProfileGoals(metadata.goals), class: metadata.class, level: 1, xp: 0, joined_at: new Date().toISOString()
          }
        }
      });
      if (error) throw error;
      if (data?.user) setIsSignedUp(true);
    } catch (err) {
      setErrorMsg(err?.message === 'User already registered'
        ? 'Este e-mail já está em uso por outro usuário.'
        : 'Não foi possível criar sua conta agora. Confira os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (isSignedUp) {
    return <EmailConfirmationPanel email={email} onBack={onSwitch} />;
  }

  return (
    <div>
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-[11px] font-black uppercase text-center flex items-center justify-center gap-2 animate-in fade-in shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <X size={16} className="shrink-0" /> 
            <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      {/* CABEÇALHO CADASTRO */}
      <div className="relative text-center mb-8">
        <button onClick={onSwitch} className="absolute left-0 top-1 p-2 -ml-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-white/5 z-20">
          <ArrowLeft size={22} />
        </button>

        <h2 className="font-sans font-black text-xl sm:text-2xl tracking-[0.2em] bg-gradient-to-r from-primary via-[#4050ff] to-secondary bg-clip-text text-transparent leading-none uppercase drop-shadow-[0_0_5px_rgba(0,243,255,0.3)]">
          CRIAR CONTA
        </h2>
        
        <div className="flex gap-2 w-full mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-gradient-to-r from-primary to-secondary shadow-[0_0_8px_rgba(0,243,255,0.6)]' : 'bg-border/40'}`} />
          ))}
        </div>
      </div>

      {step === STEPS.CREDENTIALS && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          {/* Inputs de Email, Senha e Regras (mantidos iguais ao seu código original) */}
          <div className="group">
            <label className="text-[10px] font-black uppercase text-muted mb-1.5 block flex items-center justify-between group-focus-within:text-primary transition-colors">
              E-mail {email.length > 0 && !isEmailValid && <span className="text-red-500 text-[9px] tracking-widest animate-pulse">Inválido</span>}
            </label>
            <input type="email" className={`w-full bg-input border-2 py-4 px-4 rounded-xl outline-none transition-all font-black text-sm placeholder:text-muted/40 ${email.length > 0 && !isEmailValid ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-border focus:border-primary focus:shadow-[0_0_15px_rgba(0,243,255,0.15)]'}`} placeholder="cypher@solo.app" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="relative group">
            <label className="text-[10px] font-black uppercase text-muted mb-1.5 block group-focus-within:text-primary transition-colors">Senha</label>
            <input type={showPassword ? 'text' : 'password'} className="w-full bg-input border-2 border-border py-4 pr-12 pl-4 rounded-xl focus:border-primary focus:shadow-[0_0_15px_rgba(0,243,255,0.15)] outline-none transition-all font-black tracking-widest placeholder:tracking-normal placeholder:text-muted/40 text-sm" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 translate-y-[4px] text-muted hover:text-primary p-1"><Eye size={18}/></button>
          </div>

          <div className="relative group">
            <label className="text-[10px] font-black uppercase text-muted mb-1.5 flex items-center justify-between group-focus-within:text-primary transition-colors">
              Confirmar Senha {confirmPassword.length > 0 && (<span className={`tracking-widest ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>{passwordsMatch ? 'MATCH ✔' : 'ERRO ✖'}</span>)}
            </label>
            <input type={showConfirmPassword ? 'text' : 'password'} className={`w-full bg-input border-2 py-4 pr-12 pl-4 rounded-xl outline-none transition-all font-black tracking-widest placeholder:tracking-normal placeholder:text-muted/40 text-sm ${confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-500/50 focus:border-green-500 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)]') : 'border-border focus:border-primary focus:shadow-[0_0_15px_rgba(0,243,255,0.15)]'}`} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 translate-y-[4px] text-muted hover:text-primary p-1"><Eye size={18}/></button>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-input/70 p-3.5 rounded-xl border border-border/40 shadow-inner">
            {PASSWORD_RULES.map((rule, i) => (
              <div key={i} className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-wider transition-colors ${rule.test(password) ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'text-muted/70'}`}>
                {rule.test(password) ? <Check size={12}/> : <X size={12}/>} {rule.label}
              </div>
            ))}
          </div>

          <button disabled={!isEmailValid || !isPasswordValid || !passwordsMatch} onClick={nextStep} className="w-full mt-4 bg-primary text-on-primary font-black py-4 rounded-xl shadow-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-40 uppercase text-sm">Próxima Fase <ChevronRight size={18}/></button>
        </div>
      )}

      {step === STEPS.BIOMETRICS && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300 relative">
          <div className="group">
            <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Codinome</label>
            <div className="flex items-center w-full bg-input border-2 border-border rounded-xl focus-within:border-primary px-4 py-3.5"><User className="text-muted mr-3" size={18}/><input type="text" maxLength={24} className="flex-1 bg-transparent outline-none uppercase font-black w-full text-sm" placeholder="CYPHER_01" value={metadata.username} onChange={(e) => setMetadata({...metadata, username: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Nascimento</label>
              <button onClick={() => setShowCalendar(true)} className="w-full bg-input border-2 border-border py-4 px-3 rounded-xl flex items-center justify-between"><span className="text-[11px] sm:text-xs font-black uppercase">{displayDate}</span><CalendarIcon size={16} className="text-muted" /></button>
              {showCalendar && <><div className="fixed inset-0 z-[100]" onClick={() => setShowCalendar(false)}></div><div className="absolute top-full left-0 mt-2 z-[101]"><CyberCalendar selectedDate={metadata.birthdate} onSelect={(date) => setMetadata({...metadata, birthdate: date})} onClose={() => setShowCalendar(false)} /></div></>}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Sexo</label>
              <select className="w-full bg-input border-2 border-border py-4 px-3 rounded-xl text-[11px] sm:text-xs font-black uppercase appearance-none" value={metadata.gender} onChange={(e) => setMetadata({...metadata, gender: e.target.value})}><option value="" disabled>Selecione</option>{GENDER_OPTIONS.map(opt => (<option key={opt.id} value={opt.id}>{opt.label}</option>))}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Altura</label><div className="flex items-center w-full bg-input border-2 border-border rounded-xl px-3 py-3.5"><Ruler className="text-muted mr-2" size={16}/><input type="text" className="flex-1 bg-transparent outline-none font-black text-sm" placeholder="175" value={metadata.height} onChange={(e) => setMetadata({...metadata, height: formatNumberInput(e.target.value)})} /></div></div>
            <div><label className="text-[10px] font-black uppercase text-muted mb-1.5 block">Peso</label><div className="flex items-center w-full bg-input border-2 border-border rounded-xl px-3 py-3.5"><Scale className="text-muted mr-2" size={16}/><input type="text" className="flex-1 bg-transparent outline-none font-black text-sm" placeholder="70" value={metadata.weight} onChange={(e) => setMetadata({...metadata, weight: formatNumberInput(e.target.value)})} /></div></div>
          </div>
          <div className="flex gap-2 pt-4 relative z-0"><button onClick={prevStep} className="flex-1 border-2 border-border py-4 rounded-xl font-black uppercase text-xs text-muted hover:text-main">Voltar</button><button disabled={!isStep2Valid} onClick={nextStep} className="flex-[2] bg-primary text-on-primary font-black py-4 rounded-xl disabled:opacity-40 uppercase text-sm">Prosseguir</button></div>
        </div>
      )}

      {step === STEPS.GOAL && (
        <div className="space-y-5 animate-in slide-in-from-right duration-300">
          <div>
            <div className="mb-4 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Defina seus objetivos</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">Escolha um ou dois objetivos. <strong className="text-main">{metadata.goals.length}/{MAX_PROFILE_GOALS} selecionados</strong></p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {PROFILE_GOALS.map((opt) => {
                const Icon = GOAL_ICONS[opt.id];
                const selected = metadata.goals.includes(opt.id);
                const selectedIndex = metadata.goals.indexOf(opt.id);
                const unavailable = !selected && metadata.goals.length >= MAX_PROFILE_GOALS;
                return (
                <button type="button" key={opt.id} aria-pressed={selected} disabled={unavailable} onClick={() => setMetadata({...metadata, goals: toggleGoalSelection(metadata.goals, opt.id)})} className={`flex min-h-20 flex-col items-start rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-primary bg-primary/10 text-primary shadow-[0_0_14px_rgba(var(--primary),0.12)]' : 'border-border text-muted'}`}>
                  <span className="flex w-full items-center justify-between gap-3"><span className="flex items-center gap-3 text-sm font-black uppercase"><Icon aria-hidden="true" size={20}/> {opt.label}</span>{selected && <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[9px] font-black uppercase text-on-primary"><Check aria-hidden="true" size={12}/>{selectedIndex === 0 ? 'Foco' : '2º'}</span>}</span>
                  <span className="ml-8 mt-2 text-xs leading-relaxed opacity-80">{opt.description}</span>
                </button>
              );})}
            </div>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">O primeiro objetivo selecionado define o foco atual. Você pode mudar essa ordem no perfil.</p>
          </div>
          <div className="flex gap-2 mt-6"><button type="button" onClick={prevStep} className="flex-1 border-2 border-border py-4 rounded-xl font-black uppercase text-xs text-muted">Voltar</button><button type="button" disabled={!isGoalStepValid} onClick={nextStep} className="flex-[2] bg-primary text-on-primary font-black py-4 rounded-xl uppercase text-sm disabled:opacity-40">Escolher Classe</button></div>
        </div>
      )}

      {step === STEPS.CLASS && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div>
            <label className="text-[11px] font-black uppercase text-primary mb-4 block text-center tracking-[0.2em]">Selecione sua Classe</label>
            <p className="mb-4 rounded-xl border border-border bg-input/60 p-3 text-center text-xs leading-relaxed text-muted"><strong className="text-main">Classe é um arquétipo visual.</strong> Ela não altera treino, exercícios, missões, atributos, recompensas ou XP.</p>
            <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-2 scrollbar-hide py-1">
              {PROFILE_CLASSES.map(cls => (
                <button key={cls.id} onClick={() => setMetadata({...metadata, class: cls.id})} className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${metadata.class === cls.id ? 'border-primary bg-primary/10 text-primary scale-[1.03]' : 'border-border text-muted'}`}>
                  <span className={`text-4xl mb-2 ${metadata.class === cls.id ? '' : 'grayscale'}`}>{cls.icon}</span>
                  <span className="font-black uppercase text-[10px]">{metadata.gender === 'female' ? cls.female : cls.male}</span>
                  <span className="mt-2 text-center text-[10px] leading-relaxed opacity-70">{cls.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-4"><button onClick={prevStep} className="flex-1 border-2 border-border py-4 rounded-xl font-black uppercase text-xs text-muted">Voltar</button><button onClick={handleSignUp} disabled={loading} className="flex-[2] bg-primary text-on-primary font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-sm">{loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar'}</button></div>
        </div>
      )}
    </div>
  );
};

export default SignUpWizard;
