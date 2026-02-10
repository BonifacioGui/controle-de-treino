import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { ChevronLeft, Activity, Target, Award, Trophy, Search, X } from 'lucide-react';

// --- HELPER: Unifica nomes (Lógica Blindada v5) ---
const getCanonicalName = (rawName) => {
  if (!rawName) return "";
  let clean = rawName.split('(')[0].trim();
  const lower = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 

  if (lower.includes("triceps")) {
      if (lower.includes("testa")) return "Tríceps Testa";
      if (lower.includes("frances")) return "Tríceps Francês";
      if (lower.includes("banco")) return "Tríceps Banco";
      if (lower.includes("coice")) return "Tríceps Coice";
      return "Tríceps Corda"; 
  }
  if (lower.includes("desenv")) {
      if (lower.includes("maquina") || lower.includes("machine")) return "Desenvolvimento Máquina";
      if (lower.includes("barra") || lower.includes("militar") || lower.includes("frente")) return "Desenvolvimento Barra";
      if (lower.includes("arnold")) return "Desenvolvimento Arnold";
      return "Desenvolvimento"; 
  }
  if (lower.includes("supino")) {
      if (lower.includes("inclinado")) return "Supino Inclinado";
      if (lower.includes("declinado")) return "Supino Declinado";
      if (lower.includes("vertical") || lower.includes("maquina")) return "Supino Máquina";
      return "Supino Reto";
  }
  if (lower.includes("leg") && lower.includes("45")) return "Leg Press 45º";
  if (lower.includes("leg") && lower.includes("horizontal")) return "Leg Press Horizontal";
  if (lower.includes("legpress") || lower.includes("leg")) return "Leg Press";
  
  if (lower.includes("agachamento")) {
      if (lower.includes("bulgaro")) return "Agachamento Búlgaro";
      if (lower.includes("smith") || lower.includes("guiado")) return "Agachamento Smith";
      if (lower.includes("hack")) return "Agachamento Hack";
      return "Agachamento Livre";
  }
  if (lower.includes("stiff")) return "Stiff";
  if (lower.includes("terra") && !lower.includes("unilateral")) return "Levantamento Terra";
  if (lower.includes("extensora")) return "Cadeira Extensora";
  if (lower.includes("flexora")) return "Mesa Flexora";
  if (lower.includes("pelvica") || lower.includes("elevacao de quadril")) return "Elevação Pélvica";
  if (lower.includes("panturrilha")) return "Panturrilha";
  if (lower.includes("puxada")) {
      if (lower.includes("supinada")) return "Puxada Supinada";
      return "Puxada Frontal";
  }
  if (lower.includes("remada")) {
      if (lower.includes("cavalinho")) return "Remada Cavalinho";
      if (lower.includes("curvada")) return "Remada Curvada";
      if (lower.includes("unilateral") || lower.includes("serrote")) return "Serrote";
      if (lower.includes("maquina")) return "Remada Máquina";
      return "Remada Baixa";
  }
  if (lower.includes("serrote")) return "Serrote";
  if (lower.includes("pulldown")) return "Pulldown";
  if (lower.includes("rosca")) {
      if (lower.includes("martelo")) return "Rosca Martelo";
      if (lower.includes("scott")) return "Rosca Scott";
      if (lower.includes("inclinada") || lower.includes("45")) return "Rosca 45º";
      return "Rosca Direta";
  }
  if (lower.includes("lateral")) return "Elevação Lateral";
  if (lower.includes("frontal")) return "Elevação Frontal";
  if (lower.includes("crucifixo") && lower.includes("inverso")) return "Crucifixo Inverso";
  if (lower.includes("face") && lower.includes("pull")) return "Face Pull";
  if (lower.includes("encolhimento")) return "Encolhimento";
  if (lower.includes("crossover")) return "Crossover";
  if (lower.includes("peck") || lower.includes("deck")) return "Peck Deck";
  if (lower.includes("crucifixo")) return "Crucifixo"; 
  if (lower.includes("abducao") || lower.includes("abdutora")) return "Cadeira Abdutora";
  if (lower.includes("adutora")) return "Cadeira Adutora";
  if (lower.includes("vacuum")) return "Stomach Vacuum";

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const StatsView = ({ bodyHistory, history, setView, workoutData, setIsModalOpen }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [currentTheme, setCurrentTheme] = useState('driver');

  const safeHistory = Array.isArray(history) ? history : [];
  const safeBodyHistory = Array.isArray(bodyHistory) ? bodyHistory : [];

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme') || 'driver';
    setCurrentTheme(theme);
  }, []);

  // 🔥 Monitora se o modal está aberto para avisar o componente pai (App.js)
  useEffect(() => {
    if (setIsModalOpen) {
      setIsModalOpen(isSelectorOpen);
    }
  }, [isSelectorOpen, setIsModalOpen]);

  const chartColors = {
    driver: { primary: '#22d3ee', secondary: '#ec4899', grid: '#1e293b', text: '#94a3b8' },
    light:  { primary: '#00a0c8', secondary: '#ec4899', grid: '#e2e8f0', text: '#475569' },
    matrix: { primary: '#00ff41', secondary: '#008f11', grid: '#003b00', text: '#008f11' },
    spiderman: { primary: '#ef4444', secondary: '#facc15', grid: '#000000', text: '#000000' }
  };
  
  const colors = chartColors[currentTheme] || chartColors.driver;

  const availableExercises = useMemo(() => {
    const uniqueSet = new Set();
    safeHistory.forEach(session => {
        session.exercises.forEach(ex => uniqueSet.add(getCanonicalName(ex.name)));
    });
    if (workoutData) {
        Object.values(workoutData).forEach(day => {
            if (day.exercises) day.exercises.forEach(ex => uniqueSet.add(getCanonicalName(ex.name)));
        });
    }
    return Array.from(uniqueSet).sort();
  }, [safeHistory, workoutData]);

  const filteredExercises = availableExercises.filter(ex => 
      ex.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <main className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative">      
      {/* HEADER COMPACTO */}
      <div className="flex items-center gap-3 border-b border-primary/20 pb-3">
        <button onClick={() => setView('workout')} className="p-2 bg-card rounded-lg border border-primary/50 text-primary hover:bg-input transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-black italic neon-text-cyan uppercase tracking-tighter text-primary">CENTRAL DE DADOS</h2>
      </div>

      {/* BIOMETRIA */}
      <section className="space-y-3">
        <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2 px-1">
          <Activity size={14} className="text-primary" /> BIOMETRIA
        </h3>
        <div className="bg-card border border-border p-3 rounded-2xl h-56 w-full min-w-0 backdrop-blur-sm relative shadow-sm overflow-hidden">
          {biometryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biometryData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
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
                <XAxis dataKey="date" stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} tickMargin={5} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.primary}`, borderRadius: '8px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }} 
                />
                <Area type="monotone" dataKey="peso" name="Peso (kg)" stroke={colors.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorPeso)" />
                <Area type="monotone" dataKey="cintura" name="Cintura (cm)" stroke={colors.secondary} strokeWidth={2} fillOpacity={1} fill="url(#colorCintura)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-muted text-xs font-bold uppercase tracking-widest opacity-50">
               Sem dados biométricos
             </div>
          )}
        </div>
      </section>

      {/* HALL OF FAME COMPACTO */}
      <section className="space-y-3">
        <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2 px-1">
          <Trophy size={14} className="text-warning" /> RECORDES (TOP 6)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {hallOfFame.length > 0 ? (
            hallOfFame.map(([name, weight]) => (
              <div key={name} className="bg-card/80 p-3 rounded-xl border border-warning/30 relative overflow-hidden group hover:border-warning/60 transition-all shadow-sm">
                <p className="text-[8px] font-black text-warning uppercase mb-0.5 tracking-widest opacity-70">RECORD</p>
                <h4 className="text-xs font-bold text-main truncate mb-0.5" title={name}>{name}</h4>
                <p className="text-xl font-black text-main italic">{weight}<span className="text-[10px] text-warning ml-1">KG</span></p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center p-4 border border-dashed border-border rounded-xl text-muted text-[10px] font-bold uppercase tracking-widest opacity-50">
              Complete treinos para gerar recordes.
            </div>
          )}
        </div>
      </section>

      {/* PROGRESSÃO - SELETOR MELHORADO */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2 truncate">
            <Target size={14} className="text-success" /> EVOLUÇÃO DE CARGA
          </h3>
          <button 
            onClick={() => setIsSelectorOpen(true)}
            className="bg-card border border-success/30 text-success text-xs font-black p-3 rounded-xl flex justify-between items-center active:scale-[0.98] transition-all"
          >
            {selectedExercise || "-- SELECIONE UM EXERCÍCIO --"}
            <Search size={14} />
          </button>
        </div>

        <div className="bg-card border border-border p-3 rounded-2xl h-56 w-full min-w-0 backdrop-blur-sm relative shadow-sm overflow-hidden">
          {selectedExercise && loadData.length > 0 ? (
            <>
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-success/10 border border-success/30 px-2 py-0.5 rounded-full backdrop-blur-md">
                <Award size={12} className="text-success" />
                <span className="text-[10px] font-black text-success uppercase tracking-widest">PR: {personalRecord}KG</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loadData} margin={{ top: 25, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} tickMargin={5} />
                  <YAxis stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={25} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.secondary}`, borderRadius: '8px', fontSize: '12px', color: 'var(--text-main)', fontWeight: 'bold' }} 
                    itemStyle={{ color: colors.secondary }}
                  />
                  <ReferenceLine y={personalRecord} stroke={colors.secondary} strokeDasharray="5 5" opacity={0.5} />
                  <Line type="monotone" dataKey="carga" name="Carga Max" stroke={colors.secondary} strokeWidth={3} dot={{ fill: colors.secondary, r: 3 }} activeDot={{ r: 5 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted text-center px-6 opacity-60">
              <DumbbellIcon size={32} className="mb-2 opacity-30" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                {selectedExercise ? "Sem dados suficientes." : "Toque acima para selecionar."}
              </p>
            </div>
          )}
        </div>
      </section>

      {!isSelectorOpen && (
        <button onClick={() => setView('workout')} className="w-full py-3 bg-card border border-border rounded-xl font-black text-xs tracking-widest text-muted hover:text-primary hover:border-primary/50 transition-all uppercase mt-4 shadow-sm active:scale-[0.98]">
            VOLTAR
        </button>
      )}

      {/* --- MODAL DE SELEÇÃO DE EXERCÍCIO --- */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-black text-primary uppercase tracking-widest">Selecionar</h3>
                    <button onClick={() => setIsSelectorOpen(false)} className="text-muted hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 bg-input/50 p-2 rounded-xl">
                        <Search size={16} className="text-muted" />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className="bg-transparent w-full text-sm outline-none text-main"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredExercises.map(ex => (
                        <button 
                            key={ex} 
                            onClick={() => { setSelectedExercise(ex); setIsSelectorOpen(false); }}
                            className={`w-full text-left p-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                                ${selectedExercise === ex ? 'bg-primary text-black' : 'hover:bg-primary/20 text-muted hover:text-white'}
                            `}
                        >
                            {ex}
                        </button>
                    ))}
                    {filteredExercises.length === 0 && (
                        <div className="p-4 text-center text-muted text-xs">Nenhum exercício encontrado.</div>
                    )}
                </div>
            </div>
        </div>
      )}
    </main>
  );
};

const DumbbellIcon = ({size, className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
);

export default StatsView;