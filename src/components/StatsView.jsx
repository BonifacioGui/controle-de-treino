import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { ChevronLeft, Activity, Target, Award, Trophy, TrendingUp } from 'lucide-react';

// --- HELPER: Unifica nomes ---
const getCanonicalName = (rawName) => {
  if (!rawName) return "";
  let clean = rawName.split('(')[0].trim();
  const lower = clean.toLowerCase();

  if (lower.includes("crossover")) return "Crossover";
  if (lower.includes("supino reto")) return "Supino Reto";
  if (lower.includes("supino inclinado")) return "Supino Inclinado";
  if (lower.includes("leg press")) return "Leg Press";
  if (lower.includes("elevacao lateral")) return "Elevação Lateral";
  if (lower.includes("crucifixo inverso")) return "Crucifixo Inverso";
  if (lower.includes("puxada neutra")) return "Puxada Neutra";
  if (lower.includes("remada baixa")) return "Remada Baixa";
  if (lower.includes("serrote")) return "Serrote";
  if (lower.includes("triceps pulley")) return "Tríceps Pulley";
  if (lower.includes("triceps corda")) return "Tríceps Corda";
  if (lower.includes("rosca direta")) return "Rosca Direta";
  if (lower.includes("rosca martelo")) return "Rosca Martelo";
  if (lower.includes("stiff")) return "Stiff";
  if (lower.includes("abducao") || lower.includes("abdutora")) return "Cadeira Abdutora";
  if (lower.includes("extensora")) return "Cadeira Extensora";
  if (lower.includes("flexora")) return "Mesa Flexora";
  if (lower.includes("pelvica")) return "Elevação Pélvica";

  return clean;
};

const StatsView = ({ bodyHistory, history, setView, workoutData }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [currentTheme, setCurrentTheme] = useState('driver');

  const safeHistory = Array.isArray(history) ? history : [];
  const safeBodyHistory = Array.isArray(bodyHistory) ? bodyHistory : [];

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme') || 'driver';
    setCurrentTheme(theme);
  }, []);

  const chartColors = {
    driver: { primary: '#22d3ee', secondary: '#ec4899', grid: '#1e293b', text: '#94a3b8' },
    light:  { primary: '#00a0c8', secondary: '#ec4899', grid: '#e2e8f0', text: '#475569' },
    matrix: { primary: '#00ff41', secondary: '#008f11', grid: '#003b00', text: '#008f11' },
    spiderman: { primary: '#ef4444', secondary: '#facc15', grid: '#000000', text: '#000000' }
  };
  
  const colors = chartColors[currentTheme] || chartColors.driver;

  // Lista Unificada
  const availableExercises = useMemo(() => {
    const uniqueSet = new Set();
    
    // Do Histórico
    safeHistory.forEach(session => {
        session.exercises.forEach(ex => uniqueSet.add(getCanonicalName(ex.name)));
    });
    // Do Plano Atual (para garantir que apareçam mesmo sem histórico)
    if (workoutData) {
        Object.values(workoutData).forEach(day => {
            if (day.exercises) day.exercises.forEach(ex => uniqueSet.add(getCanonicalName(ex.name)));
        });
    }
    return Array.from(uniqueSet).sort();
  }, [safeHistory, workoutData]);

  const biometryData = [...safeBodyHistory]
    .sort((a, b) => {
      const dateA = a.date.split('/').reverse().join('-');
      const dateB = b.date.split('/').reverse().join('-');
      return new Date(dateA) - new Date(dateB);
    })
    .map(entry => ({
      date: entry.date.split('/').slice(0, 2).join('/'),
      peso: parseFloat(entry.weight) || 0,
      cintura: parseFloat(entry.waist) || 0
    }));

  const hallOfFame = useMemo(() => {
    const prs = {};
    safeHistory.forEach(session => {
      session.exercises.forEach(ex => {
        const cleanName = getCanonicalName(ex.name);
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0), 0);
        if (maxWeight > (prs[cleanName] || 0)) prs[cleanName] = maxWeight;
      });
    });
    return Object.entries(prs).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [safeHistory]);

  const loadData = useMemo(() => {
      if (!selectedExercise) return [];
      return safeHistory
        .filter(session => session.exercises.some(ex => getCanonicalName(ex.name) === selectedExercise))
        .map(session => {
          const ex = session.exercises.find(e => getCanonicalName(e.name) === selectedExercise);
          if (!ex) return null;
          const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0), 0);
          return {
            date: session.date.split('/').slice(0, 2).join('/'),
            carga: maxWeight,
            fullDate: session.date
          };
        })
        .filter(item => item !== null && item.carga > 0)
        .sort((a, b) => {
          const parseDate = (d) => {
             const [day, month, year] = d.split('/');
             return new Date(year, month - 1, day).getTime();
          };
          return parseDate(a.fullDate) - parseDate(b.fullDate);
        });
  }, [safeHistory, selectedExercise]);

  const personalRecord = loadData.length > 0 ? Math.max(...loadData.map(d => d.carga)) : 0;

  return (
    <main className="space-y-8 animate-in fade-in duration-500 font-cyber pb-32">      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-primary/20 pb-4">
        <button onClick={() => setView('workout')} className="p-3 bg-card rounded-xl border border-primary/50 text-primary hover:bg-input transition-all">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-black italic neon-text-cyan uppercase tracking-tighter text-primary">CENTRAL DE DADOS</h2>
      </div>

      {/* BIOMETRIA */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-muted uppercase tracking-widest flex items-center gap-2 px-1">
          <Activity size={16} className="text-primary" /> BIOMETRIA
        </h3>
        
        <div className="bg-card border border-border p-4 rounded-3xl h-72 w-full min-w-0 backdrop-blur-sm relative shadow-xl overflow-hidden">
          {biometryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biometryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCintura" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.secondary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} opacity={0.3} />
                <XAxis dataKey="date" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.primary}`, borderRadius: '12px', fontSize: '14px', color: 'var(--text-main)', fontWeight: 'bold' }} 
                />
                <Area type="monotone" dataKey="peso" name="Peso (kg)" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
                <Area type="monotone" dataKey="cintura" name="Cintura (cm)" stroke={colors.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorCintura)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-muted text-sm font-bold uppercase tracking-widest opacity-50">
               Sem dados biométricos
             </div>
          )}
        </div>
      </section>

      {/* HALL OF FAME */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-muted uppercase tracking-widest flex items-center gap-2 px-1">
          <Trophy size={16} className="text-warning" /> RECORDES (TOP 6)
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {hallOfFame.length > 0 ? (
            hallOfFame.map(([name, weight]) => (
              <div key={name} className="bg-card/80 p-4 rounded-2xl border border-warning/30 relative overflow-hidden group hover:border-warning/60 transition-all shadow-lg">
                <p className="text-[10px] font-black text-warning uppercase mb-1 tracking-widest opacity-70">RECORD</p>
                <h4 className="text-sm font-bold text-main truncate mb-1" title={name}>{name}</h4>
                <p className="text-3xl font-black text-main italic">{weight}<span className="text-sm text-warning ml-1">KG</span></p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center p-6 border-2 border-dashed border-border rounded-xl text-muted text-xs font-bold uppercase tracking-widest opacity-50">
              Complete treinos para gerar recordes.
            </div>
          )}
        </div>
      </section>

      {/* PROGRESSÃO */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-black text-muted uppercase tracking-widest flex items-center gap-2 truncate">
            <Target size={16} className="text-success" /> EVOLUÇÃO DE CARGA
          </h3>
          <select 
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-card border border-success/30 text-success text-sm font-bold p-3 rounded-xl outline-none focus:border-success w-full"
          >
            <option value="">-- SELECIONE UM EXERCÍCIO --</option>
            {availableExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div className="bg-card border border-border p-4 rounded-3xl h-72 w-full min-w-0 backdrop-blur-sm relative shadow-xl overflow-hidden">
          {selectedExercise && loadData.length > 0 ? (
            <>
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-success/10 border border-success/30 px-3 py-1 rounded-full backdrop-blur-md">
                <Award size={14} className="text-success" />
                <span className="text-xs font-black text-success uppercase tracking-widest">PR: {personalRecord}KG</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loadData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={30} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.secondary}`, borderRadius: '12px', fontSize: '14px', color: 'var(--text-main)', fontWeight: 'bold' }} 
                    itemStyle={{ color: colors.secondary }}
                  />
                  <ReferenceLine y={personalRecord} stroke={colors.secondary} strokeDasharray="5 5" opacity={0.5} />
                  <Line type="monotone" dataKey="carga" name="Carga Max" stroke={colors.secondary} strokeWidth={4} dot={{ fill: colors.secondary, r: 5 }} activeDot={{ r: 7 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted text-center px-10 opacity-60">
              <DumbbellIcon size={40} className="mb-4 opacity-30" />
              <p className="text-xs font-bold uppercase tracking-widest">
                {selectedExercise ? "Sem dados suficientes." : "Selecione acima."}
              </p>
            </div>
          )}
        </div>
      </section>

      <button onClick={() => setView('workout')} className="w-full py-5 bg-card border border-border rounded-xl font-black text-sm tracking-widest text-muted hover:text-primary hover:border-primary/50 transition-all uppercase mt-6 shadow-sm active:scale-[0.98]">
        VOLTAR
      </button>

    </main>
  );
};

const DumbbellIcon = ({size, className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
);

export default StatsView;