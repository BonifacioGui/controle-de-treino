import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, CalendarCheck, Shield, Target, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 🛠️ Importando as lógicas pesadas
import { getCanonicalName, getMuscleGroup } from '../utils/exerciseParser';

// 🧩 Importando os Módulos (Nossos novos soldados)
import MuscleHeatmap from './MuscleHeatmap';
import BiometryChart from './stats/BiometryChart';
import VolumeChart from './stats/VolumeChart';
import TopRecords from './stats/TopRecords';
import ExerciseSearchModal from './stats/ExerciseSearchModal';

// Componente auxiliar de Seção (mantido para padronizar blocos internos)
const Section = ({ title, icon: Icon, children, h = "h-48" }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <Icon size={12} className="text-primary" /> {title}
        </h3>
    </div>
    <div className={`bg-card border border-border p-3 rounded-2xl ${h} w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden`}>
      {children}
    </div>
  </section>
);

const StatsView = ({ bodyHistory, history, setView, workoutData, setIsModalOpen }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';
  const colors = {
    driver: { p: '#22d3ee', s: '#ec4899', t: '#94a3b8', bg: '#0f172a', w: '#ffffff', g: '#22c55e' }, 
    light:  { p: '#0284c7', s: '#db2777', t: '#475569', bg: '#ffffff', w: '#000000', g: '#16a34a' }  
  }[theme] || { p: '#22d3ee', s: '#ec4899', t: '#94a3b8', bg: '#0f172a', w: '#ffffff', g: '#22c55e' };

  // Sincroniza o modal com o elemento pai (caso exista)
  useEffect(() => { setIsModalOpen?.(isSelectorOpen); }, [isSelectorOpen, setIsModalOpen]);

  // 🧠 Processamento Central de Dados
  const { biometry, volume, heatmap, hallOfFame, exercises, recentWorkoutsCount } = useMemo(() => {
    const h = Array.isArray(history) ? history : [];
    const b = Array.isArray(bodyHistory) ? bodyHistory : [];
    
    // 1. Biometria
    const biometry = b.map(e => ({ 
      date: e.date.split('/').slice(0, 2).join('/'), 
      peso: parseFloat(e.weight) || null,
      bf: parseFloat(e.bf) || null,
      lean_mass: parseFloat(e.lean_mass) || null,
      cintura: parseFloat(e.waist) || null,
      quadril: parseFloat(e.hip) || null,
      peito: parseFloat(e.chest) || null,
      ombro: parseFloat(e.shoulder) || null,
      arm_l: parseFloat(e.arm_left) || null,
      arm_r: parseFloat(e.arm_right) || null,
      leg_l: parseFloat(e.leg_left) || null,
      leg_r: parseFloat(e.leg_right) || null,
      calf_l: parseFloat(e.calf_left) || null,
      calf_r: parseFloat(e.calf_right) || null
    })).reverse();

    // 2. Heatmap, Volume & Consistência
    const muscleCounts = { PEITO: 0, COSTAS: 0, PERNAS: 0, BRAÇOS: 0, OMBROS: 0, CORE: 0 };
    const limit = new Date(); limit.setDate(limit.getDate() - 30);
    let recentCount = 0;

    const volume = h.map(s => {
      let vol = 0;
      const [d, m, y] = s.date.split('/');
      const isRecent = new Date(y, m - 1, d) >= limit;
      
      if (isRecent) recentCount++;

      s.exercises.forEach(ex => {
        ex.sets?.forEach(st => vol += (parseFloat(st.weight) || 0) * (parseFloat(st.reps) || 0));
        if (isRecent) {
          const g = getMuscleGroup(ex.name);
          if (muscleCounts[g] !== undefined) muscleCounts[g] += (ex.sets?.length || 0);
        }
      });
      return { date: s.date.split('/').slice(0, 2).join('/'), volume: Math.round(vol), full: s.date };
    }).filter(v => v.volume > 0).reverse();

    // 3. Recordes (Hall of Fame)
    const prs = {};
    h.forEach(s => s.exercises.forEach(ex => {
      const n = getCanonicalName(ex.name), max = Math.max(...(ex.sets?.map(st => parseFloat(st.weight) || 0) || [0]));
      if (max > (prs[n] || 0)) prs[n] = max;
    }));

    return {
      biometry, volume, recentWorkoutsCount: recentCount,
      heatmap: Object.entries(muscleCounts).map(([name, sets]) => ({ name, sets, intensity: Math.min(Math.round((sets / 25) * 100), 100) })),
      hallOfFame: Object.entries(prs).sort((a, b) => b[1] - a[1]).slice(0, 6),
      exercises: Array.from(new Set([...h.flatMap(s => s.exercises.map(e => getCanonicalName(e.name))), ...Object.values(workoutData || {}).flatMap(d => d.exercises?.map(e => getCanonicalName(e.name)) || [])])).sort()
    };
  }, [history, bodyHistory, workoutData]);

  // Filtro de Carga Baseado no Exercício Selecionado
  const loadData = useMemo(() => {
    if (!selectedExercise) return [];
    return history.filter(s => s.exercises.some(ex => getCanonicalName(ex.name) === selectedExercise))
      .map(s => ({ 
        date: s.date.split('/').slice(0, 2).join('/'), 
        carga: Math.max(...s.exercises.find(e => getCanonicalName(e.name) === selectedExercise).sets.map(st => parseFloat(st.weight) || 0)), 
        full: s.date 
      }))
      .sort((a, b) => new Date(a.full.split('/').reverse().join('-')) - new Date(b.full.split('/').reverse().join('-')));
  }, [history, selectedExercise]);

  return (
    <main className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative">
      <header className="flex items-center gap-3 border-b border-primary/20 pb-3">
        <button onClick={() => setView('workout')} className="p-2 bg-card rounded-lg border border-primary/50 text-primary transition-all active:scale-95">
          <ChevronLeft size={20}/>
        </button>
        <h2 className="text-lg font-black uppercase text-primary tracking-tighter">CENTRAL DE DADOS</h2>
      </header>

      {/* DASHBOARD DE CONSISTÊNCIA */}
      <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(var(--primary),0.1)]">
        <div>
          <h3 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <CalendarCheck size={14} className="text-primary" /> Consistência (30D)
          </h3>
          <p className="text-sm font-medium text-main dark:text-white">Operações concluídas no último mês</p>
        </div>
        <div className="text-3xl font-black text-primary">
          {recentWorkoutsCount}
        </div>
      </div>

      {/* DISTRIBUIÇÃO MUSCULAR */}
      <Section title="DISTRIBUIÇÃO MUSCULAR (30D)" icon={Shield} h="auto">
        <div className="grid grid-cols-3 gap-2">
          {heatmap.map(m => {
            const isHot = m.intensity >= 80;
            return (
              <div 
                key={m.name} 
                className={`bg-input/30 border p-2 rounded-xl relative overflow-hidden transition-all duration-500 
                  ${isHot ? 'border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-border'}`}
              >
                <div className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${isHot ? 'bg-red-600 opacity-40' : 'bg-primary opacity-20'}`} style={{ height: `${m.intensity}%` }} />
                <div className="relative z-10">
                    <span className={`text-[7px] font-black block uppercase ${isHot ? 'text-red-400' : 'text-muted'}`}>{m.name}</span>
                    <span className={`text-sm font-black  ${isHot ? 'text-white' : 'text-main dark:text-white'}`}>{m.intensity}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      
      {/* HEATMAP DO CORPO (Seu componente original) */}
      <MuscleHeatmap history={history} />
      
      {/* MÓDULOS EXTRAÍDOS (Nossa arquitetura limpa em ação) */}
      <BiometryChart data={biometry} />
      <VolumeChart data={volume} />
      <TopRecords records={hallOfFame} />

      {/* EVOLUÇÃO DE CARGA INDIVIDUAL */}
      <section className="space-y-3">
        <button 
          onClick={() => setIsSelectorOpen(true)} 
          className="w-full bg-card border border-success/30 text-success text-[10px] font-black p-3 rounded-xl flex justify-between items-center uppercase active:scale-95 shadow-lg transition-all hover:bg-success/5"
        >
          {selectedExercise || "SELECIONAR EXERCÍCIO"} <Search size={14} />
        </button>
        
        <Section title="EVOLUÇÃO DE CARGA" icon={Target}>
          {selectedExercise && loadData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loadData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" stroke={colors.t} fontSize={10} tickLine={false} />
                <YAxis stroke={colors.t} fontSize={10} tickLine={false} tickFormatter={(val) => `${val}kg`} width={35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.bg, border: `1px solid ${colors.s}`, fontSize: '10px' }}
                  itemStyle={{ color: colors.s, fontWeight: 'bold' }}
                  formatter={(value) => [`${value} kg`, 'Carga Máxima']}
                />
                <Line type="monotone" dataKey="carga" stroke={colors.s} strokeWidth={3} dot={{ fill: colors.s, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted text-[10px] uppercase opacity-50">
              Aguardando seleção...
            </div>
          )}
        </Section>
      </section>

      {/* MODAL EXTERNO */}
      {isSelectorOpen && (
        <ExerciseSearchModal 
          exercises={exercises} 
          onSelect={setSelectedExercise} 
          onClose={() => setIsSelectorOpen(false)} 
        />
      )}
    </main>
  );
};

export default StatsView;