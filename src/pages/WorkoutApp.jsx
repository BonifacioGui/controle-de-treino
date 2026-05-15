import React, { useState, useEffect } from 'react';
import { Menu, Flame, Wifi, WifiOff, Medal, Zap  } from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout'; 
import logoSolo from '../assets/logo-solo.svg';
import { supabase } from '../services/supabaseClient';

// 1. Shared & Layout (Globais)
import CyberNav from '../components/shared/CyberNav';
import SidebarMenu from '../components/shared/SidebarMenu';
import LoadingScreen from '../components/shared/LoadingScreen';

// 2. Auth (Acesso)
import AuthLayout from '../components/auth/AuthLayout'; // 🔥 AJUSTE AQUI: Trocado de AuthView para AuthLayout

// 3. Dashboard (Visão Geral)
import HistoryView from '../components/dashboard/HistoryView';

// 4. Workout (O Treino Ativo)
import WorkoutView from '../components/workout/WorkoutView';
import RestTimer from '../components/workout/RestTimer';

// 5. RPG (Gamificação do SOLO)
import LevelUpModal from '../components/rpg/LevelUpModal';
import QuestLogView from '../components/rpg/QuestLogView';
import { getFlameStyle } from '../utils/rpgSystem';
import { generateDailyQuests } from '../utils/questSystem'; // 🔥 IMPORTAÇÃO DO MOTOR DE MISSÕES AQUI

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
  const [showBadgeAlert, setShowBadgeAlert] = useState(false); // 🔥 ADICIONE ESTA LINHA
  const [restTimerConfig, setRestTimerConfig] = useState({ isOpen: false, duration: 60 });

  const isAnyModalOpen = showCelebration || showLevelUp || showBadgeAlert || isMenuOpen;  
  // ✅ CORREÇÃO 2: Executamos a função importada para gerar o estilo do fogo
  const flameStyle = getFlameStyle(stats?.streak || 0);

  // 🔥 FORMATADOR DO HUD TÁTICO
  const formatTimer = (totalSeconds) => {
    if (!totalSeconds) return "00:00";
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
  useEffect(() => {
    if (session?.user?.id) actions.fetchCloudData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // 🚨 Tiramos o 'actions' daqui!

  // 🔥 4. O GATILHO DAS MISSÕES: Roda o motor ao abrir o app
  useEffect(() => {
    generateDailyQuests();
  }, []);

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
    // Quando o app carrega (ou recarrega por causa da câmera), ele verifica se tem card pendente
    const pendingCard = localStorage.getItem('pending_share_card');
    if (pendingCard) {
      // Abre a tela de comemoração instantaneamente
      setShowCelebration(true);
    }
  }, []);


  // ==========================================
  // 🚀 A LÓGICA DE FINALIZAÇÃO BLINDADA E DIRETA
  // ==========================================

  // ==========================================
  // 🚀 A LÓGICA DE FINALIZAÇÃO BLINDADA E DIRETA
  // ==========================================

  const handleFinishWorkoutWrapper = async (dadosDoTreino) => {
    const resultado = await actions.finishWorkout(dadosDoTreino?.bonusXp || 0);
    
    const relatorioTatico = {
      volume: resultado.sessionVolume,
      duration: resultado.sessionDuration,
      xp: resultado.sessionXp,
      level: resultado.newLevel,
      streak: resultado.newStreak,
      newBadges: resultado.newBadges 
    };
    localStorage.setItem('pending_share_card', JSON.stringify(relatorioTatico));

    // A Escadinha: 1º Nível -> 2º Conquistas -> 3º Relatório
    if (resultado.subiuDeNivel) {
      setShowLevelUp(true); 
    } else if (resultado.newBadges && resultado.newBadges.length > 0) {
      setShowBadgeAlert(true);
    } else {
      setShowCelebration(true); 
    }
  };

  const handleLevelUpClose = () => {
    setShowLevelUp(false);
    const relatorioTatico = JSON.parse(localStorage.getItem('pending_share_card') || '{}');
    
    setTimeout(() => {
      // Se tiver conquista, mostra ela. Se não, vai pro relatório.
      if (relatorioTatico.newBadges && relatorioTatico.newBadges.length > 0) {
        setShowBadgeAlert(true);
      } else {
        setShowCelebration(true); 
      }
    }, 400); 
  };

  const handleBadgeAlertClose = () => {
    setShowBadgeAlert(false);
    // Depois de comemorar a conquista, abre o relatório final
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
  if (!session) return <AuthLayout />; // 🔥 AJUSTE AQUI: Trocado de AuthView para AuthLayout

  // Portão 4: Sistema Carregado
  return (
    <div className="min-h-screen bg-page text-main font-cyber pb-8 cyber-grid transition-colors duration-500 relative overflow-x-hidden">
      
      {/* HEADER TÁTICO */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border bg-page/80 px-4 py-3 flex items-center justify-between shadow-lg mb-6 h-20">
        <div className="flex flex-col select-none sm:border-l-2 border-border sm:pl-4 py-1.5">
          <div className="flex items-center gap-3 relative group">
            <h1 className="hidden sm:block font-sans font-black text-3xl md:text-4xl tracking-[0.2em] bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent leading-none uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] hover:drop-shadow-[0_0_15px_rgba(255,0,255,0.6)] transition-all duration-500">
              SOLO
            </h1>
            {/* Logo com tamanho contido e proporcional ao texto */}
            <div className="relative h-8 sm:h-6.7 w-auto flex items-center justify-center shrink-0">
              <img 
                src={logoSolo} 
                alt="SOLO Logo" 
                className="object-contain h-full w-auto drop-shadow-[0_0_8px_rgba(0,243,255,0.7)] hover:drop-shadow-[0_0_12px_rgba(0,243,255,1)] active:scale-95 active:drop-shadow-[0_0_20px_rgba(0,243,255,1)] transition-all duration-300 relative z-10" 
              />
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
              quests={[]} // Aqui depois ligaremos as quests reais se precisar mandar via props
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

      {/* 🔴 HUD DE MISSÃO ATIVA (SOFT LOCK) */}
      {state.workoutTimer?.isRunning && state.view !== 'workout' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[400px] animate-in slide-in-from-bottom-4 fade-in duration-500">
          <button 
            onClick={() => setters.setView('workout')}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-[#050B14]/90 backdrop-blur-md border border-red-500/50 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.15)] group hover:border-red-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Ponto vermelho piscando (Recording) */}
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] leading-none mb-1">
                  Operação em Andamento
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-widest leading-none">
                  Retornar ao Combate
                </span>
              </div>
            </div>
            
            {/* Cronômetro Espelhado */}
            <div className="bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
              <span className="font-mono text-sm font-bold text-red-400 tracking-wider drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                {formatTimer(state.workoutTimer.elapsed)}
              </span>
            </div>
          </button>
        </div>
      )}
      
      {!isAnyModalOpen && <CyberNav currentView={state.view} setView={setters.setView} />}
      
      {/* 🚀 MODAIS DE CELEBRAÇÃO */}
      {showLevelUp && (
        <LevelUpModal 
          level={stats?.level || 1} 
          onClose={handleLevelUpClose} 
        />
      )}

      {/* ALERTA DE NOVA CONQUISTA (ISOLADO) */}
      {showBadgeAlert && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[320px] bg-card border border-yellow-500/50 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_0_40px_rgba(250,204,21,0.2)] animate-in zoom-in-95 duration-500">
            
            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-bounce relative">
              <Medal size={48} className="text-black drop-shadow-md z-10" />
              <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
            </div>
            
            <h2 className="text-xl font-black text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="fill-yellow-400" size={20} /> Conquista!
            </h2>
            
            <div className="w-full space-y-3 mb-8">
              {(JSON.parse(localStorage.getItem('pending_share_card') || '{}').newBadges || []).map((badge, idx) => (
                 <div key={idx} className="bg-black/50 border border-yellow-500/30 p-4 rounded-xl flex flex-col items-center">
                   <p className="text-lg font-black text-white uppercase text-center leading-tight">{badge.title}</p>
                   {badge.desc && <p className="text-[10px] font-bold text-muted mt-2 uppercase tracking-wider">{badge.desc}</p>}
                 </div>
              ))}
            </div>

            <button 
              onClick={handleBadgeAlertClose}
              className="w-full py-4 bg-yellow-400 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95"
            >
              Avançar
            </button>
          </div>
        </div>
      )}

     {showCelebration && (
        <WorkoutComplete 
          onClose={() => {
            // 🔥 Limpa a memória para o usuário seguir a vida
            localStorage.removeItem('pending_share_card');
            setShowCelebration(false);
          }} 
          
          // 🔥 Lógica de Persistência: Tenta ler o cofre primeiro, se falhar, usa os stats
          sessionDuration={`${JSON.parse(localStorage.getItem('pending_share_card') || '{}').duration || stats.lastSessionStats?.duration || '00:00'} min`} 
          sessionVolume={`${JSON.parse(localStorage.getItem('pending_share_card') || '{}').volume || stats.lastSessionStats?.volume || 0} kg`} 
          sessionPoints={`+${JSON.parse(localStorage.getItem('pending_share_card') || '{}').xp || stats.lastSessionStats?.xp || 0} XP`} 
          
          bossName={state.workoutData?.[state.activeDay]?.title || "ALVO ELIMINADO"} 
          bossHp={state.workoutData?.[state.activeDay]?.bossHp || 10000}
          
          streak={JSON.parse(localStorage.getItem('pending_share_card') || '{}').streak || stats?.streak || 0}
          currentLevel={JSON.parse(localStorage.getItem('pending_share_card') || '{}').level || stats?.level || 1}
          totalXp={stats?.xp || 0} 
          newBadges={JSON.parse(localStorage.getItem('pending_share_card') || '{}').newBadges || []}
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