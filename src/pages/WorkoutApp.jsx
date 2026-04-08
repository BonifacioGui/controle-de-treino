import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Flame, Sun, Moon, Wifi, WifiOff, LogOut 
} from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout'; 
import logoSolo from '../assets/logo-solo.svg';

// Componentes
import WorkoutView from '../components/WorkoutView';
import HistoryView from '../components/HistoryView';
import ManageView from '../components/ManageView';
import StatsView from '../components/StatsView';
import CyberNav from '../components/CyberNav';
import Importer from '../components/Importer';
import AuthView from '../components/AuthView';
import ProfileView from '../components/ProfileView'; 
import RestTimer from '../components/RestTimer'; 
import { supabase } from '../services/supabaseClient';

// Celebrações
import WorkoutComplete from '../components/WorkoutComplete'; 
import LevelUpModal from '../components/LevelUpModal';

const WorkoutApp = () => { 
  const [session, setSession] = useState(null);
  const { state, setters, actions, stats } = useWorkout();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('driver');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  // 🔥 ESTADOS DE FLUXO DE CELEBRAÇÃO
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [restTimerConfig, setRestTimerConfig] = useState({ isOpen: false, duration: 60 });
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) actions.fetchCloudData();
  }, [session?.user?.id]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => { 
      window.removeEventListener('online', handleStatus); 
      window.removeEventListener('offline', handleStatus); 
    };
  }, []);

  useEffect(() => {
    setIsAnyModalOpen(showCelebration || showLevelUp || isMenuOpen);
  }, [showCelebration, showLevelUp, isMenuOpen]);


  // ==========================================
  // 🚀 A LÓGICA DE FINALIZAÇÃO BLINDADA E DIRETA
  // ==========================================

  const handleFinishWorkoutWrapper = async () => {
    // 1. Dispara o final do treino e pega a resposta imediata se upou de nível
    const upouDeNivel = await actions.finishWorkout();
    
    console.log("O HOOK DISSE QUE UPOU?:", upouDeNivel);

    // 2. Orquestra a UI com base na resposta
    if (upouDeNivel) {
      setShowLevelUp(true); // UPOU DE NÍVEL: Mostra a glória!
    } else {
      setShowCelebration(true); // NÃO UPOU: Mostra os stats direto.
    }
  };

  // Se a pessoa upou de nível, quando ela fechar o modal, abre o Relatório de Stats na sequência
  const handleLevelUpClose = () => {
    setShowLevelUp(false);
    setTimeout(() => setShowCelebration(true), 400); 
  };

  // ==========================================


  const getFlameStyle = (streak) => {
    if (streak >= 30) return { color: "text-cyan-500", shadow: "shadow-[0_0_20px_rgba(34,211,238,0.4)] border-cyan-500/50 bg-cyan-500/10", iconClass: "fill-cyan-500 animate-pulse" };
    if (streak >= 7) return { color: "text-red-500", shadow: "shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/50 bg-red-500/10", iconClass: "fill-red-500 animate-pulse" };
    if (streak > 0) return { color: "text-orange-500", shadow: "shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-500/50 bg-orange-500/10", iconClass: "fill-orange-500 animate-pulse" };
    return { color: "text-muted", shadow: "border-border bg-card/50", iconClass: "text-muted" };
  };

  const flameStyle = getFlameStyle(stats?.streak || 0);

  if (!session) return <AuthView />;

  return (
    <div className="min-h-screen bg-page text-main font-cyber pb-32 cyber-grid transition-colors duration-500 relative overflow-x-hidden">
      
      {/* HEADER TÁTICO */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border bg-page/80 px-4 py-3 flex items-center justify-between shadow-lg mb-6 h-20">
        <div className="flex flex-col select-none sm:border-l-2 border-border sm:pl-4 py-1.5">
          <div className="flex items-center gap-3 relative group">
            <h1 className="hidden sm:block font-sans font-black text-3xl md:text-4xl tracking-[0.2em] bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent leading-none uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] hover:drop-shadow-[0_0_15px_rgba(255,0,255,0.6)] transition-all duration-500">
              SOLO
            </h1>
            <div className="relative w-15 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary blur-md opacity-20"></div>
              <img src={logoSolo} alt="SOLO Logo" className="logo-respirando object-contain relative z-10" />
            </div>
          </div>
          <p className="hidden sm:block font-mono text-[9px] md:text-[10px] text-muted uppercase tracking-[0.35em] mt-2 pl-1.5 border-l-2 border-border">
            Where <span className="text-main dark:text-slate-100 font-bold">Discipline</span> Becomes{' '}
            <span className="text-secondary drop-shadow-[0_0_8px_rgba(var(--secondary),0.6)] font-extrabold">Dopamine</span>
          </p>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className={`flex flex-col items-center justify-center px-4 h-14 rounded-2xl border transition-all duration-500 min-w-[80px] ${flameStyle.shadow} relative overflow-hidden`}>
              <div className="relative mb-0.5 z-10">
                  <Flame size={38} className={`${flameStyle.iconClass}`} />
              </div>
              <div className="flex items-center justify-center gap-1 z-10">
                  <span className={`text-[8px] font-bold uppercase tracking-widest opacity-80 ${flameStyle.color}`}>
                      STREAK {stats?.streak || 0}
                  </span>
              </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className={`hidden sm:flex text-[10px] font-black opacity-50 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
             {isOnline ? <Wifi size={16}/> : <WifiOff size={16}/>}
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-primary transition-all shadow-sm">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* ABAS DO TREINO */}
      {state.view === 'workout' && state.workoutData && (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-4 px-4">
          {Object.keys(state.workoutData).map((day) => {
            const wData = state.workoutData[day];
            const isActive = state.activeDay === day;
            return (
              <button key={day} onClick={() => setters.setActiveDay(day)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border min-w-[140px] shrink-0 overflow-hidden group
                  ${isActive ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-[1.02]' : 'bg-card text-main dark:text-white border-border hover:border-primary/40'}`}>
                {isActive && <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 blur-2xl rounded-full -mr-8 -mt-8"></div>}
                <span className={`text-3xl font-black tracking-tighter ${isActive ? 'text-black' : 'text-main dark:text-white'}`}>{day}</span>
                <div className={`flex flex-col items-start text-left border-l-2 pl-2 ${isActive ? 'border-black/30' : 'border-border'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 truncate max-w-[80px]">{wData?.title || "TREINO"}</span>
                  <span className={`text-[7px] font-bold uppercase tracking-widest truncate max-w-[80px] ${isActive ? 'text-black/70' : 'text-muted'}`}>{wData?.focus || "SISTEMA"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ROTEADOR DE VIEWS */}
      <div className="relative z-10 min-h-[50vh] px-4">
        {state.view === 'workout' && state.workoutData && (
          state.workoutData[state.activeDay] ? (
            <WorkoutView {...state} actions={actions} setActiveDay={setters.setActiveDay} setSelectedDate={actions.handleDateChange} 
              setSessionNote={setters.setSessionNote} finishWorkout={handleFinishWorkoutWrapper} updateSetData={actions.updateSetData}
              updateSessionSets={actions.updateSessionSets} toggleCheck={actions.toggleCheck} setRestTimerConfig={setRestTimerConfig} />
          ) : (
            <div className="text-center text-red-500 p-10 border border-red-500 rounded-xl bg-red-500/10 uppercase font-black">
               <p>DADOS INCONSISTENTES</p>
               <p className="text-[10px] mt-2 opacity-70">Dia não encontrado. Reinicie o sistema em Gerenciar.</p>
            </div>
          )
        )}
        
        {state.view === 'manage' && (
          <ManageView activeDay={state.activeDay} workoutData={state.workoutData} setActiveDay={setters.setActiveDay}
            addDay={actions.manageData.addDay} removeDay={actions.manageData.removeDay} setWorkoutData={setters.setWorkoutData} 
            addExercise={actions.manageData.add} removeExercise={actions.manageData.remove} editExerciseBase={actions.manageData.edit} 
            setView={setters.setView} addFromCatalog={actions.manageData.addFromCatalog} />
        )}

        {state.view === 'history' && <HistoryView history={state.history} bodyHistory={state.bodyHistory} deleteEntry={actions.deleteEntry} updateEntry={actions.updateHistoryEntry} setView={setters.setView} />}
        {state.view === 'stats' && <StatsView bodyHistory={state.bodyHistory} history={state.history} workoutData={state.workoutData} setView={setters.setView} setIsModalOpen={setIsAnyModalOpen} />}
        {state.view === 'profile' && <ProfileView userMetadata={session?.user?.user_metadata} setView={setters.setView} stats={stats} history={state.history} quests={JSON.parse(localStorage.getItem('daily_quests') || '[]')} bodyHistory={state.bodyHistory} deleteEntry={actions.deleteEntry} />}
      </div>
      
      {!isAnyModalOpen && <CyberNav currentView={state.view} setView={setters.setView} />}
      
      {/* 🚀 MODAIS DE CELEBRAÇÃO */}
      {showLevelUp && (
        <LevelUpModal 
          level={stats?.level || 1} 
          onClose={handleLevelUpClose} 
        />
      )}

      {showCelebration && (
        <WorkoutComplete 
          onClose={() => setShowCelebration(false)} 
          sessionDuration={`${stats.lastSessionStats?.duration || 0} min`} 
          sessionVolume={`${stats.lastSessionStats?.volume || 0} kg`} 
          sessionPoints={`+${stats.lastSessionStats?.xp || 0} XP`} 
          history={state.history} 
        />
      )}
      
      {/* MENU LATERAL */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsMenuOpen(false); setConfirmLogout(false); }}></div>
          <div className="relative w-80 h-full bg-card border-l-2 border-primary p-6 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col text-main dark:text-white">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-primary uppercase tracking-widest">COMANDO</h2>
              <button onClick={() => { setIsMenuOpen(false); setConfirmLogout(false); }} className="text-muted hover:text-red-500 transition-colors">
                <X size={32} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <span className="text-xs font-bold text-muted uppercase tracking-widest block mb-2">Interface Tática</span>
              <button onClick={() => setTheme(theme === 'light' ? 'driver' : 'light')} 
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group active:scale-95 ${theme === 'light' ? 'bg-white border-yellow-500 text-yellow-600' : 'bg-black/50 border-primary text-primary'}`}>
                <span className="font-black uppercase tracking-widest text-sm">{theme === 'light' ? 'Modo Diurno' : 'Modo Noturno'}</span>
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            
            {!confirmLogout ? (
              <button onClick={() => setConfirmLogout(true)} className="mt-auto w-full py-4 rounded-xl border border-red-500/30 text-red-500 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95">
                <LogOut size={18} /> ENCERRAR SESSÃO
              </button>
            ) : (
              <div className="mt-auto space-y-3 animate-in fade-in zoom-in duration-200 bg-red-950/20 p-3 rounded-xl border border-red-500/30">
                <p className="text-center text-xs font-black text-red-400 uppercase tracking-widest">Abandonar a base?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmLogout(false)} className="flex-1 py-3 rounded-lg border border-border text-muted font-black uppercase text-xs hover:bg-card transition-all active:scale-95">CANCELAR</button>
                  <button onClick={async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.reload(); }} 
                    className="flex-1 py-3 rounded-lg bg-red-600 text-white font-black uppercase text-xs hover:bg-red-700 transition-all shadow-lg">CONFIRMAR</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔥 REST TIMER: DE VOLTA PARA O COMPORTAMENTO PADRÃO */}
      <div className="relative z-[9999]">
        {(state.timerState?.active || restTimerConfig.isOpen) && (
          <RestTimer 
            initialSeconds={state.timerState?.active ? state.timerState.seconds : restTimerConfig.duration} 
            onClose={() => { 
              if(state.timerState?.active) actions.closeTimer(); 
              setRestTimerConfig(p => ({ ...p, isOpen: false })); 
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default WorkoutApp;