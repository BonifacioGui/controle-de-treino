import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, BarChart, Bar } from 'recharts';
import { ChevronLeft, Activity, Target, Award, Trophy, TrendingUp, AlertTriangle } from 'lucide-react';

const StatsView = ({ bodyHistory, history, setView }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [currentTheme, setCurrentTheme] = useState('driver');

  // --- 1. PROTEÇÃO CONTRA DADOS VAZIOS ---
  const safeHistory = Array.isArray(history) ? history : [];
  const safeBodyHistory = Array.isArray(bodyHistory) ? bodyHistory : [];

  // --- TEMA ---
  useEffect(() => {
    if (typeof document !== 'undefined') {
        const theme = document.documentElement.getAttribute('data-theme') || 'driver';
        setCurrentTheme(theme);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'driver');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const chartColors = {
    driver: { primary: '#22d3ee', secondary: '#ec4899', grid: '#1e293b', text: '#64748b' },
    light:  { primary: '#2563eb', secondary: '#f59e0b', grid: '#e2e8f0', text: '#94a3b8' },
    matrix: { primary: '#00ff41', secondary: '#008f11', grid: '#003b00', text: '#008f11' },
    spiderman: { primary: '#ef4444', secondary: '#facc15', grid: '#000000', text: '#000000' }
  };
  
  const colors = chartColors[currentTheme] || chartColors.driver;

  // LISTA DE EXERCÍCIOS
  const availableExercises = safeHistory.length > 0 ? [...new Set(
    safeHistory.flatMap(session => session.exercises.map(ex => ex.name))
  )].sort() : [];

  // BIOMETRIA (Peso + Cintura)
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

  // HALL OF FAME
  const calculateAllPRs = () => {
    const prs = {};
    if (safeHistory.length === 0) return [];
    
    safeHistory.forEach(session => {
      session.exercises.forEach(ex => {
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0), 0);
        if (maxWeight > (prs[ex.name] || 0)) {
            prs[ex.name] = maxWeight;
        }
      });
    });
    return Object.entries(prs).sort((a, b) => b[1] - a[1]).slice(0, 6); // Mostra Top 6
  };

  const hallOfFame = calculateAllPRs();

  // DADOS DO GRÁFICO DE CARGA
  const loadData = safeHistory
    .filter(session => session.exercises.some(ex => ex.name === selectedExercise))
    .map(session => {
      const ex = session.exercises.find(e => e.name === selectedExercise);
      const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0), 0);
      return {
        date: session.date.split('/').slice(0, 2).join('/'),
        carga: maxWeight,
        fullDate: session.date
      };
    })
    .sort((a, b) => {
      const dateA = a.fullDate.split('/').reverse().join('-');
      const dateB = b.fullDate.split('/').reverse().join('-');
      return new Date(dateA) - new Date(dateB);
    });

  const personalRecord = loadData.length > 0 ? Math.max(...loadData.map(d => d.carga)) : 0;

  return (
    <main className="space-y-8 animate-in fade-in duration-500 font-cyber pb-32">      
      {/* CABEÇALHO */}
      <div className="flex items-center gap-4 border-b border-primary/20 pb-4">
        <button onClick={() => setView('workout')} className="p-2 bg-card rounded-full border border-primary/50 text-primary hover:bg-input transition-all shadow-[0_0_10px_rgba(var(--primary),0.2)]">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black italic neon-text-cyan uppercase tracking-tighter text-primary">CENTRAL_DE_ANÁLISE</h2>
      </div>

      {/* SEÇÃO 1: BIOMETRIA */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] flex items-center gap-2 px-1">
          <Activity size={12} className="text-primary" /> VETORES_CORPORAIS
        </h3>
        
        {/* CORREÇÃO DO CONTAINER: w-full e min-w-0 para evitar erro de width(-1) */}
        <div className="bg-card border border-border p-4 rounded-3xl h-64 w-full min-w-0 backdrop-blur-sm relative shadow-xl overflow-hidden">
          {biometryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biometryData}>
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
                <XAxis dataKey="date" stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.primary}`, borderRadius: '12px', fontSize: '10px', color: 'var(--text-main)' }} 
                />
                <Area type="monotone" dataKey="peso" name="Peso (kg)" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
                <Area type="monotone" dataKey="cintura" name="Cintura (cm)" stroke={colors.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorCintura)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-muted text-xs font-black uppercase tracking-widest opacity-50">
                Sem dados biométricos
             </div>
          )}
        </div>
      </section>

      {/* SEÇÃO 2: HALL OF FAME */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] flex items-center gap-2 px-1">
          <Trophy size={12} className="text-warning" /> HALL_OF_FAME
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {hallOfFame.length > 0 ? (
            hallOfFame.map(([name, weight]) => (
              <div key={name} className="bg-card/80 p-4 rounded-2xl border border-warning/30 relative overflow-hidden group hover:border-warning/60 transition-all shadow-lg">
                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={40} className="text-warning" />
                </div>
                <p className="text-[7px] font-black text-warning uppercase mb-1 tracking-widest">RECORD_MAX</p>
                <h4 className="text-[10px] font-bold text-muted truncate mb-2" title={name}>{name}</h4>
                <p className="text-2xl font-black text-main italic">{weight}<span className="text-[10px] text-warning ml-1">KG</span></p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center p-6 border-2 border-dashed border-border rounded-xl text-muted text-[9px] font-black uppercase tracking-widest opacity-50">
              Complete treinos para gerar recordes.
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO 3: GRÁFICO DE CARGA */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1 gap-2">
          <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] flex items-center gap-2 truncate">
            <Target size={12} className="text-success" /> PROGRESSÃO
          </h3>
          <select 
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-card border border-success/30 text-success text-[10px] font-black p-2 rounded-lg outline-none focus:border-success w-[140px] truncate"
          >
            <option value="">-- SELECIONAR --</option>
            {availableExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div className="bg-card border border-border p-4 rounded-3xl h-64 w-full min-w-0 backdrop-blur-sm relative shadow-xl overflow-hidden">
          {selectedExercise && loadData.length > 0 ? (
            <>
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-success/10 border border-success/30 px-3 py-1 rounded-full backdrop-blur-md">
                <Award size={12} className="text-success" />
                <span className="text-[9px] font-black text-success uppercase tracking-widest">PR: {personalRecord}KG</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={30} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.secondary}`, borderRadius: '12px', fontSize: '10px', color: 'var(--text-main)' }} 
                    itemStyle={{ color: colors.secondary }}
                  />
                  <ReferenceLine y={personalRecord} stroke={colors.secondary} strokeDasharray="5 5" opacity={0.5} />
                  <Line type="monotone" dataKey="carga" name="Carga Max" stroke={colors.secondary} strokeWidth={4} dot={{ fill: colors.secondary, r: 4 }} activeDot={{ r: 6 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted text-center px-10 opacity-60">
              <DumbbellIcon size={32} className="mb-2 opacity-30" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                {selectedExercise ? "Sem dados para este exercício." : "Selecione um exercício acima."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* BOTÃO VOLTAR */}
      <button onClick={() => setView('workout')} className="w-full py-4 bg-card border border-border rounded-xl font-black text-[10px] tracking-widest text-muted hover:text-primary hover:border-primary/50 transition-all uppercase mt-6 shadow-sm active:scale-[0.98]">
        VOLTAR AO MENU PRINCIPAL
      </button>

    </main>
  );
};

// Ícone Auxiliar (caso não tenha importado)
const DumbbellIcon = ({size, className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
);

export default StatsView;