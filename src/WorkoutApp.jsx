import React, { useState, useEffect, useCallback } from 'react';
import { Settings, BarChart3, Dumbbell, History, Menu, X, Share2, Zap, Flame } from 'lucide-react';
import { useWorkout } from './hooks/useWorkout'; 
import { initialWorkoutData } from './workoutData'; // 🔥 IMPORTAÇÃO ESSENCIAL ADICIONADA

// Componentes
import WorkoutView from './components/WorkoutView';
import HistoryView from './components/HistoryView';
import ManageView from './components/ManageView';
import StatsView from './components/StatsView';
import CyberNav from './components/CyberNav';
import MatrixRain from './components/MatrixRain'; 
import Importer from './components/Importer';
import UserLevel from './components/UserLevel';

const WorkoutApp = () => { 
  const { state, setters, actions, stats } = useWorkout();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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

  // 🔥 CORREÇÃO PRINCIPAL: AUTO-INICIALIZAÇÃO
  // Se abrir na tela de import ou sem dados, carrega o padrão e vai pro treino.
  useEffect(() => {
    if (state.view === 'import' || !state.workoutData || Object.keys(state.workoutData).length === 0) {
       const saved = localStorage.getItem('workout_plan');
       if (!saved) {
           // Se não tem nada salvo, salva o initialWorkoutData
           localStorage.setItem('workout_plan', JSON.stringify(initialWorkoutData));
           if (setters.setWorkoutData) setters.setWorkoutData(initialWorkoutData);
       }
       // Força a ida para a tela de treino
       if (setters.setView) setters.setView('workout');
    }
  }, [state.view, state.workoutData, setters]);

  const handleImportSuccess = useCallback(() => {
    actions.fetchCloudData();
    setters.setView('workout');
  }, [actions, setters]);

  const runMaintenance = () => {
    if (!window.confirm("Isso vai renomear os exercícios no histórico e nos treinos para o padrão simplificado. Tem certeza?")) return;

    // --- CONFIGURAÇÃO CORRIGIDA (PARA NOMES SIMPLES) ---
    const replacements = {
      // Crossover
      "crossover na polia alta": "Crossover",
      "Crossover polia alta": "Crossover",
      "Crossover Polia Alta": "Crossover",
      // Supino
      "Supino reto": "Supino Reto",
      "supino reto barra": "Supino Reto",
      "supino reto (barra)": "Supino Reto",
      "Supino Inclinado (Halter)": "Supino Inclinado",
      // Pernas
      "Agachamento livre": "Agachamento Livre",
      "Leg Press 45": "Leg Press",
      "Elevação Pélvica (Barra)": "Elevação Pélvica",
      // Costas
      "Puxada Alta": "Puxada Frontal",
      // Adicione outros conforme necessário
    };

    // 1. CORRIGIR HISTÓRICO (Passado)
    const history = JSON.parse(localStorage.getItem('workout-history') || '[]');
    let historyChanges = 0;

    const newHistory = history.map(session => ({
      ...session,
      exercises: session.exercises.map(ex => {
        const trimmedName = ex.name.trim();
        // Verifica se o nome atual está na lista de "errados"
        if (replacements[trimmedName]) {
          historyChanges++;
          return { ...ex, name: replacements[trimmedName] }; 
        }
        return { ...ex, name: trimmedName }; 
      })
    }));

    // 2. CORRIGIR TREINOS ATUAIS (Futuro)
    const templates = JSON.parse(localStorage.getItem('workout-data') || '{}');
    let templateChanges = 0;
    
    const newTemplates = { ...templates };
    Object.keys(newTemplates).forEach(dayKey => {
      newTemplates[dayKey].exercises = newTemplates[dayKey].exercises.map(ex => {
         const trimmedName = ex.name.trim();
         if (replacements[trimmedName]) {
           templateChanges++;
           return { ...ex, name: replacements[trimmedName] };
         }
         return { ...ex, name: trimmedName };
      });
    });

    // 3. SALVAR TUDO
    localStorage.setItem('workout-history', JSON.stringify(newHistory));
    localStorage.setItem('workout-data', JSON.stringify(newTemplates));

    // 4. RECARREGAR PÁGINA
    alert(`Limpeza Concluída!\n\nHistórico alterado: ${historyChanges} vezes\nTreinos alterados: ${templateChanges} vezes.\n\nA página será recarregada.`);
    window.location.reload();
  };

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
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border bg-page/80 px-4 py-3 flex items-center justify-between shadow-lg mb-6">
        
        {/* ESQUERDA: Logo e Título */}
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                <Zap className="text-black fill-black" size={24} />
            </div>
            
            <h1 className="leading-none select-none font-black text-left text-lg md:text-2xl tracking-tighter">
                PROJETO<br/>
                <span className="text-primary">BOMBA</span>
            </h1>
        </div>

        {/* DIREITA: Streak e Menu */}
        <div className="flex items-center gap-3">
          
          {/* CONTADOR DE STREAK (FOGO) */}
          <div className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl border bg-card/50 
              ${(stats?.streak || 0) > 0 ? 'border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'border-border'}`}>
              
              <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest flex items-center gap-1">
                <Flame size={10} className="fill-orange-500 animate-pulse" />
                STREAK
              </span>
              <span className="text-xl font-black text-orange-400 leading-none">
                {stats?.streak || 0}
              </span>
          </div>

          {/* BOTÃO DO MENU */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-3 rounded-xl border border-border bg-card text-muted hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* 🔥 GAMIFICATION HUD (NOVO) */}
      <div className="px-1 mb-6">
         <UserLevel history={state.history} />
      </div>

     {/* NAVEGAÇÃO DE DIAS */}
      {state.view === 'workout' && state.workoutData && (
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
              // DADOS BÁSICOS
              activeDay={state.activeDay} 
              setActiveDay={setters.setActiveDay}
              workoutData={state.workoutData} 
              selectedDate={state.selectedDate} 
              setSelectedDate={actions.handleDateChange}
              
              // INPUTS
              weightInput={state.weightInput} setWeightInput={setters.setWeightInput} 
              waistInput={state.waistInput} setWaistInput={setters.setWaistInput} 
              latestStats={stats.latest} 
              
              // AÇÕES
              progress={state.progress} 
              toggleCheck={actions.toggleCheck} 
              updateSetData={actions.updateSetData} 
              updateSessionSets={actions.updateSessionSets} 
              sessionNote={state.sessionNote} 
              setSessionNote={setters.setSessionNote} 
              finishWorkout={actions.finishWorkout}
              saveBiometrics={actions.saveBiometrics}
              
              // HISTÓRICO
              bodyHistory={state.bodyHistory} 
              history={state.history}
              
              // TIMERS
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
        
        {state.view === 'import' && (
            <div className="flex items-center justify-center h-64 text-primary animate-pulse font-black uppercase tracking-widest">
                Inicializando Sistema...
            </div>
        )}
      </div>
      
      {/* NAVEGAÇÃO INFERIOR */}
      <CyberNav currentView={state.view} setView={setters.setView} />
      
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
                <span>Cyberpunk</span> {theme === 'driver' && <Zap size={16} />}
              </button>
              <button onClick={() => setTheme('matrix')} className="w-full p-4 rounded-xl border-2 bg-input border-border hover:border-[#00ff41] text-muted hover:text-[#00ff41] font-black uppercase tracking-wider transition-all flex justify-between">
                <span>Matrix</span> {theme === 'matrix' && <Zap size={16} />}
              </button>
              <button onClick={() => setTheme('light')} className="w-full p-4 rounded-xl border-2 bg-input border-border hover:border-blue-500 text-muted hover:text-blue-500 font-black uppercase tracking-wider transition-all flex justify-between">
                <span>Light</span> {theme === 'light' && <Zap size={16} />}
              </button>
              <button onClick={() => setTheme('spiderman')} className="w-full p-4 rounded-xl border-2 bg-input border-border hover:border-red-600 text-muted hover:text-red-600 font-black uppercase tracking-wider transition-all flex justify-between">
                <span>Aranha</span> {theme === 'spiderman' && <Zap size={16} />}
              </button>
            </div>
            
            {/* Opção para rodar manutenção caso precise um dia */}
            <div className="mt-auto space-y-4">
                <button onClick={runMaintenance} className="w-full py-3 rounded-lg border border-red-900/50 text-red-700 text-[10px] font-bold uppercase tracking-widest hover:bg-red-900/20">
                    🛠️ Resetar Nomes
                </button>
                <div className="text-center text-xs text-muted opacity-30">V.2.0.77</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutApp;