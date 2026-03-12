import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import { ChevronLeft, Activity, Target, Trophy, Search, X, Flame, Shield, User } from 'lucide-react';
import { calculateStats } from '../utils/rpgSystem';
import MuscleHeatmap from './MuscleHeatmap';

// --- HELPER: O Pente Fino Universal de Nomes ---
const getCanonicalName = (rawName) => {
  if (!rawName) return "";
  let clean = rawName.split('(')[0].trim();
  const lower = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 

  // OMBROS
  if (lower.includes("desenv")) return "Desenvolvimento";
  if (lower.includes("lateral")) return "Elevação Lateral";
  if (lower.includes("frontal")) return "Elevação Frontal";
  if (lower.includes("facepull") || (lower.includes("face") && lower.includes("pull"))) return "Face Pull";

  // PERNAS
  if (lower.includes("abdu")) return "Cadeira Abdutora";
  if (lower.includes("adut")) return "Cadeira Adutora";
  if (lower.includes("leg") && lower.includes("45")) return "Leg Press 45º";
  if (lower.includes("leg")) return "Leg Press";
  if (lower.includes("hack")) return "Agachamento Hack";
  if (lower.includes("extensora")) return "Cadeira Extensora";
  if (lower.includes("flexora")) return "Mesa Flexora";
  if (lower.includes("panturrilha") || lower.includes("gemeos")) return "Panturrilha";

  // BRAÇOS
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

  // PEITO
  if (lower.includes("supino")) {
      if (lower.includes("inclinado")) return "Supino Inclinado";
      return "Supino Reto";
  }
  if (lower.includes("crossover") || (lower.includes("cross") && lower.includes("over"))) return "Crossover";

  // COSTAS
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

  useEffect(() => { setIsModalOpen?.(isSelectorOpen); }, [isSelectorOpen, setIsModalOpen]);

  // Cores dinâmicas para os gráficos
  const pColor = "rgb(var(--primary))";
  const sColor = "rgb(var(--secondary))";

  // --- DATA PROCESSING ---
  const { biometry, volume, heatmap, hallOfFame, exercises, radarData } = useMemo(() => {
    const h = Array.isArray(history) ? history : [];
    const b = Array.isArray(bodyHistory) ? bodyHistory : [];
    
    // 1. Radar de Atributos (RPG Stats)
    const rpgStats = calculateStats(h);
    const radarData = Object.keys(rpgStats).map(key => ({
        subject: rpgStats[key].label,
        value: rpgStats[key].level,
        fullMark: 100
    }));

    // 2. Biometria
    const biometry = b.map(e => ({ date: e.date.split('/').slice(0, 2).join('/'), peso: parseFloat(e.weight) || 0, cintura: parseFloat(e.waist) || 0 }));

    // 3. Heatmap & Volume
    const muscleCounts = { PEITO: 0, COSTAS: 0, PERNAS: 0, BRAÇOS: 0, OMBROS: 0, CORE: 0 };
    const limit = new Date(); limit.setDate(limit.getDate() - 30);

    const volume = h.map(s => {
      let vol = 0;
      const [d, m, y] = s.date.split('/');
      const isRecent = new Date(y, m - 1, d) >= limit;
      s.exercises.forEach(ex => {
        ex.sets?.forEach(st => vol += (parseFloat(st.weight) || 0) * (parseFloat(st.reps) || 0));
        if (isRecent) {
          const g = getMuscleGroup(ex.name);
          if (muscleCounts[g] !== undefined) muscleCounts[g] += (ex.sets?.length || 0);
        }
      });
      return { date: s.date.split('/').slice(0, 2).join('/'), volume: Math.round(vol), full: s.date };
    }).filter(v => v.volume > 0);

    // 4. Hall of Fame
    const prs = {};
    h.forEach(s => s.exercises.forEach(ex => {
      const n = getCanonicalName(ex.name), max = Math.max(...(ex.sets?.map(st => parseFloat(st.weight) || 0) || [0]));
      if (max > (prs[n] || 0)) prs[n] = max;
    }));

    return {
      biometry, volume, radarData,
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

  return (
    <main className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative">
      <header className="flex items-center gap-3 border-b border-primary/20 pb-3">
        <button onClick={() => setView('workout')} className="p-2 bg-card rounded-lg border border-primary/50 text-primary transition-all active:scale-95 shadow-sm"><ChevronLeft size={20}/></button>
        <h2 className="text-lg font-black uppercase text-primary tracking-tighter drop-shadow-sm">CENTRAL DE DADOS</h2>
      </header>

      {/* RADAR DE PERFIL (RPG) */}
      <Section title="PERFIL DE COMBATE (ATRIBUTOS)" icon={User} h="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--main)', fontSize: 10, fontWeight: 'bold' }} />
            <Radar name="Atributos" dataKey="value" stroke={pColor} fill={pColor} fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </Section>

      {/* MATRIX MUSCULAR */}
      <Section title="SISTEMA MUSCULAR (30D)" icon={Shield} h="auto">
        <div className="grid grid-cols-3 gap-2">
          {heatmap.map(m => {
            const isHot = m.intensity >= 80;
            return (
              <div 
                key={m.name} 
                className={`bg-input border p-2 rounded-xl relative overflow-hidden transition-all duration-500 shadow-inner
                  ${isHot ? 'border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-border'}`}
              >
                <div className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${isHot ? 'bg-red-600 opacity-40' : 'bg-primary opacity-20'}`} style={{ height: `${m.intensity}%` }} />
                <div className="relative z-10">
                    <span className={`text-[7px] font-black block uppercase ${isHot ? 'text-red-600 dark:text-red-400' : 'text-main/50'}`}>{m.name}</span>
                    <span className={`text-sm font-black  ${isHot ? 'text-main drop-shadow-md' : 'text-main'}`}>{m.intensity}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      
      {/* Renderiza o mapa de calor usando o histórico */}
      <MuscleHeatmap history={history} />
      
      <Section title="BIOMETRIA" icon={Activity}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={biometry} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="date" stroke="var(--main)" opacity={0.5} fontSize={10} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', border: `1px solid ${pColor}`, borderRadius: '8px', fontSize: '10px', color: 'var(--main)' }} 
              itemStyle={{ fontWeight: 'bold' }}
              formatter={(value, name) => [`${value} ${name === 'peso' ? 'kg' : 'cm'}`, name.toUpperCase()]}
            />
            <Area type="monotone" dataKey="peso" stroke={pColor} fill={pColor} fillOpacity={0.2} />
            <Area type="monotone" dataKey="cintura" stroke={sColor} fill={sColor} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <Section title="TONELAGEM (VOLUME)" icon={Flame}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={volume} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="date" stroke="var(--main)" opacity={0.5} fontSize={10} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', border: `1px solid ${pColor}`, borderRadius: '8px', fontSize: '10px', color: 'var(--main)' }}
              itemStyle={{ fontWeight: 'bold', color: pColor }}
              formatter={(value) => [`${value} kg`, 'Volume']}
            />
            <Area type="stepAfter" dataKey="volume" stroke={pColor} fill={pColor} fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <Section title="TOP RECORDES" icon={Trophy} h="auto">
        <div className="grid grid-cols-2 gap-2">
          {hallOfFame.map(([n, w]) => (
            <div key={n} className="bg-input p-2 rounded-xl border border-warning/30 relative overflow-hidden group shadow-inner">
              <h4 className="text-[9px] font-bold text-main/70 truncate uppercase relative z-10">{n}</h4>
              <p className="text-lg font-black relative z-10 text-main">{w}<span className="text-[8px] ml-0.5 text-warning font-bold">KG</span></p>
            </div>
          ))}
        </div>
      </Section>

      <section className="space-y-3">
        <button onClick={() => setIsSelectorOpen(true)} className="w-full bg-input border border-success/50 text-success text-[10px] font-black p-4 rounded-xl flex justify-between items-center uppercase active:scale-95 shadow-sm transition-all hover:bg-success/5">
          {selectedExercise || "SELECIONAR EXERCÍCIO PARA ANÁLISE"} <Search size={16} />
        </button>
        
        {/* GRÁFICO DE EVOLUÇÃO DE CARGAS */}
        <Section title="EVOLUÇÃO DE CARGA" icon={Target}>
          {selectedExercise && loadData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loadData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--main)" opacity={0.1} />
                <XAxis dataKey="date" stroke="var(--main)" opacity={0.5} fontSize={10} tickLine={false} />
                <YAxis stroke="var(--main)" opacity={0.5} fontSize={10} tickLine={false} tickFormatter={(val) => `${val}kg`} width={35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: `1px solid ${sColor}`, borderRadius: '8px', fontSize: '10px', color: 'var(--main)' }}
                  itemStyle={{ color: sColor, fontWeight: 'bold' }}
                  formatter={(value) => [`${value} kg`, 'Carga Máxima']}
                />
                <Line type="monotone" dataKey="carga" stroke={sColor} strokeWidth={3} dot={{ fill: sColor, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-main/40 text-[10px] font-bold uppercase">Aguardando seleção...</div>}
        </Section>
      </section>

      {/* Modal de Busca */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSelectorOpen(false)}>
          <div className="bg-card w-full max-w-sm rounded-2xl border border-primary/30 flex flex-col max-h-[75vh] overflow-hidden shadow-[0_0_40px_rgba(var(--primary),0.2)]" onClick={e => e.stopPropagation()}>
            
            <div className="p-4 border-b border-border flex justify-between items-center bg-input/50">
              <h3 className="font-black text-primary uppercase text-sm tracking-widest drop-shadow-sm">SISTEMA DE BUSCA</h3>
              <button onClick={() => setIsSelectorOpen(false)} className="text-main/50 p-1 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-3 bg-card">
              <input 
                type="text" 
                placeholder="Filtrar base de dados..." 
                className="bg-input w-full p-3 rounded-xl border border-border text-xs text-main font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-main/30 shadow-inner" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                autoFocus 
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-card">
              {exercises.filter(ex => ex.toLowerCase().includes(searchTerm.toLowerCase())).map(ex => (
                <button 
                  key={ex} 
                  onClick={() => { setSelectedExercise(ex); setIsSelectorOpen(false); }} 
                  className={`w-full text-left p-4 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${selectedExercise === ex ? 'bg-primary text-white shadow-[0_0_10px_rgba(var(--primary),0.4)]' : 'hover:bg-input text-main/60 hover:text-main'}`}
                >
                  {ex}
                </button>
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
        <h3 className="text-[10px] font-black text-main/60 uppercase tracking-[0.2em] flex items-center gap-2">
            <Icon size={12} className="text-primary" /> {title}
        </h3>
    </div>
    <div className={`bg-card border border-border p-3 rounded-2xl ${h} w-full min-w-0 shadow-sm overflow-hidden`}>
      {children}
    </div>
  </section>
);

export default StatsView;