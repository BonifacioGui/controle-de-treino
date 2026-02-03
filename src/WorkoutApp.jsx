import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Terminal, Wifi, WifiOff } from 'lucide-react'; 
import { useWorkout } from './hooks/useWorkout'; 

// Componentes
import WorkoutView from './components/WorkoutView';
import HistoryView from './components/HistoryView';
import ManageView from './components/ManageView';
import StatsView from './components/StatsView';
import CyberNav from './components/CyberNav';
import MatrixRain from './components/MatrixRain'; 
import Importer from './components/Importer';
import RestTimer from './components/RestTimer';

const WorkoutApp = () => { 
  const { state, setters, actions, stats } = useWorkout();
  
  const [theme, setTheme] = useState('driver');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // --- CALLBACK ESTÁVEL PARA O IMPORTADOR ---
  // Isso impede que a função seja recriada a cada render, evitando o loop
  const handleImportSuccess = useCallback(() => {
    actions.fetchCloudData();
    setters.setView('workout');
  }, [actions, setters]);

  return (
    <div className="min-h-screen bg-page text-main p-4 font-cyber pb-32 cyber-grid transition-colors duration-500 relative overflow-x-hidden">
      
      {theme === 'matrix' && <MatrixRain />}

      {state.showMeme && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 animate-in zoom-in duration-300">
          <video 
            src="https://i.imgur.com/1kSZ05R.mp4" 
            className="w-full max-w-7xl h-auto rounded-3xl border-4 border-cyan-500 shadow-[0_0_50px_rgba(0,243,255,0.8)]" 
            autoPlay loop muted playsInline
          />
          <h2 className="text-5xl md:text-7xl font-black mt-8 neon-text-cyan italic uppercase tracking-tighter text-center drop-shadow-[0_0_20px_rgba(0,243,255,0.8)]">
            SIIIIIIIIIIIU!
          </h2>
        </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-start mb-10 border-b border-primary/30 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-primary italic neon-text-cyan tracking-tighter">
            PROJETO<span className="text-secondary">.BOMBA</span>
          </h1>
          <div className="mt-4 flex gap-4">
            <div className="bg-card/60 p-2 rounded-lg border border-primary/20 shadow-inner">
              <p className="text-[8px] text-primary uppercase font-black mb-1 tracking-widest leading-none">Massa_Ref</p>
              <p className="text-lg font-bold">{stats.latest.weight || '--'}KG</p>
            </div>
            <div className="bg-card/60 p-2 rounded-lg border border-secondary/20 shadow-inner">
              <p className="text-[8px] text-secondary uppercase font-black mb-1 tracking-widest leading-none">Cintura_Ref</p>
              <p className="text-lg font-bold">{stats.latest.waist || '--'}CM</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all
            ${isOnline 
                ? 'bg-green-500/10 border-green-500/50 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                : 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]'
            }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            
            <div className="bg-card/50 backdrop-blur-md p-1 rounded-xl border border-border flex flex-col gap-1 z-50 shadow-xl">
                <button onClick={() => setTheme('light')} className="p-2 rounded-lg hover:text-primary"><Sun size={16} /></button>
                <button onClick={() => setTheme('driver')} className="p-2 rounded-lg hover:text-primary"><Moon size={16} /></button>
                <button onClick={() => setTheme('matrix')} className="p-2 rounded-lg hover:text-primary"><Terminal size={16} /></button>
            </div>
        </div>
      </header>

      {/* NAVEGAÇÃO DE DIAS */}
      {state.view === 'workout' && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          {Object.keys(state.workoutData).map((day) => (
            <button
              key={day}
              onClick={() => setters.setActiveDay(day)}
              className={`px-6 py-3 rounded-xl font-black text-xs transition-all duration-300 uppercase tracking-widest border shrink-0
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
        {state.view === 'workout' && (
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
              bodyHistory={state.bodyHistory} 
              saveBiometrics={actions.saveBiometrics}
              history={state.history}
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
            <StatsView bodyHistory={state.bodyHistory} history={state.history} setView={setters.setView} />
        )}
        
        {/* CORREÇÃO DO IMPORTADOR */}
        {state.view === 'import' && (
            <Importer onSuccess={handleImportSuccess} />
        )}
      </div>
      
      <CyberNav currentView={state.view} setView={setters.setView} />
      {/* --- TIMER FLUTUANTE --- */}
      {state.timerState?.active && (
        <RestTimer 
          initialSeconds={90} // Ou state.timerState.seconds se quiser customizar por exercício
          onClose={actions.closeTimer} 
        />
      )}
      
      <CyberNav currentView={state.view} setView={setters.setView} />
      <WorkoutView 
    // ... seus outros props
    timerState={state.timerState}
    closeTimer={actions.closeTimer}
      />
    </div>
  );
};

export default WorkoutApp;