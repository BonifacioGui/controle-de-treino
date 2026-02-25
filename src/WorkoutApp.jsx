import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, BarChart3, Dumbbell, History, Menu, X, Share2, Zap, Flame, Sun, Moon, Terminal, Wifi, WifiOff } from 'lucide-react';
import { useWorkout } from './hooks/useWorkout'; 
import { initialWorkoutData } from './workoutData'; 

// Componentes
import WorkoutView from './components/WorkoutView';
import HistoryView from './components/HistoryView';
import ManageView from './components/ManageView';
import StatsView from './components/StatsView';
import CyberNav from './components/CyberNav';
import MatrixRain from './components/MatrixRain'; 
import Importer from './components/Importer';
import UserLevel from './components/UserLevel';
import BadgeList from './components/BadgeList'; 
import CharacterSheet from './components/CharacterSheet';
import QuestBoard from './components/QuestBoard';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView'; // 🔥 1. Import do Novo Componente
import { supabase } from './supabaseClient';

// Celebrações
import Cr7Celebration from './components/Cr7Celebration'; 
import LevelUpModal from './components/LevelUpModal';
import { getDailyQuests } from './utils/rpgSystem';

const WorkoutApp = () => { 
  // --- 1. ESTADOS E HOOKS ---
  const [session, setSession] = useState(null);
  const { state, setters, actions, stats } = useWorkout();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('driver');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  const [showCr7, setShowCr7] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  
  const prevLevelRef = useRef(stats?.level || 1);
  const hasSavedData = !!localStorage.getItem('workout_plan');

  // --- 2. MONITORAMENTO DE SESSÃO ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  

  // --- 3. LÓGICA ORIGINAL ---
  useEffect(() => {
    const checkAndGenerateQuests = () => {
      const today = new Date().toLocaleDateString('pt-BR');
      const lastQuestDate = localStorage.getItem('quest_date');
      const currentQuests = localStorage.getItem('daily_quests');

      if (today !== lastQuestDate || !currentQuests) {
        console.log("🔄 Gerando novas missões diárias...");
        const newQuests = getDailyQuests(); 
        localStorage.setItem('daily_quests', JSON.stringify(newQuests));
        localStorage.setItem('quest_date', today);
        window.dispatchEvent(new Event('storage'));
      }
    };
    checkAndGenerateQuests();
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
    if (state.view === 'import' || !state.workoutData || Object.keys(state.workoutData).length === 0) {
       const saved = localStorage.getItem('workout_plan');
       if (!saved) {
           localStorage.setItem('workout_plan', JSON.stringify(initialWorkoutData));
           if (setters.setWorkoutData) setters.setWorkoutData(initialWorkoutData);
       }
       if (setters.setView) setters.setView('workout');
    }
  }, [state.view, state.workoutData, setters]);

  useEffect(() => {
    const currentLevel = stats?.level || 1;
    if (currentLevel > prevLevelRef.current) {
      if (showCr7) {
        setPendingLevelUp(true);
      } else {
        setShowLevelUp(true);
      }
      prevLevelRef.current = currentLevel;
    }
  }, [stats?.level, showCr7]);

  useEffect(() => {
    setIsAnyModalOpen(showCr7 || showLevelUp || isMenuOpen);
  }, [showCr7, showLevelUp, isMenuOpen]);

  const handleImportSuccess = useCallback(() => {
    actions.fetchCloudData();
    setters.setView('workout');
  }, [actions, setters]);

  const handleFinishWorkoutWrapper = () => {
    setShowCr7(true);
    actions.finishWorkout();
  };

  const handleVideoComplete = () => {
    setShowCr7(false);
    if (pendingLevelUp) {
      setShowLevelUp(true);
      setPendingLevelUp(false);
    }
  };

  const getFlameStyle = (streak) => {
    if (streak >= 30) return { color: "text-cyan-400", shadow: "shadow-[0_0_20px_rgba(34,211,238,0.6)] border-cyan-500/50 bg-cyan-950/30", iconClass: "fill-cyan-400 animate-pulse" };
    if (streak >= 7) return { color: "text-red-500", shadow: "shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-500/50 bg-red-950/30", iconClass: "fill-red-500 animate-pulse" };
    if (streak > 0) return { color: "text-orange-500", shadow: "shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-500/50 bg-orange-950/20", iconClass: "fill-orange-500 animate-pulse" };
    return { color: "text-muted", shadow: "border-border bg-card/50", iconClass: "text-muted" };
  };

  const flameStyle = getFlameStyle(stats?.streak || 0);

  // --- 4. VERIFICAÇÃO DE SESSÃO ---
  if (!session) {
    return <AuthView />;
  }

  const dailyQuests = JSON.parse(localStorage.getItem('daily_quests') || '[]');
  // 🔥 2. Extrai os dados do usuário para passar para o ProfileView
  const userMetadata = session?.user?.user_metadata || null;

  // --- 5. RENDERIZAÇÃO DO JSX ---
  return (
    <div className="min-h-screen bg-page text-main p-4 font-cyber pb-32 cyber-grid transition-colors duration-500 relative overflow-x-hidden">
      
      {theme === 'matrix' && <MatrixRain />}

      {!state.showMeme && (
        <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border bg-page/80 px-4 py-3 flex items-center justify-between shadow-lg mb-6 h-20 relative">
          <div className="flex items-center gap-2 z-10">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                  <Zap className="text-black fill-black" size={24} />
              </div>
              <h1 className="leading-none select-none font-black text-left text-[12px] md:text-lg tracking-tighter hidden sm:block uppercase">
                  PROJETO<br/>
                  <span className="text-primary">BOMBA</span>
              </h1>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <div className={`flex flex-col items-center justify-center px-4 h-14 rounded-2xl border transition-all duration-500 min-w-[80px] ${flameStyle.shadow} relative overflow-hidden group`}>
                <div className="relative mb-0.5 z-10">
                    <Flame size={38} className={`${flameStyle.iconClass}`} />
                </div>
                <div className="flex items-center justify-center gap-1 z-10">
                    <span className={`text-[8px] font-bold uppercase tracking-widest opacity-80 ${flameStyle.color}`}>
                        STREAK {stats?.streak || 0}
                    </span>
                </div>
                <div className={`absolute inset-0 blur-md opacity-20 ${flameStyle.color.replace('text-', 'bg-')}`}></div>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <div className={`hidden sm:flex flex-col justify-center text-[10px] font-black opacity-50 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
               {isOnline ? <Wifi size={16}/> : <WifiOff size={16}/>}
            </div>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card text-muted hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>
      )}

      {state.view === 'workout' && state.workoutData && !state.showMeme && (
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-4 px-1">
        {Object.keys(state.workoutData).map((day) => {
          const wData = state.workoutData[day];
          const isActive = state.activeDay === day;
          
          return (
            <button
              key={day}
              onClick={() => setters.setActiveDay(day)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border min-w-[140px] shrink-0 overflow-hidden group
                ${isActive 
                  ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] scale-[1.02]' 
                  : 'bg-card text-muted border-border hover:border-primary/40 hover:bg-input/50'
                }`}
            >
              {/* Efeito de luz sutil no fundo do card ativo */}
              {isActive && <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 blur-2xl rounded-full -mr-8 -mt-8"></div>}
              
              {/* A Letra Gigante em Itálico */}
              <span className={`text-3xl font-black italic tracking-tighter drop-shadow-sm ${isActive ? 'text-black' : 'text-main'}`}>
                {day}
              </span>
              
              {/* Divisória Vertical e Dados (HUD) */}
              <div className={`flex flex-col items-start text-left border-l-2 pl-2 ${isActive ? 'border-black/30' : 'border-border/50 group-hover:border-primary/30'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 truncate max-w-[80px]">
                  {wData?.title || "TREINO"}
                </span>
                <span className={`text-[7px] font-bold uppercase tracking-widest truncate max-w-[80px] ${isActive ? 'text-black/70' : 'text-muted'}`}>
                  {wData?.focus || "SISTEMA"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    )}

      <div className="relative z-10 min-h-[50vh]">
        {/* Dentro do WorkoutApp.jsx */}
        {state.view === 'workout' && state.workoutData && (
          state.workoutData[state.activeDay] ? (
            <WorkoutView 
              {...state} // Passa activeDay, progress, selectedDate, etc.
              actions={actions} // Passa todas as funções (updateSetData, onSwap, etc.)
              // Sobrescrevendo setters manuais por segurança
              setActiveDay={setters.setActiveDay}
              setSelectedDate={actions.handleDateChange} // Usa a versão do actions que limpa inputs
              setSessionNote={setters.setSessionNote}
              finishWorkout={handleFinishWorkoutWrapper}
              // Passando funções do actions como props diretas para o WorkoutView encontrar
              updateSetData={actions.updateSetData}
              updateSessionSets={actions.updateSessionSets}
              toggleCheck={actions.toggleCheck}
            />
          ) : (
            <div className="text-center text-red-500 p-10 border border-red-500 rounded-xl bg-red-500/10">
               <p className="font-bold">DADOS INCONSISTENTES</p>
               <p className="text-xs">Dia não encontrado. Resete os dados em Gerenciar.</p>
            </div>
          )
        )}
        
        {state.view === 'manage' && (
          <ManageView 
            activeDay={state.activeDay} 
            workoutData={state.workoutData} 
            setWorkoutData={setters.setWorkoutData} 
            addExercise={actions.manageData.add} 
            removeExercise={actions.manageData.remove} 
            editExerciseBase={actions.manageData.edit} 
            setView={setters.setView}
            addFromCatalog={actions.manageData.addFromCatalog}
          />
        )}

        {state.view === 'history' && (
          <HistoryView 
            history={state.history} 
            bodyHistory={state.bodyHistory} 
            deleteEntry={actions.deleteEntry} 
            updateEntry={actions.updateHistoryEntry} 
            setView={setters.setView} 
          />
        )}

        {state.view === 'stats' && (
            <StatsView 
              bodyHistory={state.bodyHistory} 
              history={state.history} 
              workoutData={state.workoutData} 
              setView={setters.setView}
              setIsModalOpen={setIsAnyModalOpen}
            />
        )}

        {/* ABA DE PERFIL (Apenas o componente unificado) */}
        {state.view === 'profile' && (
          <ProfileView 
            userMetadata={userMetadata} 
            setView={setters.setView} 
            stats={stats} 
            history={state.history}
            quests={dailyQuests}
          />
        )}
        
        {state.view === 'import' && !hasSavedData && (
            <Importer onSuccess={handleImportSuccess} />
        )}
      </div>
      
      {!state.showMeme && !isAnyModalOpen && (
        <CyberNav currentView={state.view} setView={setters.setView} />
      )}
      
      {showCr7 && <Cr7Celebration onClose={handleVideoComplete} />}
      
      {showLevelUp && (
        <LevelUpModal 
          level={stats?.level || 1}
          onClose={() => setShowLevelUp(false)} 
        />
      )}
      
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-80 h-full bg-card border-l-2 border-primary p-6 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-primary uppercase tracking-widest">CONFIG</h2>
              <button onClick={() => setIsMenuOpen(false)} className="text-muted hover:text-red-500 transition-colors">
                <X size={32} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <span className="text-xs font-bold text-muted uppercase tracking-widest block mb-2">Visual</span>
              <button onClick={() => setTheme('driver')} className={`w-full p-4 rounded-xl border-2 bg-input transition-all flex justify-between ${theme === 'driver' ? 'border-primary text-primary' : 'border-border text-muted'}`}>
                <span>Cyberpunk</span> <Moon size={16} />
              </button>
              <button onClick={() => setTheme('matrix')} className={`w-full p-4 rounded-xl border-2 bg-input transition-all flex justify-between ${theme === 'matrix' ? 'border-[#00ff41] text-[#00ff41]' : 'border-border text-muted'}`}>
                <span>Matrix</span> <Terminal size={16} />
              </button>
              <button onClick={() => setTheme('light')} className={`w-full p-4 rounded-xl border-2 bg-input transition-all flex justify-between ${theme === 'light' ? 'border-blue-500 text-blue-500' : 'border-border text-muted'}`}>
                <span>Light</span> <Sun size={16} />
              </button>
              <button onClick={() => setTheme('spiderman')} className={`w-full p-4 rounded-xl border-2 bg-input transition-all flex justify-between ${theme === 'spiderman' ? 'border-red-600 text-red-600' : 'border-border text-muted'}`}>
                <span>Aranha</span> <Zap size={16} />
              </button>
            </div>
            
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="mt-auto w-full py-4 rounded-xl border-2 border-red-500/50 text-red-500 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
            >
              ENCERRAR SESSÃO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutApp;