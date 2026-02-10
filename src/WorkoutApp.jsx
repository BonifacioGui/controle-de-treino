import React, { useState, useEffect, useCallback } from 'react';
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

const WorkoutApp = () => { 
  const { state, setters, actions, stats } = useWorkout();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('driver');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const hasSavedData = !!localStorage.getItem('workout_plan');

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

  // AUTO-INICIALIZAÇÃO
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

  const handleImportSuccess = useCallback(() => {
    actions.fetchCloudData();
    setters.setView('workout');
  }, [actions, setters]);

  // 🔥 LÓGICA DO FOGO EVOLUTIVO 🔥
  const getFlameStyle = (streak) => {
    if (streak >= 30) return {
        color: "text-cyan-400",
        shadow: "shadow-[0_0_20px_rgba(34,211,238,0.6)] border-cyan-500/50 bg-cyan-950/30",
        iconClass: "fill-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,1)]"
    };
    if (streak >= 7) return {
        color: "text-red-500",
        shadow: "shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-500/50 bg-red-950/30",
        iconClass: "fill-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
    };
    if (streak > 0) return {
        color: "text-orange-500",
        shadow: "shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-500/50 bg-orange-950/20",
        iconClass: "fill-orange-500 animate-pulse drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]"
    };
    return {
        color: "text-muted",
        shadow: "border-border bg-card/50",
        iconClass: "text-muted"
    };
  };

  const flameStyle = getFlameStyle(stats?.streak || 0);

  return (
    <div className="min-h-screen bg-page text-main p-4 font-cyber pb-32 cyber-grid transition-colors duration-500 relative overflow-x-hidden">
      
      {theme === 'matrix' && <MatrixRain />}

      {/* --- MEME DO CR7 --- */}
      {state.showMeme && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black animate-in zoom-in duration-300 p-4">
          <video 
            src="https://i.imgur.com/1kSZ05R.mp4" 
            className="w-full md:w-auto max-h-[55vh] object-contain rounded-3xl border-4 border-cyan-500 shadow-[0_0_50px_rgba(0,243,255,0.8)]" 
            autoPlay loop muted playsInline
          />
          <h2 className="text-6xl md:text-9xl font-black mt-8 neon-text-cyan italic uppercase tracking-tighter text-center drop-shadow-[0_0_20px_rgba(0,243,255,0.8)] animate-pulse pb-10">
            SIIIIIIIIIIIU!
          </h2>
        </div>
      )}

      {/* HEADER */}
      {!state.showMeme && (
        <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border bg-page/80 px-4 py-3 flex items-center justify-between shadow-lg mb-6">
          
          <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                  <Zap className="text-black fill-black" size={24} />
              </div>
              <h1 className="leading-none select-none font-black text-left text-lg md:text-2xl tracking-tighter">
                  PROJETO<br/>
                  <span className="text-primary">BOMBA</span>
              </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-black uppercase tracking-widest ${isOnline ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}>
               {isOnline ? <Wifi size={10}/> : <WifiOff size={10}/>}
            </div>

            {/* 🔥 CONTADOR DE STREAK (LAYOUT: FOGO NO TOPO / BASE: TEXTO + NÚMERO) 🔥 */}
            <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl border transition-all duration-500 min-w-[90px] ${flameStyle.shadow}`}>
                
                {/* 1. FOGO (EM CIMA, CENTRALIZADO) */}
                <div className="relative mb-0.5">
                    <Flame size={40} className={`${flameStyle.iconClass}`} />
                    <div className={`absolute inset-0 blur-md opacity-50 ${flameStyle.color.replace('text-', 'bg-')}`}></div>
                </div>

                {/* 2. BASE: NOME "STREAK" + NÚMERO (LADO A LADO) */}
                <div className="flex items-center justify-center gap-1.5">
                    <span className={`text-[8px] font-bold uppercase tracking-widest opacity-60 pt-0.5 ${flameStyle.color}`}>
                        STREAK
                    </span>
                    <span className={`text-[10.5px] font-black leading-none ${flameStyle.color}`}>
                        {stats?.streak || 0}
                    </span>
                </div>

            </div>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-3 rounded-xl border border-border bg-card text-muted hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>
      )}

      {/* ÁREA DE GAMIFICAÇÃO */}
      {state.view === 'workout' && !state.showMeme && (
        <div className="mb-6 space-y-2">
          <UserLevel history={state.history} />
          <BadgeList history={state.history} />
        </div>
      )}

      {/* NAVEGAÇÃO DE DIAS */}
      {state.view === 'workout' && state.workoutData && !state.showMeme && (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          {Object.keys(state.workoutData).map((day) => (
            <button
              key={day}
              onClick={() => setters.setActiveDay(day)}
              className={`px-8 py-4 rounded-2xl font-black text-lm transition-all duration-300 uppercase tracking-widest border shrink-0
                ${state.activeDay === day 
                  ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgb(var(--primary))] scale-105' 
                  : 'bg-card text-muted border-border hover:border-primary/50 hover:text-primary'
                }`}
            >
              {day.replace('TREINO ', '').replace('-FEIRA', '')}
            </button>
          ))}
        </div>
      )}

      {/* VIEWS */}
      <div className="relative z-10 min-h-[50vh]">
        {state.view === 'workout' && state.workoutData && (
          state.workoutData[state.activeDay] ? (
            <WorkoutView 
              activeDay={state.activeDay} 
              setActiveDay={setters.setActiveDay}
              workoutData={state.workoutData} 
              selectedDate={state.selectedDate} 
              setSelectedDate={actions.handleDateChange}
              
              weightInput={state.weightInput} setWeightInput={setters.setWeightInput} 
              waistInput={state.waistInput} setWaistInput={setters.setWaistInput} 
              latestStats={stats.latest} 
              
              progress={state.progress} 
              toggleCheck={actions.toggleCheck} 
              updateSetData={actions.updateSetData} 
              updateSessionSets={actions.updateSessionSets} 
              sessionNote={state.sessionNote} 
              setSessionNote={setters.setSessionNote} 
              finishWorkout={actions.finishWorkout}
              saveBiometrics={actions.saveBiometrics}
              
              bodyHistory={state.bodyHistory} 
              history={state.history}
              
              timerState={state.timerState}
              closeTimer={actions.closeTimer}
              workoutTimer={state.workoutTimer}
              toggleWorkoutTimer={actions.toggleWorkoutTimer}
              resetWorkoutTimer={actions.resetWorkoutTimer}
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
            <StatsView bodyHistory={state.bodyHistory} history={state.history} workoutData={state.workoutData} setView={setters.setView} />
        )}
        
        {state.view === 'import' && !hasSavedData && (
            <Importer onSuccess={handleImportSuccess} />
        )}
      </div>
      
      {/* NAVEGAÇÃO INFERIOR */}
      {!state.showMeme && (
        <CyberNav currentView={state.view} setView={setters.setView} />
      )}
      
      {/* MENU LATERAL */}
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
              <button onClick={() => setTheme('driver')} className="w-full p-4 rounded-xl border-2 bg-input border-border hover:border-primary text-muted hover:text-primary font-black uppercase tracking-wider transition-all flex justify-between">
                <span>Cyberpunk</span> {theme === 'driver' && <Moon size={16} />}
              </button>
              <button onClick={() => setTheme('matrix')} className="w-full p-4 rounded-xl border-2 bg-input border-border hover:border-[#00ff41] text-muted hover:text-[#00ff41] font-black uppercase tracking-wider transition-all flex justify-between">
                <span>Matrix</span> {theme === 'matrix' && <Terminal size={16} />}
              </button>
              <button onClick={() => setTheme('light')} className="w-full p-4 rounded-xl border-2 bg-input border-border hover:border-blue-500 text-muted hover:text-blue-500 font-black uppercase tracking-wider transition-all flex justify-between">
                <span>Light</span> {theme === 'light' && <Sun size={16} />}
              </button>
              <button onClick={() => setTheme('spiderman')} className="w-full p-4 rounded-xl border-2 bg-input border-border hover:border-red-600 text-muted hover:text-red-600 font-black uppercase tracking-wider transition-all flex justify-between">
                <span>Aranha</span> {theme === 'spiderman' && <Zap size={16} />}
              </button>
            </div>
            
            <div className="mt-auto space-y-4 border-t border-border pt-4">
                <div className="text-center text-xs text-muted opacity-30">
                  Projeto Bomba v2.3<br/>
                  System Online
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutApp;