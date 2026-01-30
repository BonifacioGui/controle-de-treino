import React, { useState, useEffect } from 'react';
import { Sun, Moon, Terminal } from 'lucide-react'; // Ícones do Seletor de Tema
import { initialWorkoutData } from './workoutData';
import { supabase } from './supabaseClient'; 


// Componentes modulares
import WorkoutView from './components/WorkoutView';
import HistoryView from './components/HistoryView';
import ManageView from './components/ManageView';
import StatsView from './components/StatsView';
import CyberNav from './components/CyberNav';
import MatrixRain from './components/MatrixRain'; // Efeito Matrix

const WorkoutApp = () => {
  // 1. Estado do Tema (Padrão: 'driver')
  const [theme, setTheme] = useState('driver');
  
  // Estados de Navegação e Dados
  const [view, setView] = useState('workout');
  const [activeDay, setActiveDay] = useState('SEG');
  const [sessionNote, setSessionNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [showMeme, setShowMeme] = useState(false);

  // Estados com persistência híbrida (Cloud + Local Cache)
  const [workoutData, setWorkoutData] = useState(() => {
    const saved = localStorage.getItem('workout_plan');
    return saved ? JSON.parse(saved) : initialWorkoutData;
  });

  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('daily_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('workout_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [bodyHistory, setBodyHistory] = useState(() => {
    const saved = localStorage.getItem('body_history');
    return saved ? JSON.parse(saved) : [];
  });

  // --- EFEITO DE TEMA ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- PIPELINE DE SINCRONIZAÇÃO INICIAL (FETCH) ---
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        // 1. Busca Biometria
        const { data: bodyData, error: bodyError } = await supabase
          .from('body_stats')
          .select('*')
          .order('date', { ascending: false });
        
        if (bodyError) console.error("Falha no fetch biometria:", bodyError.message);

        if (bodyData) {
          const formattedBody = bodyData.map(b => ({
            ...b,
            date: b.date.split('-').reverse().join('/')
          }));
          setBodyHistory(formattedBody);
        }

        // 2. Busca Histórico de Treinos
        const { data: trainData, error: trainError } = await supabase
          .from('workout_history')
          .select('*')
          .order('workout_date', { ascending: false });

        if (trainError) console.error("Falha no fetch treinos:", trainError.message);

        if (trainData) {
          setHistory(trainData.map(t => ({
            ...t,
            id: t.id,
            date: t.workout_date.split('-').reverse().join('/'),
            dayName: t.workout_name
          })));
        }
      } catch (err) {
        console.error("Mainframe Offline: Operando em modo cache local.", err);
      }
    };

    fetchCloudData();
  }, []);

  // Cache local para redundância
  useEffect(() => {
    localStorage.setItem('workout_plan', JSON.stringify(workoutData));
    localStorage.setItem('daily_progress', JSON.stringify(progress));
    localStorage.setItem('workout_history', JSON.stringify(history));
    localStorage.setItem('body_history', JSON.stringify(bodyHistory));
  }, [workoutData, progress, history, bodyHistory]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    const formattedDate = newDate.split('-').reverse().join('/');
    const entryForDate = bodyHistory.find(h => h.date === formattedDate);
    setWeightInput(entryForDate ? entryForDate.weight : '');
    setWaistInput(entryForDate ? entryForDate.waist : '');
  };

  // --- COMMIT DE BIOMETRIA NO BANCO ---
  const saveBiometrics = async () => {
    if (!weightInput && !waistInput) return;

    const dateDisplay = selectedDate.split('-').reverse().join('/');
    const sqlDate = selectedDate; 

    const newEntry = {
      date: sqlDate,
      weight: weightInput ? parseFloat(weightInput) : null,
      waist: waistInput ? parseFloat(waistInput) : null
    };

    try {
      const { error: upsertError } = await supabase
        .from('body_stats')
        .upsert(newEntry, { onConflict: 'date' });

      if (upsertError) console.error("Erro no upload:", upsertError.message);

      if (!upsertError) {
        const updatedHistory = [...bodyHistory];
        const idx = updatedHistory.findIndex(h => h.date === dateDisplay);
        const displayEntry = { ...newEntry, date: dateDisplay, id: Date.now() };

        if (idx >= 0) updatedHistory[idx] = displayEntry;
        else updatedHistory.unshift(displayEntry);
        
        setBodyHistory(updatedHistory);
      }
    } catch (err) {
      console.error("Erro no upload biométrico:", err);
    }
  };

  const latestStats = bodyHistory[0] || { weight: '--', waist: '--' };

  // Handlers de Treino
  const updateSessionSets = (id, value) => {
    setProgress(prev => ({ ...prev, [id]: { ...prev[id], actualSets: value } }));
  };

  const updateSetData = (id, index, field, value) => {
    setProgress(prev => {
      const currentEx = prev[id] || { sets: [] };
      const newSets = [...(currentEx.sets || [])];
      while (newSets.length <= index) newSets.push({ weight: '', reps: '' });
      newSets[index] = { ...newSets[index], [field]: value };
      return { ...prev, [id]: { ...currentEx, sets: newSets } };
    });
  };

  const toggleCheck = (id) => {
    setProgress(prev => ({ ...prev, [id]: { ...prev[id], done: !prev[id]?.done } }));
  };

  // --- UPLOAD DA SESSÃO PARA O BANCO ---
  const finishWorkout = async () => {
    await saveBiometrics();

    const siuuuSound = new Audio('https://www.myinstants.com/media/sounds/cr7-siiii.mp3');
    siuuuSound.volume = 0.5; 
    siuuuSound.play().catch(e => console.warn("Áudio bloqueado pelo navegador:", e));
    
    const session = {
      workout_date: selectedDate,
      workout_name: activeDay,
      note: sessionNote,
      exercises: workoutData[activeDay].exercises.map((ex, i) => {
        const p = progress[`${selectedDate}-${activeDay}-${i}`];
        return { name: ex.name, sets: p?.sets || [], done: p?.done || false };
      })
    };

    try {
      const { data, error: insertError } = await supabase
        .from('workout_history')
        .insert([session])
        .select();

      if (insertError) console.error("Erro na inserção:", insertError.message);

      if (!insertError && data) {
        const savedSession = {
          ...session,
          id: data[0].id,
          date: selectedDate.split('-').reverse().join('/')
        };
        setHistory([savedSession, ...history]);
        setProgress({});
        setSessionNote('');
        setShowMeme(true);
        setTimeout(() => {
          setShowMeme(false);
          setView('history');
        }, 3500);
      }
    } catch (err) {
      console.error("Erro ao finalizar sessão:", err);
    }
  };

  const deleteEntry = async (id, type) => {
    if (window.confirm("ELIMINAR REGISTRO DO MAINFRAME?")) {
      try {
        const table = type === 'body' ? 'body_stats' : 'workout_history';
        const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
        
        if (deleteError) console.error("Erro na deleção:", deleteError.message);

        if (!deleteError) {
          if (type === 'body') setBodyHistory(prev => prev.filter(item => item.id !== id));
          else setHistory(prev => prev.filter(item => item.id !== id));
        }
      } catch (e) {
        console.error("Erro na deleção:", e);
      }
    }
  };

  // Funções de Edição (ManageView)
  const addExercise = (day) => {
    const newEx = { name: "Novo Exercício", sets: "3x12", note: "" };
    setWorkoutData({ ...workoutData, [day]: { ...workoutData[day], exercises: [...workoutData[day].exercises, newEx] } });
  };

  const removeExercise = (day, index) => {
    const filtered = workoutData[day].exercises.filter((_, i) => i !== index);
    setWorkoutData({ ...workoutData, [day]: { ...workoutData[day], exercises: filtered } });
  };

  const editExerciseBase = (day, index, field, value) => {
    const updatedExs = [...workoutData[day].exercises];
    updatedExs[index][field] = value;
    setWorkoutData({ ...workoutData, [day]: { ...workoutData[day], exercises: updatedExs } });
  };

  return (
    // USANDO VARIÁVEIS DE TEMA: bg-page, text-main, transition-colors
    <div className="min-h-screen bg-page text-main p-4 font-cyber pb-32 cyber-grid transition-colors duration-500 relative">
      
      {/* Efeito Matrix (Só aparece no tema 'matrix') */}
      {theme === 'matrix' && <MatrixRain />}

      {showMeme && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 animate-in zoom-in duration-300">
          <video 
            src="https://i.imgur.com/1kSZ05R.mp4" 
            className="w-full max-w-sm rounded-3xl border-4 border-cyan-500 shadow-[0_0_50px_rgba(0,243,255,0.8)]" 
            autoPlay loop muted playsInline
          />
          <h2 className="text-4xl font-black mt-8 neon-text-cyan italic uppercase tracking-tighter text-center">
            SIIIIIIIIIIIU!
          </h2>
        </div>
      )}

      {/* HEADER DINÂMICO */}
      <header className="flex justify-between items-start mb-10 border-b border-primary/30 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-primary italic neon-text-cyan tracking-tighter">
            PROJETO<span className="text-secondary">.BOMBA</span>
          </h1>
          <div className="mt-4 flex gap-4">
            <div className="bg-card/60 p-2 rounded-lg border border-primary/20 shadow-inner">
              <p className="text-[8px] text-primary uppercase font-black mb-1 tracking-widest leading-none">Massa_Ref</p>
              <p className="text-lg font-bold">{latestStats.weight}KG</p>
            </div>
            <div className="bg-card/60 p-2 rounded-lg border border-secondary/20 shadow-inner">
              <p className="text-[8px] text-secondary uppercase font-black mb-1 tracking-widest leading-none">Cintura_Ref</p>
              <p className="text-lg font-bold">{latestStats.waist}CM</p>
            </div>
          </div>
        </div>
        
        {/* SELETOR DE TEMAS */}
        <div className="bg-card/50 backdrop-blur-md p-1 rounded-xl border border-border flex flex-col gap-1 z-50 shadow-xl">
           <button onClick={() => setTheme('light')} className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-primary'}`} title="Modo Claro">
             <Sun size={16} />
           </button>
           <button onClick={() => setTheme('driver')} className={`p-2 rounded-lg transition-all ${theme === 'driver' ? 'bg-primary text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-muted hover:text-primary'}`} title="Modo Driver">
             <Moon size={16} />
           </button>
           <button onClick={() => setTheme('matrix')} className={`p-2 rounded-lg transition-all ${theme === 'matrix' ? 'bg-primary text-black shadow-[0_0_10px_#0f0]' : 'text-muted hover:text-primary'}`} title="Modo Matrix">
             <Terminal size={16} />
           </button>
        </div>
      </header>

      {/* NAVEGAÇÃO DE DIAS */}
      <nav className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2 relative z-10">
        {Object.keys(workoutData).map(day => (
          <button 
            key={day} 
            onClick={() => { setActiveDay(day); setView('workout'); }} 
            className={`px-6 py-3 rounded-lg font-black transition-all border-2 flex-shrink-0
              ${activeDay === day && view === 'workout' 
                ? 'bg-primary border-primary text-black shadow-[0_0_20px_rgba(var(--primary),0.5)]' 
                : 'bg-card text-muted border-border hover:border-primary/50'}`}
          >
            {day}
          </button>
        ))}
      </nav>

      <div className="relative z-10">
        {view === 'workout' && (
          <WorkoutView 
            activeDay={activeDay} workoutData={workoutData} 
            selectedDate={selectedDate} setSelectedDate={handleDateChange}
            weightInput={weightInput} setWeightInput={setWeightInput} 
            waistInput={waistInput} setWaistInput={setWaistInput} 
            latestStats={latestStats} progress={progress} 
            toggleCheck={toggleCheck} updateSetData={updateSetData} 
            updateSessionSets={updateSessionSets} sessionNote={sessionNote} 
            setSessionNote={setSessionNote} finishWorkout={finishWorkout}
            bodyHistory={bodyHistory} saveBiometrics={saveBiometrics}
            history={history} // 🔥 CORREÇÃO CRÍTICA: Passando histórico para cálculo de PR
          />
        )}
        {view === 'manage' && (
          <ManageView activeDay={activeDay} workoutData={workoutData} setWorkoutData={setWorkoutData} addExercise={addExercise} removeExercise={removeExercise} editExerciseBase={editExerciseBase} setView={setView} />
        )}
        {view === 'history' && <HistoryView history={history} bodyHistory={bodyHistory} deleteEntry={deleteEntry} setView={setView} />}
        {view === 'stats' && <StatsView bodyHistory={bodyHistory} history={history} setView={setView} workoutData={workoutData} />}
      </div>
      
      <CyberNav currentView={view} setView={setView} />
    </div>
  );
};

export default WorkoutApp;