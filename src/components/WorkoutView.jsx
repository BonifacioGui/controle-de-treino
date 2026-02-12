import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, CheckCircle2, Circle, Trophy, Star, ChevronLeft, ChevronRight, Play, Pause, Trash2, Timer as TimerIcon, Camera, X, Skull, Zap, Sword, Crown, Scroll } from 'lucide-react'; 
import CyberCalendar from './CyberCalendar';
import RestTimer from './RestTimer'; 
import { DAILY_QUESTS_POOL } from '../utils/rpgSystem';
 

// --- FUNÇÕES AUXILIARES ---
const cleanString = (str) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 
};

const safeParseFloat = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(',', '.')) || 0;
};

const isSameExercise = (currentName, historyName) => {
  const currentKey = cleanString(currentName);
  const historyKey = cleanString(historyName);
  if (currentKey === historyKey) return true;
  if (historyKey.includes(currentKey)) return true;
  if (currentKey.includes(historyKey) && historyKey.length > 4) return true; 

  const synonyms = {
    "rosca45": ["incline", "banco", "inclinada", "45"],
    "roscadireta": ["barra", "w", "polia", "biceps", "stand", "direta", "alternada"],
    "crossover": ["poliaalta", "napoliaalta", "alta", "escapulas", "crossoverpoliaalta", "crossovernapoliaalta", "cross"],
    "elevacaopelvica": ["quadril", "pelvica", "elevacao"],
    "cadeiraabdutora": ["abducao", "abdutora"],
    "mesaflexora": ["flexora"],
    "cadeiraextensora": ["extensora"],
    "serrote": ["remadaunilateral", "unilateral"],
    "tricepspulley": ["tricepsnapolia", "tricepscorda", "barrareta", "volume", "polia"],
    "tricepscorda": ["tricepsnapolia", "tricepspulley"],
    "agachamentolivre": ["agachamento"],
    "legpress": ["legpress45", "pesafastados"],
    "abdominalinfra": ["abdominal"],
    "vacuum": ["stomachvacuum"],
    "supinoinclinado": ["supinoinclinado", "controlar", "halter"],
    "crucifixoinverso": ["halter", "postural", "cifose", "substituto"],
    "crucifixo": ["maquina", "peck", "deck", "fly", "reto", "inclinado", "peckdeck", "voador"]
  };

  if (synonyms[currentKey]) return synonyms[currentKey].some(syn => historyKey.includes(syn));
  if (synonyms[historyKey]) return synonyms[historyKey].some(syn => currentKey.includes(syn));
  return false;
};

const parseDateTimestamp = (dateStr) => {
    if (!dateStr) return 0;
    try {
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
        }
        return new Date(dateStr).getTime();
    } catch (e) { return 0; }
};

const calculate1RM = (weight, reps) => {
  const w = safeParseFloat(weight);
  const r = safeParseFloat(reps);
  if (!w || !r || r === 0) return null;
  return Math.round(w * (1 + r / 30));
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- COMPONENTE PRINCIPAL ---
const WorkoutView = ({ 
  activeDay, setActiveDay, workoutData, selectedDate, setSelectedDate, 
  weightInput, setWeightInput, waistInput, setWaistInput, 
  latestStats, progress, toggleCheck, updateSetData, 
  updateSessionSets, sessionNote, setSessionNote, finishWorkout,
  bodyHistory, history, saveBiometrics,
  timerState, closeTimer,
  workoutTimer, toggleWorkoutTimer, resetWorkoutTimer
}) => {

  // Estados de Interface
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [restTimerConfig, setRestTimerConfig] = useState({ isOpen: false, duration: 60 });
  const [questNotification, setQuestNotification] = useState(null); 

  // Estados de Gamificação
  const [bossStats, setBossStats] = useState({ hp: 5000, max: 5000, current: 5000, percent: 100, status: 'ALIVE' });
  const [combo, setCombo] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [shakingRow, setShakingRow] = useState(null);

  const days = Object.keys(workoutData || {}); 
  const currentDayIndex = days.indexOf(activeDay);
  const currentWorkout = workoutData[activeDay];

  // --- 🔥 AUTO CHECKER DE MISSÕES 🔥 ---
  const checkQuests = useCallback(() => {
    if (!currentWorkout) return;

    const tempSession = {
        exercises: currentWorkout.exercises.map((ex, i) => {
            const id = `${selectedDate}-${activeDay}-${i}`;
            const exData = progress[id];
            const validSets = (exData?.sets || []).filter(s => s.completed);
            
            return {
                name: ex.name,
                done: exData?.done || false,
                sets: validSets
            };
        }),
        note: sessionNote
    };

    const storedQuests = JSON.parse(localStorage.getItem('daily_quests') || '[]');
    let hasUpdates = false;
    const updatedQuests = storedQuests.map(quest => {
        if (quest.completed) return quest; 

        const questRule = DAILY_QUESTS_POOL.find(q => q.id === quest.id);
        if (questRule && questRule.check(tempSession)) {
            hasUpdates = true;
            setQuestNotification(quest.title); 
            setTimeout(() => setQuestNotification(null), 3000);
            return { ...quest, completed: true };
        }
        return quest;
    });

    if (hasUpdates) {
        localStorage.setItem('daily_quests', JSON.stringify(updatedQuests));
        window.dispatchEvent(new Event('storage'));
    }
  }, [currentWorkout, progress, selectedDate, activeDay, sessionNote]);

  useEffect(() => {
    const timer = setTimeout(checkQuests, 500);
    return () => clearTimeout(timer);
  }, [progress, checkQuests]);


  // --- SELEÇÃO DE DIA E BOSS ---
  useEffect(() => {
    if (!workoutData) return;
    const daysList = Object.keys(workoutData);
    if (daysList.length === 0) return;
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); 
    const adjustedIndex = (dayOfWeek + 6) % 7;
    const finalIndex = adjustedIndex % daysList.length;
    setActiveDay(daysList[finalIndex]);
  }, [selectedDate, workoutData]); 

  const bossName = useMemo(() => {
      const names = [
          "THAIS CARLA", "SERJÃO DOS FOGUETES", "GRACYANNE", "PETER GRIFFIN", 
          "ACREANO", "GORDÃO DA XJ", "MATHEUS FDP", "XANDÃO", "PADRE MARCELO",
          "PREGUIÇA", "98CM DE ABDOMEN", "TOGURO", "DAVY JONES", 
          "AÇAÍ NO FINAL DE SEMANA", "OS ENZOS", "BARRIGUINHA MOLE", 
          "A DIETA", "O ESPELHO", "A BALANÇA", "TREINO DE PERNA", "GORDO ALBERTO", "PERCY"
      ];
      if (!selectedDate) return names[0];
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const dayUniqueIndex = Math.floor(dateObj.getTime() / (24 * 60 * 60 * 1000));
      let trainOffset = 0;
      if (activeDay) {
         for(let i=0; i<activeDay.length; i++) trainOffset += activeDay.charCodeAt(i);
      }
      const finalIndex = (dayUniqueIndex + trainOffset) % names.length;
      return names[finalIndex];
  }, [selectedDate, activeDay]); 

  // --- CÁLCULO DE DANO DO BOSS ---
  useEffect(() => {
    if (!currentWorkout) return;
    let currentDamage = 0; 
    let maxHp = 0;          
    currentWorkout.exercises.forEach((ex, exIndex) => {
        const keyBase = `${selectedDate}-${activeDay}-${exIndex}`;
        const exProgress = progress[keyBase];
        if (exProgress?.sets) {
            exProgress.sets.forEach(setData => {
                if (setData?.completed) {
                    const w = safeParseFloat(setData.weight) || 10;
                    const r = safeParseFloat(setData.reps) || 0;
                    currentDamage += (w * r);
                }
            });
        }
    });
    
    
    const previousSession = history
        ?.filter(h => h.exercises.some(e => isSameExercise(e.name, currentWorkout.exercises[0].name))) 
        ?.sort((a, b) => parseDateTimestamp(b.date) - parseDateTimestamp(a.date))[0];

    if (previousSession) {
        let prevVolume = 0;
        previousSession.exercises.forEach(ex => {
            if (ex.sets) {
                ex.sets.forEach(s => {
                    const w = safeParseFloat(s.weight) || 0;
                    const r = safeParseFloat(s.reps) || 0;
                    prevVolume += (w * r);
                });
            }
        });
        maxHp = Math.max(Math.round(prevVolume * 1.05), 2000); 
    } else {
        maxHp = 5000; 
    }
    const remainingHp = Math.max(0, maxHp - currentDamage);
    const percent = (remainingHp / maxHp) * 100;
    setBossStats({
        max: maxHp, current: remainingHp, damageDone: currentDamage, percent: percent,
        status: percent <= 0 ? 'DEFEATED' : 'ALIVE'
    });
  }, [progress, currentWorkout, selectedDate, activeDay, history]);

  // --- HANDLERS ---
  const handlePrevDay = () => { setActiveDay(days[currentDayIndex === 0 ? days.length - 1 : currentDayIndex - 1]); };
  const handleNextDay = () => { setActiveDay(days[currentDayIndex === days.length - 1 ? 0 : currentDayIndex + 1]); };
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const isWeightSynced = bodyHistory?.some(h => h.date === selectedDate.split('-').reverse().join('/') && h.weight == weightInput && weightInput !== '');
  const isWaistSynced = bodyHistory?.some(h => h.date === selectedDate.split('-').reverse().join('/') && h.waist == waistInput && waistInput !== '');
  const hasStarted = workoutTimer?.elapsed > 0 || workoutTimer?.isRunning;
  const currentEntry = bodyHistory?.find(h => h.date === selectedDate.split('-').reverse().join('/'));
  const hasPhoto = !!currentEntry?.photo;

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => saveBiometrics(reader.result);
        reader.readAsDataURL(file);
    }
  };

  const openRestTimer = (seconds = 60) => { setRestTimerConfig({ isOpen: true, duration: seconds }); };

  const toggleSetComplete = (id, setIndex) => {
    const uniqueKey = `${id}-${setIndex}`;
    setShakingRow(uniqueKey);
    setTimeout(() => setShakingRow(null), 300);

    const currentStatus = progress[id]?.sets?.[setIndex]?.completed || false;
    if (!currentStatus) { 
          const now = Date.now();
          if (now - lastCheckTime < 60000) setCombo(prev => prev + 1);
          else setCombo(1);
          setLastCheckTime(now);
    }
    updateSetData(id, setIndex, 'completed', !currentStatus);
    if (!currentStatus) openRestTimer(60); 
  };

  return (
    <>
      <main className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 font-cyber pb-28 relative w-full z-0">
        
        {/* HEADER / CALENDÁRIO */}
        <div className="bg-card border border-border p-3 rounded-2xl relative overflow-hidden group shadow-sm z-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
          <div className="flex flex-col gap-3 relative z-10">
            <div onClick={() => setIsCalendarOpen(true)} className="flex items-center justify-between cursor-pointer group/calendar">
              <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-main italic leading-none">{selectedDate.split('-').reverse()[0]}</span>
                  <span className="text-xs font-bold text-muted uppercase">{dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest ml-2 opacity-50">DATA_DA_MISSÃO</span>
              </div>
              <div className={`p-1.5 rounded-lg border transition-all ${isCalendarOpen ? 'bg-primary text-black' : 'bg-input text-primary border-primary/30'}`}>
                <Calendar size={16} />
              </div>
            </div>
            <div className="h-[1px] w-full bg-border/30"></div>
            
            {!hasStarted ? (
              <button onClick={toggleWorkoutTimer} className="w-full py-3 rounded-lg bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-black transition-all group flex items-center justify-center gap-2 shadow-sm active:scale-95">
                  <Play size={18} className="fill-current" />
                  <span className="font-black italic text-sm tracking-widest">INICIAR TREINO</span>
              </button>
            ) : (
              <div className="flex items-center justify-between bg-black/40 border border-primary/30 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded transition-colors ${workoutTimer.isRunning ? 'bg-primary text-black animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                       <TimerIcon size={16} className={workoutTimer.isRunning ? "animate-spin-slow" : ""} />
                    </div>
                    <span className={`text-xl font-mono font-black leading-none tracking-wider ${workoutTimer.isRunning ? 'text-white' : 'text-gray-400'}`}>
                       {formatTime(workoutTimer.elapsed)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={toggleWorkoutTimer} className="p-1.5 rounded bg-gray-800 border border-gray-600 hover:border-primary hover:text-primary transition-all active:scale-95">
                          {workoutTimer.isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      </button>
                      <button onClick={resetWorkoutTimer} className="p-1.5 rounded bg-red-900/30 border border-red-800 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                          <Trash2 size={16} />
                      </button>
                  </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="relative">
                <span className={`absolute top-1.5 left-2 text-[6px] font-black uppercase tracking-widest z-10 ${isWeightSynced ? 'text-success' : 'text-muted'}`}>MASSA (KG)</span>
                <input type="number" step="0.1" placeholder={String(latestStats?.weight || '--')} value={weightInput || ''} onChange={(e) => setWeightInput(e.target.value)} 
                  className={`w-full bg-input border rounded-lg pt-5 pb-2 px-2 font-black text-center outline-none transition-all text-lg h-12 ${isWeightSynced ? 'border-success/50 text-success' : 'border-border text-main focus:border-primary'}`} 
                />
              </div>
              <div className="relative flex gap-1">
                 <div className="relative flex-1">
                    <span className={`absolute top-1.5 left-2 text-[6px] font-black uppercase tracking-widest z-10 ${isWaistSynced ? 'text-primary' : 'text-muted'}`}>CINTURA (CM)</span>
                    <input type="number" step="0.1" placeholder={String(latestStats?.waist || '--')} value={waistInput || ''} onChange={(e) => setWaistInput(e.target.value)} 
                      className={`w-full bg-input border rounded-lg pt-5 pb-2 px-2 font-black text-center outline-none transition-all text-lg h-12 ${isWaistSynced ? 'border-primary/50 text-primary' : 'border-border text-main focus:border-primary'}`} 
                    />
                 </div>
                 <label className={`w-10 h-12 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${hasPhoto ? 'border-secondary bg-secondary/20' : 'border-border bg-card hover:border-primary'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Camera size={16} className={hasPhoto ? "text-secondary" : "text-muted"} />
                 </label>
              </div>
            </div>
          </div>
        </div>

        {/* BOSS BATTLE */}
        <div className={`rounded-xl overflow-hidden border transition-all duration-500 shadow-xl mt-4 z-10 ${bossStats.status === 'DEFEATED' ? 'bg-black border-green-500/50' : 'bg-card border-red-900/30'}`}>
             <div className="p-3 flex justify-between items-end border-b border-white/5">
                <div className="flex items-center gap-2">
                   {bossStats.status === 'DEFEATED' ? <Trophy className="text-green-500 animate-bounce" size={24}/> : <Skull className="text-red-500 animate-pulse" size={24}/>}
                   <div>
                       <span className={`text-[9px] font-black uppercase tracking-[0.2em] block ${bossStats.status === 'DEFEATED' ? 'text-green-500' : 'text-red-500'}`}>
                           {bossStats.status === 'DEFEATED' ? 'VITÓRIA' : 'ALVO ATUAL:'}
                       </span>
                       {/* 🔥 NOME DO BOSS COM EFEITO GLITCH QUANDO DERROTADO 🔥 */}
                       <span className={`text-lg font-black text-main uppercase italic leading-none truncate max-w-[200px] block drop-shadow-md 
                        ${bossStats.status === 'DEFEATED' ? 'animate-glitch text-green-400' : ''}`}>
                          {bossName}
                      </span>
                   </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-bold text-muted uppercase block mb-0.5">HP RESTANTE</span>
                    <span className={`text-xl font-black leading-none block ${bossStats.status === 'DEFEATED' ? 'text-green-500' : 'text-red-500'}`}>
                        {bossStats.current.toLocaleString()} <span className="text-[10px] opacity-60">kg</span>
                    </span>
                </div>
             </div>
             <div className="h-5 bg-black relative">
                 <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${bossStats.status === 'DEFEATED' ? 'bg-green-500' : 'bg-gradient-to-r from-red-900 via-red-600 to-red-500'}`} style={{ width: `${bossStats.percent}%` }}>
                    <div className="absolute top-0 right-0 h-full w-[1px] bg-white/50 blur-[2px]"></div>
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/40 tracking-widest mix-blend-overlay z-10">
                     META: {bossStats.max.toLocaleString()} KG
                 </div>
             </div>
        </div>

        {/* NAV TREINOS */}
        <div className="relative py-1 z-0">
          <div className="flex items-center justify-between gap-2">
            <button onClick={handlePrevDay} className="p-2 rounded-lg bg-card border border-border text-muted hover:text-primary hover:border-primary active:scale-95 transition-all shadow-sm"><ChevronLeft size={20} /></button>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-[7px] font-black text-secondary tracking-[0.4em] uppercase mb-0.5 animate-pulse">PROTOCOLO</span>
              <h2 className="text-lg md:text-2xl font-black text-main uppercase italic leading-none drop-shadow-md">{workoutData?.[activeDay]?.title || 'Treino'}</h2>
              <span className="text-[9px] font-bold text-muted mt-0.5 uppercase">{activeDay}</span>
            </div>
            <button onClick={handleNextDay} className="p-2 rounded-lg bg-card border border-border text-muted hover:text-primary hover:border-primary active:scale-95 transition-all shadow-sm"><ChevronRight size={20} /></button>
          </div>
          <div className="flex justify-center gap-1 mt-2">
            {days.map((day, idx) => (
              <div key={day} onClick={() => setActiveDay(day)} className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${idx === currentDayIndex ? 'w-6 bg-primary shadow-[0_0_10px_rgb(var(--primary))]' : 'w-1.5 bg-border hover:bg-muted'}`}></div>
            ))}
          </div>
        </div>

        {/* LISTAGEM EXERCÍCIOS */}
        <div className="space-y-4 z-0">
          {workoutData?.[activeDay]?.exercises?.map((ex, i) => {
            const id = `${selectedDate}-${activeDay}-${i}`;
            const isDone = progress[id]?.done;
            const isTimeBased = ex.sets.toLowerCase().includes('min') || ex.sets.toLowerCase().includes('seg') || ex.sets.toLowerCase().includes('s') || !ex.sets.includes('x');
            const currentSetCount = isTimeBased ? 1 : (parseInt(progress[id]?.actualSets) || parseInt(ex.sets.split('x')[0]) || 0);

            const exerciseHistory = (history || [])
              .flatMap(s => s.exercises.map(e => ({...e, date: s.date})))
              .filter(e => isSameExercise(ex.name, e.name));

            const exercisePR = exerciseHistory.reduce((max, e) => {
                const sessionMax = Math.max(...(e.sets?.map(s => safeParseFloat(s.weight)) || [0]));
                return Math.max(max, sessionMax);
            }, 0);
            
            const lastWorkoutEntry = [...exerciseHistory]
                .sort((a, b) => parseDateTimestamp(b.date) - parseDateTimestamp(a.date))
                .find(entry => entry.sets && entry.sets.some(s => safeParseFloat(s.weight) > 0));
            
            const lastWeight = lastWorkoutEntry ? Math.max(...(lastWorkoutEntry.sets?.map(s => safeParseFloat(s.weight)) || [0])) : 0;
            const isBreakingPR = (progress[id]?.sets || []).some(s => safeParseFloat(s.weight) > exercisePR && exercisePR > 0);

            return (
              <div key={id} className={`p-4 rounded-xl border transition-all duration-500 relative overflow-hidden ${isBreakingPR ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] bg-yellow-400/5' : isDone ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] bg-black/40' : 'bg-card border-border hover:border-primary/30'}`}>
                {isDone && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-2 border-primary/10 text-primary/10 font-black text-5xl uppercase pointer-events-none whitespace-nowrap z-0 select-none">OK</div>)}
                {isBreakingPR && (
                    <div className="absolute top-0 right-0 z-30 animate-pulse">
                       <div className="bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
                           <Crown size={12} fill="black" /> NOVO RECORDE
                       </div>
                    </div>
                )}
                {exercisePR > 0 && !isBreakingPR && (
                  <div className="absolute top-0 right-10 px-1.5 py-0.5 rounded-b flex items-center gap-1 z-20 border-x border-b bg-input border-border text-muted">
                    <Trophy size={8} />
                    <span className="text-[7px] font-black uppercase tracking-widest">{exercisePR}KG</span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex-1">
                    <h3 className={`font-black text-lg leading-tight transition-colors flex items-center gap-2 ${isBreakingPR ? 'text-yellow-400' : isDone ? 'text-primary' : 'text-main'}`}>
                      {ex.name}
                      {isBreakingPR && <Star size={16} className="text-warning fill-warning animate-pulse" />}
                    </h3>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                        {lastWeight > 0 && (<span className="text-[9px] font-mono text-muted border border-border px-1 py-0 rounded bg-black/20">Último: {lastWeight}kg</span>)}
                        <p className="text-xs text-muted font-bold uppercase tracking-tighter italic">{ex.note}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleCheck(id)} className={`ml-3 p-1.5 rounded-full transition-all duration-500 border ${isDone ? 'border-primary text-primary shadow-[0_0_15px_var(--primary)] bg-transparent scale-110' : 'border-border text-muted hover:border-primary hover:text-white'}`}>
                    <CheckCircle2 size={24} />
                  </button>
                </div>
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2 bg-input/50 p-2 rounded-lg border border-border group-focus-within:border-primary/50 transition-all shadow-inner h-10">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">{isTimeBased ? 'Tempo' : 'Ciclos'}</span>
                    <input type={isTimeBased ? "text" : "number"} className="bg-transparent text-primary font-black outline-none w-16 text-center text-lg border-b border-primary/30" value={progress[id]?.actualSets || (isTimeBased ? ex.sets : "")} onChange={(e) => updateSessionSets(id, e.target.value)} />
                  </div>
                  
                  {!isTimeBased && (
                    <div className="grid gap-2">
                      {Array.from({ length: currentSetCount }).map((_, setIdx) => {
                        const isSetDone = progress[id]?.sets?.[setIdx]?.completed;
                        const uniqueSetKey = `${id}-${setIdx}`;
                        const isShaking = shakingRow === uniqueSetKey;
                        return (
                        <div key={setIdx} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${isShaking ? 'translate-x-2 bg-red-500/20' : ''} ${isSetDone ? 'bg-primary/10 border border-primary/30' : 'bg-transparent border border-transparent'}`}>
                          <button 
                              onClick={() => toggleSetComplete(id, setIdx)}
                              className={`h-8 w-8 flex items-center justify-center rounded-full border transition-all active:scale-90 ${isSetDone ? 'bg-primary text-black border-primary shadow-[0_0_8px_var(--primary)]' : 'bg-input border-border text-muted hover:border-primary hover:text-primary'}`}
                          >
                              {isSetDone ? <Sword size={16} /> : <Circle size={16} />}
                          </button>
                          <span className="text-xs font-black text-muted w-4">#{setIdx + 1}</span>
                          <div className="flex-1 flex gap-1.5 items-center">
                              <input 
                                type="text"
                                inputMode="decimal"
                                placeholder="KG" 
                                value={progress[id]?.sets?.[setIdx]?.weight || ""} 
                                onChange={(e) => updateSetData(id, setIdx, 'weight', e.target.value)} 
                                className={`w-full bg-input border rounded p-1.5 font-black text-lg outline-none transition-all text-center h-10 ${safeParseFloat(progress[id]?.sets?.[setIdx]?.weight) > exercisePR && exercisePR > 0 ? 'border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]' : 'border-border text-success focus:border-success/50'}`} 
                              />
                              <input type="text" placeholder="REPS" value={progress[id]?.sets?.[setIdx]?.reps || ""} onChange={(e) => updateSetData(id, setIdx, 'reps', e.target.value)} 
                                className="w-full bg-input border border-border rounded p-1.5 text-secondary font-black text-lg outline-none focus:border-secondary/50 transition-all text-center h-10" 
                              />
                              {(() => {
                                 const w = progress[id]?.sets?.[setIdx]?.weight;
                                 const r = progress[id]?.sets?.[setIdx]?.reps;
                                 const oneRM = calculate1RM(w, r);
                                 if (oneRM) return (<div className="flex flex-col justify-center items-center min-w-[25px] animate-in zoom-in duration-300"><span className="text-[5px] text-muted font-black uppercase leading-none">1RM</span><span className="text-[9px] text-secondary font-black font-mono leading-none">{oneRM}</span></div>);
                              })()}
                            </div>
                          </div>
                      )})}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* COMBO METER */}
        {combo > 1 && (
            <div className="fixed bottom-24 right-4 z-50 pointer-events-none animate-in slide-in-from-right duration-300">
                <div className="relative flex flex-col items-end">
                    <Zap className="text-yellow-400 fill-yellow-400 absolute -top-4 -right-2 animate-bounce" size={24} />
                    <div className="text-4xl font-black italic text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ transform: 'rotate(-5deg)' }}>
                        {combo}x
                    </div>
                    <span className="text-[8px] font-black bg-black text-yellow-400 px-1 uppercase tracking-widest border border-yellow-400">COMBO</span>
                </div>
            </div>
        )}

        {/* NOTIFICAÇÃO DE MISSÃO COMPLETADA */}
        {questNotification && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-500">
             <div className="bg-yellow-500 text-black px-6 py-3 rounded-full font-black border-4 border-black shadow-[0_0_20px_rgba(234,179,8,0.6)] flex items-center gap-3">
                <Scroll size={20} className="animate-bounce" />
                <div className="flex flex-col">
                   <span className="text-[8px] uppercase tracking-widest leading-none">Missão Cumprida</span>
                   <span className="text-sm italic uppercase leading-none">{questNotification}</span>
                </div>
             </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="space-y-4 pt-6 pb-4 z-0">
          <textarea placeholder="Relatório de danos..." className="w-full bg-card border border-border rounded-xl p-3 text-lg font-bold h-24 outline-none focus:border-primary/50 transition-all text-main placeholder-muted" value={sessionNote} onChange={(e) => setSessionNote(e.target.value)} />
          
          <button 
             onClick={finishWorkout} 
             className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary py-4 font-black text-white shadow-[0_5px_20px_rgba(var(--primary),0.3)] active:scale-[0.97] transition-all hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] z-10"
          >
             <span className="relative z-10 uppercase tracking-[0.3em] text-xs italic flex items-center justify-center gap-2">
               <Star size={14} fill="white" /> FINALIZAR MISSÃO
             </span>
             <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </button>
        </div>

        {isCalendarOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setIsCalendarOpen(false)}>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsCalendarOpen(false)} className="absolute -top-12 right-0 p-2 text-muted hover:text-primary transition-all"><X size={32} /></button>
              <CyberCalendar selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
            </div>
          </div>
        )}
      </main>

      {/* TIMERS E MODAIS - ALTO Z-INDEX PARA NÃO SOBREPOR */}
      <div className="relative z-[300]">
        {timerState && timerState.active && <RestTimer initialSeconds={timerState.seconds} onClose={closeTimer} />}
        {restTimerConfig.isOpen && <RestTimer initialSeconds={restTimerConfig.duration} onClose={() => setRestTimerConfig({ ...restTimerConfig, isOpen: false })} />}
      </div>
    </>
  );
};

export default WorkoutView;