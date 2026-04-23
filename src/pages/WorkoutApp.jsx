import React, { useState, useEffect } from 'react';
import { 
  Menu, Flame, Wifi, WifiOff,  
} from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout'; 
import logoSolo from '../assets/logo-solo.svg';
import { supabase } from '../services/supabaseClient';

// 1. Shared & Layout (Globais)
import CyberNav from '../components/shared/CyberNav';
import SidebarMenu from '../components/shared/SidebarMenu';
import LoadingScreen from '../components/shared/LoadingScreen';

// 2. Auth (Acesso)
import AuthView from '../components/auth/AuthView';

// 3. Dashboard (Visão Geral)
import HistoryView from '../components/dashboard/HistoryView';

// 4. Workout (O Treino Ativo)
import WorkoutView from '../components/workout/WorkoutView';
import RestTimer from '../components/workout/RestTimer';


// 5. RPG (Gamificação do SOLO)
import LevelUpModal from '../components/rpg/LevelUpModal';
import QuestLogView from '../components/rpg/QuestLogView';
import { getFlameStyle } from '../utils/rpgSystem';

// 6. Profile (Identidade e Corpo)
import ProfileView from '../components/profile/ProfileView';

// 7. Stats (Inteligência Tática)
import StatsView from '../components/stats/StatsView';

// 8. Admin (Gestão de Dados)
import ManageView from '../components/admin/ManageView';
import Importer from '../components/admin/Importer';

// 9. Export (Relatórios)
import WorkoutComplete from '../components/export/WorkoutComplete';

const WorkoutApp = () => { 

  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true); // 🔥 Estado que bloqueia o flash branco

  const { state, setters, actions, stats } = useWorkout();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('driver');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // ESTADOS DE FLUXO DE CELEBRAÇÃO
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [restTimerConfig, setRestTimerConfig] = useState({ isOpen: false, duration: 60 });

  const isAnyModalOpen = showCelebration || showLevelUp || isMenuOpen;
  
  // ✅ CORREÇÃO 2: Executamos a função importada para gerar o estilo do fogo
  const flameStyle = getFlameStyle(stats?.streak || 0);

  // 1. TEMPORIZADOR DO SPLASH
  useEffect(() => {
    // Mantém a animação rodando por pelo menos 2.5 segundos para dar aquele efeito "Premium"
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 2. BUSCA DA SESSÃO (SUPABASE)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsSessionLoading(false); // Só libera quando a nuvem responder
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsSessionLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 3. BUSCA DE DADOS AO LOGAR
  // 3. BUSCA DE DADOS AO LOGAR
  useEffect(() => {
    if (session?.user?.id) actions.fetchCloudData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // 🚨 Tiramos o 'actions' daqui!

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


  // ==========================================
  // 🚀 A LÓGICA DE FINALIZAÇÃO BLINDADA E DIRETA
  // ==========================================

  const handleFinishWorkoutWrapper = async () => {
    // 1. Dispara o final do treino e pega a resposta imediata se upou de nível
    const upouDeNivel = await actions.finishWorkout();
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
  // 🛡️ PORTÕES DE RENDERIZAÇÃO (A ORDEM IMPORTA)
  // ==========================================
  
  // Portão 1: Tela de animação
  if (showSplash) return <LoadingScreen logo={logoSolo} />;
  
  // Portão 2: Evita o piscar branco enquanto o Supabase pensa
  if (isSessionLoading) return <div className="min-h-screen bg-black" />;
  
  // Portão 3: Sem sessão = Login
  if (!session) return <AuthView />;

  // Portão 4: Sistema Carregado
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

         {state.view === 'dashboard' && (
            <QuestLogView 
              history={state.history} 
              quests={[]} // Aqui depois ligaremos as quests reais
              stats={stats} 
              bodyHistory={state.bodyHistory} 
              setView={setters.setView} 
            />
          )}

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

        {state.view === 'importer' && (
          <Importer 
            setWorkoutData={setters.setWorkoutData} 
            setView={setters.setView} 
          />
        )}
        
        {state.view === 'manage' && (
          <ManageView activeDay={state.activeDay} workoutData={state.workoutData} setActiveDay={setters.setActiveDay}
            addDay={actions.manageData.addDay} removeDay={actions.manageData.removeDay} setWorkoutData={setters.setWorkoutData} 
            addExercise={actions.manageData.add} removeExercise={actions.manageData.remove} editExerciseBase={actions.manageData.edit} 
            setView={setters.setView} addFromCatalog={actions.manageData.addFromCatalog} />
        )}

        {state.view === 'history' && <HistoryView history={state.history} bodyHistory={state.bodyHistory} deleteEntry={actions.deleteEntry} updateEntry={actions.updateHistoryEntry} setView={setters.setView} />}
        {state.view === 'stats' && <StatsView bodyHistory={state.bodyHistory} history={state.history} workoutData={state.workoutData} setView={setters.setView} />}
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
          sessionDuration={`${stats.lastSessionStats?.duration || '00:00'} min`} 
          sessionVolume={`${stats.lastSessionStats?.volume || 0} kg`} 
          sessionPoints={`+${stats.lastSessionStats?.xp || 0} XP`} 
          history={state.history}
          bossName={state.workoutData?.[state.activeDay]?.title || "ALVO ELIMINADO"} 
          bossHp={state.workoutData?.[state.activeDay]?.bossHp || 10000}
          streak={stats?.streak || 0}
          currentLevel={stats?.level || 1}
          xpRemaining={stats?.xpRemaining || 0}
          progressPercent={stats?.progress || 0} 
        />
      )}
      
      {/* MENU LATERAL MODULARIZADO */}
      <SidebarMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        theme={theme} 
        setTheme={setTheme} 
        setView={setters.setView} 
      />

      {/* 🔥 REST TIMER */}
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