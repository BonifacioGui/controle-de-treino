import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChevronLeft, Activity, Target, Trophy, Search, X, Flame, Shield, CalendarCheck, Filter } from 'lucide-react';
import MuscleHeatmap from './MuscleHeatmap';

const getCanonicalName = (rawName) => {
  if (!rawName) return "";
  let clean = rawName.split('(')[0].trim();
  const lower = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 

  if (lower.includes("desenv")) return "Desenvolvimento";
  if (lower.includes("lateral")) return "Elevação Lateral";
  if (lower.includes("frontal")) return "Elevação Frontal";
  if (lower.includes("facepull") || (lower.includes("face") && lower.includes("pull"))) return "Face Pull";

  if (lower.includes("abdu")) return "Cadeira Abdutora";
  if (lower.includes("adut")) return "Cadeira Adutora";
  if (lower.includes("leg") && lower.includes("45")) return "Leg Press 45º";
  if (lower.includes("leg")) return "Leg Press";
  if (lower.includes("hack")) return "Agachamento Hack";
  if (lower.includes("extensora")) return "Cadeira Extensora";
  if (lower.includes("flexora")) return "Mesa Flexora";
  if (lower.includes("panturrilha") || lower.includes("gemeos")) return "Panturrilha";

  if (lower.includes("triceps")) {
      if (lower.includes("testa")) return "Tríceps Testa";
      if (lower.includes("frances")) return "Tríceps Francês";
      return "Tríceps Corda"; 
  }
  if (lower.includes("rosca")) {
      if (lower.includes("martelo")) return "Rosca Martelo";
      if (lower.includes("45") || lower.includes("inclinada")) return "Rosca 45º";
      return "Rosca Direta";
  }

  if (lower.includes("supino")) {
      if (lower.includes("inclinado")) return "Supino Inclinado";
      return "Supino Reto";
  }
  if (lower.includes("crossover") || (lower.includes("cross") && lower.includes("over"))) return "Crossover";

  if (lower.includes("puxada")) return "Puxada Frontal";
  if (lower.includes("remada")) {
      if (lower.includes("baixa") || lower.includes("triangulo")) return "Remada Baixa";
      if (lower.includes("unilateral") || lower.includes("serrote")) return "Serrote";
      return "Remada";
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

const getMuscleGroup = (n) => {
  const c = n.toLowerCase();
  if (/supino|crucifixo|peck|deck|cross/i.test(c)) return 'PEITO';
  if (/remada|puxada|serrote|pull|terra/i.test(c)) return 'COSTAS';
  if (/leg|agacha|exten|flexo|stiff|pelvi|pantu|abdu|adut/i.test(c)) return 'PERNAS';
  if (/rosca|trice/i.test(c)) return 'BRAÇOS';
  if (/desenv|lateral|frontal|face|encolhi/i.test(c)) return 'OMBROS';
  return /abdom|prancha|vacuum|core/i.test(c) ? 'CORE' : 'OUTROS';
};

const StatsView = ({ bodyHistory, history, setView, workoutData, setIsModalOpen }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔥 ESTADO DO FILTRO DA BIOMETRIA 🔥
  const [bioChartFilter, setBioChartFilter] = useState('macro'); // 'macro', 'arms', 'legs', 'calves', 'trunk'

  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';

  useEffect(() => { setIsModalOpen?.(isSelectorOpen); }, [isSelectorOpen, setIsModalOpen]);

  const colors = {
    driver: { p: '#22d3ee', s: '#ec4899', t: '#94a3b8', bg: '#0f172a', w: '#ffffff', g: '#22c55e' }, 
    light:  { p: '#0284c7', s: '#db2777', t: '#475569', bg: '#ffffff', w: '#000000', g: '#16a34a' }  
  }[theme] || { p: '#22d3ee', s: '#ec4899', t: '#94a3b8', bg: '#0f172a', w: '#ffffff', g: '#22c55e' };

  const { biometry, volume, heatmap, hallOfFame, exercises, recentWorkoutsCount } = useMemo(() => {
    const h = Array.isArray(history) ? history : [];
    const b = Array.isArray(bodyHistory) ? bodyHistory : [];
    
    // 1. Biometria mapeada com os novos campos bilaterais
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
    })).reverse(); // Reverse para o gráfico ir do mais antigo para o mais novo (da esquerda pra direita)

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
    }).filter(v => v.volume > 0).reverse(); // Gráfico no sentido cronológico correto

    // 3. Hall of Fame
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

  // Função auxiliar para renderizar o gráfico certo baseado no filtro
  const renderBioChart = () => {
    switch (bioChartFilter) {
      case 'arms':
        return (
          <>
            <Area type="monotone" dataKey="arm_l" name="Braço Esq." stroke={colors.p} fill={colors.p} fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="arm_r" name="Braço Dir." stroke={colors.s} fill={colors.s} fillOpacity={0.2} connectNulls />
          </>
        );
      case 'legs':
        return (
          <>
            <Area type="monotone" dataKey="leg_l" name="Perna Esq." stroke={colors.p} fill={colors.p} fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="leg_r" name="Perna Dir." stroke={colors.s} fill={colors.s} fillOpacity={0.2} connectNulls />
          </>
        );
      case 'calves':
        return (
          <>
            <Area type="monotone" dataKey="calf_l" name="Panturrilha Esq." stroke={colors.p} fill={colors.p} fillOpacity={0.2} connectNulls />
            <Area type="monotone" dataKey="calf_r" name="Panturrilha Dir." stroke={colors.s} fill={colors.s} fillOpacity={0.2} connectNulls />
          </>
        );
      case 'trunk':
        return (
          <>
            <Line type="monotone" dataKey="peito" name="Peito" stroke={colors.p} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="ombro" name="Ombro" stroke={colors.w} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="cintura" name="Cintura" stroke={colors.s} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="quadril" name="Quadril" stroke="#eab308" strokeWidth={2} dot={{ r: 2 }} connectNulls />
          </>
        );
      case 'macro':
      default:
        return (
          <>
            <Area type="monotone" dataKey="peso" name="Peso Bruto" stroke={colors.t} fill={colors.t} fillOpacity={0.1} connectNulls />
            <Line type="monotone" dataKey="lean_mass" name="Massa Magra" stroke={colors.g} strokeWidth={3} dot={{ r: 3 }} connectNulls />
          </>
        );
    }
  };

  return (
    <main className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative">
      <header className="flex items-center gap-3 border-b border-primary/20 pb-3">
        <button onClick={() => setView('workout')} className="p-2 bg-card rounded-lg border border-primary/50 text-primary transition-all active:scale-95"><ChevronLeft size={20}/></button>
        <h2 className="text-lg font-black uppercase text-primary tracking-tighter">CENTRAL DE DADOS</h2>
      </header>

      <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(var(--primary),0.1)]">
        <div>
          <h3 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <CalendarCheck size={14} className="text-primary" /> Consistência (30D)
          </h3>
          <p className="text-sm font-medium text-main">Operações concluídas no último mês</p>
        </div>
        <div className="text-3xl font-black text-primary">
          {recentWorkoutsCount}
        </div>
      </div>

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
                    <span className={`text-sm font-black  ${isHot ? 'text-white' : 'text-main'}`}>{m.intensity}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      
      <MuscleHeatmap history={history} />
      
      {/* 🔥 GRÁFICO DE BIOMETRIA FILTRÁVEL 🔥 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity size={12} className="text-primary" /> PROGRESSÃO BIOMÉTRICA
            </h3>
            
            {/* O Filtro Select */}
            <div className="relative">
              <select 
                value={bioChartFilter} 
                onChange={(e) => setBioChartFilter(e.target.value)}
                className="appearance-none bg-input border border-primary/50 text-primary text-[9px] font-black uppercase tracking-widest py-1 pl-2 pr-6 rounded outline-none focus:border-primary cursor-pointer"
              >
                <option value="macro">Peso vs M. Magra</option>
                <option value="arms">Braços (Esq/Dir)</option>
                <option value="legs">Pernas (Esq/Dir)</option>
                <option value="calves">Panturrilhas (Esq/Dir)</option>
                <option value="trunk">Tronco</option>
              </select>
              <Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
            </div>
        </div>

        <div className="bg-card border border-border p-3 rounded-2xl h-48 w-full min-w-0 backdrop-blur-md relative shadow-inner overflow-hidden">
          {biometry && biometry.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biometry} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="date" stroke={colors.t} fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke={colors.t} fontSize={10} tickLine={false} width={30} />
                <Tooltip 
                  contentStyle={{ backgroundColor: colors.bg, border: `1px solid ${colors.p}`, fontSize: '10px', borderRadius: '8px' }} 
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value, name) => [`${value} kg/cm`, name]}
                />
                {renderBioChart()}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted text-[10px] uppercase opacity-50 text-center px-4">
              Nenhum dado biométrico registrado no Dossiê ainda.
            </div>
          )}
        </div>
      </section>

      <Section title="TONELAGEM (VOLUME)" icon={Flame}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={volume} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="date" stroke={colors.t} fontSize={10} tickLine={false} />
            <YAxis stroke={colors.t} fontSize={10} tickLine={false} width={35} />
            <Tooltip 
              contentStyle={{ backgroundColor: colors.bg, border: `1px solid ${colors.p}`, fontSize: '10px' }}
              formatter={(value) => [`${value} kg`, 'Volume']}
            />
            <Area type="stepAfter" dataKey="volume" stroke={colors.p} fill={colors.p} fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <Section title="TOP RECORDES" icon={Trophy} h="auto">
        <div className="grid grid-cols-2 gap-2">
          {hallOfFame.map(([n, w]) => (
            <div key={n} className="bg-card/80 p-2 rounded-xl border border-warning/30 relative overflow-hidden group">
              <h4 className="text-[9px] font-bold text-main truncate uppercase relative z-10">{n}</h4>
              <p className="text-lg font-black relative z-10">{w}<span className="text-[8px] ml-0.5 text-warning">KG</span></p>
            </div>
          ))}
        </div>
      </Section>

      <section className="space-y-3">
        <button onClick={() => setIsSelectorOpen(true)} className="w-full bg-card border border-success/30 text-success text-[10px] font-black p-3 rounded-xl flex justify-between items-center uppercase active:scale-95 shadow-lg">
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
          ) : <div className="h-full flex items-center justify-center text-muted text-[10px] uppercase opacity-50">Aguardando seleção...</div>}
        </Section>
      </section>

      {isSelectorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200" onClick={() => setIsSelectorOpen(false)}>
          <div className="bg-card w-full max-w-sm rounded-2xl border border-primary/30 flex flex-col max-h-[75vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-input/10">
              <h3 className="font-black text-primary uppercase text-sm tracking-widest">SISTEMA DE BUSCA</h3>
              <button onClick={() => setIsSelectorOpen(false)} className="text-muted p-1 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-3">
              <input type="text" placeholder="Filtrar base de dados..." className="bg-black/60 w-full p-3 rounded-xl border border-white/5 text-xs outline-none focus:border-primary/50 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {exercises.filter(ex => ex.toLowerCase().includes(searchTerm.toLowerCase())).map(ex => (
                <button key={ex} onClick={() => { setSelectedExercise(ex); setIsSelectorOpen(false); }} className={`w-full text-left p-4 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${selectedExercise === ex ? 'bg-primary text-black' : 'hover:bg-white/5 text-muted hover:text-primary'}`}>{ex}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

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

export default StatsView;