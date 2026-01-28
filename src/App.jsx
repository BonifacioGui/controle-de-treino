import React, { useState, useEffect } from 'react';
import { History, Settings, Scale, Target, TrendingDown } from 'lucide-react';
import { initialWorkoutData } from './workoutData';

// Componentes modulares
import WorkoutView from './components/WorkoutView';
import HistoryView from './components/HistoryView';
import ManageView from './components/ManageView';
import StatsView from './components/StatsView';

const WorkoutApp = () => {
  const [view, setView] = useState('workout');
  const [activeDay, setActiveDay] = useState('SEG');
  const [sessionNote, setSessionNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');

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

  useEffect(() => {
    localStorage.setItem('workout_plan', JSON.stringify(workoutData));
    localStorage.setItem('daily_progress', JSON.stringify(progress));
    localStorage.setItem('workout_history', JSON.stringify(history));
    localStorage.setItem('body_history', JSON.stringify(bodyHistory));
  }, [workoutData, progress, history, bodyHistory]);

  const latestStats = bodyHistory[0] || { weight: '--', waist: '98' };

  // --- LÓGICA DE ATUALIZAÇÃO DO PROGRESSO (CORRIGIDA) ---

  const updateSessionSets = (id, value) => {
    setProgress(prev => ({
      ...prev,
      [id]: { ...prev[id], actualSets: value }
    }));
  };

  const updateSetData = (id, index, field, value) => {
    setProgress(prev => {
      const currentEx = prev[id] || { sets: [] };
      const newSets = [...(currentEx.sets || [])];
      
      // Garante que o array tenha espaço para o índice que estamos editando
      while (newSets.length <= index) {
        newSets.push({ weight: '', reps: '' });
      }
      
      newSets[index] = { ...newSets[index], [field]: value };
      return { ...prev, [id]: { ...currentEx, sets: newSets } };
    });
  };

  const toggleCheck = (id) => {
    setProgress(prev => ({
      ...prev,
      [id]: { ...prev[id], done: !prev[id]?.done }
    }));
  };

  const finishWorkout = () => {
    const dateDisplay = selectedDate.split('-').reverse().join('/');
    
    const session = {
      id: Date.now(),
      date: dateDisplay,
      dayName: activeDay,
      note: sessionNote,
      exercises: workoutData[activeDay].exercises.map((ex, i) => {
        const p = progress[`${activeDay}-${i}`];
        return { 
          name: ex.name, 
          sets: p?.sets || [], // Salva o array de séries individualizadas
          done: p?.done || false 
        };
      })
    };

    if (weightInput || waistInput) {
      const bodyEntry = {
        id: Date.now() + 1,
        date: dateDisplay,
        weight: weightInput || latestStats.weight,
        waist: waistInput || latestStats.waist
      };
      setBodyHistory([bodyEntry, ...bodyHistory]);
    }

    setHistory([session, ...history]);
    setProgress({}); // Limpa o progresso do dia
    setSessionNote('');
    setWeightInput('');
    setWaistInput('');
    alert("Treino registrado com sucesso!");
    setView('history');
  };

  const deleteEntry = (id, type) => {
    if (window.confirm("Deseja excluir este registro?")) {
      if (type === 'body') setBodyHistory(prev => prev.filter(item => item.id !== id));
      else setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  // Funções CRUD para ManageView
  const addExercise = (day) => {
    const newEx = { name: "Novo Exercício", sets: "3x12", target: "0kg", note: "" };
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans pb-24 selection:bg-indigo-500/30">
      
      <header className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-black text-indigo-500 italic tracking-tighter">MEU TREINO</h1>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Scale size={12} className="text-indigo-400" /> Peso: <span className="text-slate-100">{latestStats.weight}kg</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Target size={12} className="text-slate-500" /> Cintura: <span className="text-slate-100">{latestStats.waist}cm</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('stats')} className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-emerald-500"><TrendingDown size={20}/></button>
          <button onClick={() => setView('history')} className={`p-2 rounded-lg border transition-all ${view === 'history' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}><History size={20} /></button>
          <button onClick={() => setView('manage')} className={`p-2 rounded-lg border transition-all ${view === 'manage' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}><Settings size={20} /></button>
        </div>
      </header>

      <nav className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
        {Object.keys(workoutData).map(day => (
          <button key={day} onClick={() => { setActiveDay(day); setView('workout'); }} className={`px-5 py-2 rounded-xl font-bold transition-all min-w-[70px] ${activeDay === day && view === 'workout' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>{day}</button>
        ))}
      </nav>

      {view === 'workout' && (
        <WorkoutView 
          activeDay={activeDay} workoutData={workoutData} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          weightInput={weightInput} setWeightInput={setWeightInput} waistInput={waistInput} setWaistInput={setWaistInput}
          latestStats={latestStats} progress={progress} toggleCheck={toggleCheck} updateSetData={updateSetData}
          updateSessionSets={updateSessionSets} sessionNote={sessionNote} setSessionNote={setSessionNote} finishWorkout={finishWorkout}
        />
      )}

      {view === 'manage' && (
        <ManageView activeDay={activeDay} workoutData={workoutData} addExercise={addExercise} removeExercise={removeExercise} editExerciseBase={editExerciseBase} setView={setView} />
      )}

      {view === 'history' && (
        <HistoryView history={history} bodyHistory={bodyHistory} deleteEntry={deleteEntry} setView={setView} />
      )}

      {view === 'stats' && (
        <StatsView bodyHistory={bodyHistory} setView={setView} />
      )}
    </div>
  );
};

export default WorkoutApp;