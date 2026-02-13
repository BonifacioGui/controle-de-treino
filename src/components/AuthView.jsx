import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Zap, ShieldCheck, User, Target, ChevronRight, Check, X, Eye, EyeOff, LogIn, Scale, Ruler, Calendar as CalendarIcon } from 'lucide-react';
import CyberCalendar from './CyberCalendar'; // 🔥 Importando o seu calendário customizado!

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 🔥 Estado para controlar a visibilidade do calendário
  const [showCalendar, setShowCalendar] = useState(false);

  // Form Data Expandido
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [metadata, setMetadata] = useState({
    username: '',
    birthdate: '',
    gender: '', 
    height: '', 
    weight: '', 
    goal: 'hypertrophy',
    class: 'warrior'
  });

  const passwordRules = [
    { label: '8+ caracteres', test: (p) => p.length >= 8 },
    { label: 'Um número', test: (p) => /\d/.test(p) },
    { label: 'Símbolo (!@#$)', test: (p) => /[!@#$%^&*]/.test(p) },
    { label: 'Letra Maiúscula', test: (p) => /[A-Z]/.test(p) },
  ];
  const isPasswordValid = passwordRules.every(rule => rule.test(password));

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: metadata.username,
          birthdate: metadata.birthdate,
          gender: metadata.gender,
          height: metadata.height,
          starting_weight: metadata.weight,
          goal: metadata.goal,
          class: metadata.class,
          level: 1,
          xp: 0
        }
      }
    });

    if (error) {
        setErrorMsg(error.message);
    } else {
        alert('Recrutamento finalizado! Conta criada com sucesso.');
        setIsLogin(true);
    }
    setLoading(false);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const isStep2Valid = metadata.username && metadata.birthdate && metadata.gender && metadata.height && metadata.weight;

  // Formata a data de YYYY-MM-DD para DD/MM/YYYY só para exibição
  const displayDate = metadata.birthdate ? metadata.birthdate.split('-').reverse().join('/') : 'Selecione';

  return (
    <div className="min-h-screen bg-page text-main flex items-center justify-center p-4 font-cyber relative overflow-hidden pb-20">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-card border-2 border-border p-8 rounded-3xl shadow-2xl relative z-10 transition-all duration-500">

        {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl mb-6 text-xs font-bold uppercase text-center flex items-center justify-center gap-2 animate-in fade-in">
                <X size={16} /> {errorMsg}
            </div>
        )}

        {isLogin ? (
          // --- TELA DE LOGIN ---
          <div className="space-y-6 animate-in slide-in-from-left duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-primary/20 text-primary mb-4 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                <Zap size={32} fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Projeto <span className="text-primary">Bomba</span></h2>
              <p className="text-muted text-xs uppercase tracking-widest mt-2">Sistema de Identificação</p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-muted mb-1 block">Codinome (E-mail)</label>
              <input type="email" className="w-full bg-input border-2 border-border p-4 rounded-xl focus:border-primary outline-none transition-all font-black" placeholder="soldado@missao.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="relative">
              <label className="text-[10px] font-black uppercase text-muted mb-1 block">Chave de Acesso</label>
              <input type={showPassword ? 'text' : 'password'} className="w-full bg-input border-2 border-border p-4 rounded-xl focus:border-primary outline-none transition-all font-black tracking-widest" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-10 text-muted hover:text-primary">
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            <button onClick={handleLogin} disabled={loading || !email || !password} className="w-full bg-primary text-black font-black p-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'VERIFICANDO...' : 'AUTENTICAR ACESSO'} <LogIn size={20}/>
            </button>

            <div className="text-center pt-4">
              <button onClick={() => setIsLogin(false)} className="text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-colors">Novo Soldado? Iniciar Cadastro</button>
            </div>
          </div>
        ) : (
          // --- CADASTRO MULTISTEP ---
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-primary/20 text-primary mb-4 border border-primary/30">
                <Zap size={32} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Briefing de Recrutamento</h2>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mt-2">Etapa {step} de 3</p>
            </div>

            {/* ETAPA 1: CREDENCIAIS */}
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted mb-1 block">E-mail Militar</label>
                  <input type="email" className="w-full bg-input border-2 border-border p-4 rounded-xl focus:border-primary outline-none transition-all" placeholder="ex: soldado@missao.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-muted mb-1 block">Código de Acesso (Senha)</label>
                  <input type={showPassword ? 'text' : 'password'} className="w-full bg-input border-2 border-border p-4 rounded-xl focus:border-primary outline-none transition-all" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-10 text-muted hover:text-primary">
                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-black/20 p-3 rounded-xl border border-border/50">
                  {passwordRules.map((rule, i) => {
                    const isValid = rule.test(password);
                    return (
                      <div key={i} className={`flex items-center gap-2 text-[9px] font-bold uppercase ${isValid ? 'text-green-500' : 'text-muted'}`}>
                        {isValid ? <Check size={12}/> : <X size={12}/>} {rule.label}
                      </div>
                    );
                  })}
                </div>

                <button disabled={!email || !isPasswordValid} onClick={nextStep} className="w-full bg-primary text-black font-black p-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                  PRÓXIMA FASE <ChevronRight size={20}/>
                </button>

                <div className="text-center pt-4">
                    <button onClick={() => setIsLogin(true)} className="text-[10px] font-black text-muted hover:text-primary uppercase tracking-widest transition-colors">Já tem acesso? Autenticar</button>
                </div>
              </div>
            )}

            {/* ETAPA 2: IDENTIDADE E BIOMETRIA */}
            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right duration-300 relative">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted mb-1 block">Codinome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-muted" size={20}/>
                    <input type="text" className="w-full bg-input border-2 border-border p-4 pl-12 rounded-xl focus:border-primary outline-none transition-all uppercase font-black" placeholder="SOLDADO_01" value={metadata.username} onChange={(e) => setMetadata({...metadata, username: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 🔥 BOTÃO DO CYBER CALENDAR AQUI 🔥 */}
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Nascimento</label>
                    <button 
                      onClick={() => setShowCalendar(true)}
                      className="w-full bg-input border-2 border-border p-4 rounded-xl flex items-center justify-between text-left focus:border-primary outline-none transition-all hover:border-primary/50"
                    >
                      <span className={`text-xs font-black uppercase ${metadata.birthdate ? 'text-main' : 'text-muted'}`}>
                        {displayDate}
                      </span>
                      <CalendarIcon size={16} className="text-muted" />
                    </button>

                    {/* RENDERIZAÇÃO DO CALENDÁRIO */}
                    {showCalendar && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setShowCalendar(false)}></div>
                        <div className="absolute top-full left-0 mt-2 z-[101]">
                          <CyberCalendar 
                            selectedDate={metadata.birthdate} 
                            onSelect={(date) => setMetadata({...metadata, birthdate: date})} 
                            onClose={() => setShowCalendar(false)} 
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Sexo Biológico</label>
                    <select className="w-full bg-input border-2 border-border p-4 rounded-xl focus:border-primary outline-none transition-all text-xs font-black uppercase appearance-none" value={metadata.gender} onChange={(e) => setMetadata({...metadata, gender: e.target.value})}>
                      <option value="" disabled>Selecione</option>
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Altura (cm)</label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-4 text-muted" size={16}/>
                      <input type="number" className="w-full bg-input border-2 border-border p-4 pl-10 rounded-xl focus:border-primary outline-none transition-all font-black" placeholder="175" value={metadata.height} onChange={(e) => setMetadata({...metadata, height: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-muted mb-1 block">Peso Atual (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-4 text-muted" size={16}/>
                      <input type="number" step="0.1" className="w-full bg-input border-2 border-border p-4 pl-10 rounded-xl focus:border-primary outline-none transition-all font-black" placeholder="70.5" value={metadata.weight} onChange={(e) => setMetadata({...metadata, weight: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 relative z-0">
                  <button onClick={prevStep} className="flex-1 border-2 border-border p-4 rounded-xl font-black uppercase text-xs hover:bg-white/5 transition-all">Voltar</button>
                  <button disabled={!isStep2Valid} onClick={nextStep} className="flex-[2] bg-primary text-black font-black p-4 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-30">
                    PROSSEGUIR
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: CLASSE E OBJETIVO */}
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted mb-3 block text-center">Defina sua Missão Principal</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'hypertrophy', label: 'Ganho de Massa (Tank)', icon: <ShieldCheck size={18}/>, desc: 'Foco em volume e força' },
                      { id: 'weight_loss', label: 'Queima de Gordura (Assassin)', icon: <Zap size={18}/>, desc: 'Foco em déficit calórico' },
                      { id: 'endurance', label: 'Resistência (Warrior)', icon: <Target size={18}/>, desc: 'Foco em condicionamento' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setMetadata({...metadata, goal: opt.id})}
                        className={`p-4 rounded-xl border-2 flex flex-col items-start transition-all ${metadata.goal === opt.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:border-primary/50'}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-black uppercase text-xs flex items-center gap-3">{opt.icon} {opt.label}</span>
                          {metadata.goal === opt.id && <Check size={16}/>}
                        </div>
                        <span className="text-[9px] mt-1 opacity-70 ml-8">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={prevStep} className="flex-1 border-2 border-border p-4 rounded-xl font-black uppercase text-xs">Voltar</button>
                  <button onClick={handleSignUp} disabled={loading} className="flex-[2] bg-primary text-black font-black p-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-[1.05] transition-all">
                    {loading ? 'PROCESSANDO...' : 'FINALIZAR'}
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