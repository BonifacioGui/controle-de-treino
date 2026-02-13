import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { ChevronLeft, Activity, Target, Award, Trophy, Search, X, Flame, Shield } from 'lucide-react';

// --- REFATORAÇÃO: Unificação de Nomes via Mapeamento ---
const getCanonicalName = (rawName) => {
  if (!rawName) return "";
  let name = rawName.split('(')[0].trim();
  const clean = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  const rules = [
    { k: /triceps/i, sub: ['testa', 'frances', 'banco', 'coice'], def: "Tríceps Corda" },
    { k: /supino/i, sub: ['inclinado', 'declinado', 'vertical', 'maquina'], def: "Supino Reto" },
    { k: /agachamento/i, sub: ['bulgaro', 'smith', 'hack'], def: "Agachamento Livre" },
    { k: /leg/i, sub: ['45', 'horizontal'], def: "Leg Press" },
    { k: /puxada/i, sub: ['supinada'], def: "Puxada Frontal" },
    { k: /remada/i, sub: ['cavalinho', 'curvada', 'maquina'], def: "Remada Baixa" },
    { k: /rosca/i, sub: ['martelo', 'scott', '45'], def: "Rosca Direta" },
    { k: /lateral|frontal|crucifixoinverso|facepull/i, res: name }
  ];

  for (const r of rules) {
    if (r.k.test(clean)) {
      const found = r.sub?.find(s => clean.includes(s));
      return found ? `${r.def.split(' ')[0]} ${found.charAt(0).toUpperCase() + found.slice(1)}` : (r.res || r.def);
    }
  }
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const getMuscleGroup = (n) => {
  const c = n.toLowerCase();
  if (/supino|crucifixo|peck|deck|cross/i.test(c)) return 'PEITO';
  if (/remada|puxada|serrote|pull|terra/i.test(c)) return 'COSTAS';
  if (/leg|agacha|exten|flexo|stiff|pelvi|pantu/i.test(c)) return 'PERNAS';
  if (/rosca|trice/i.test(c)) return 'BRAÇOS';
  if (/desenv|lateral|frontal|face|encolhi/i.test(c)) return 'OMBROS';
  return /abdom|prancha|vacuum|core/i.test(c) ? 'CORE' : 'OUTROS';
};

const StatsView = ({ bodyHistory, history, setView, workoutData, setIsModalOpen }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'driver' : 'driver';

  useEffect(() => { setIsModalOpen?.(isSelectorOpen); }, [isSelectorOpen, setIsModalOpen]);

  const colors = {
    driver: { p: '#22d3ee', s: '#ec4899', g: '#1e293b', t: '#94a3b8' },
    matrix: { p: '#00ff41', s: '#008f11', g: '#003b00', t: '#008f11' },
    spiderman: { p: '#ef4444', s: '#facc15', g: '#000', t: '#000' }
  }[theme] || { p: '#22d3ee', s: '#ec4899', g: '#1e293b', t: '#94a3b8' };

  const { biometry, volume, heatmap, hallOfFame, exercises } = useMemo(() => {
    const h = Array.isArray(history) ? history : [];
    const b = Array.isArray(bodyHistory) ? bodyHistory : [];
    const biometry = b.map(e => ({ date: e.date.split('/').slice(0, 2).join('/'), peso: parseFloat(e.weight) || 0, cintura: parseFloat(e.waist) || 0 }));
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

    const prs = {};
    h.forEach(s => s.exercises.forEach(ex => {
      const n = getCanonicalName(ex.name), max = Math.max(...(ex.sets?.map(st => parseFloat(st.weight) || 0) || [0]));
      if (max > (prs[n] || 0)) prs[n] = max;
    }));

    return {
      biometry, volume,
      heatmap: Object.entries(muscleCounts).map(([name, sets]) => ({ name, sets, intensity: Math.min(Math.round((sets / 25) * 100), 100) })),
      hallOfFame: Object.entries(prs).sort((a, b) => b[1] - a[1]).slice(0, 6),
      exercises: Array.from(new Set([...h.flatMap(s => s.exercises.map(e => getCanonicalName(e.name))), ...Object.values(workoutData || {}).flatMap(d => d.exercises?.map(e => getCanonicalName(e.name)) || [])])).sort()
    };
  }, [history, bodyHistory, workoutData]);

  const loadData = useMemo(() => {
    if (!selectedExercise) return [];
    return history.filter(s => s.exercises.some(ex => getCanonicalName(ex.name) === selectedExercise))
      .map(s => ({ date: s.date.split('/').slice(0, 2).join('/'), carga: Math.max(...s.exercises.find(e => getCanonicalName(e.name) === selectedExercise).sets.map(st => parseFloat(st.weight) || 0)), full: s.date }))
      .sort((a, b) => new Date(a.full.split('/').reverse().join('-')) - new Date(b.full.split('/').reverse().join('-')));
  }, [history, selectedExercise]);

  return (
    <main className="space-y-6 animate-in fade-in duration-500 font-cyber pb-24 relative">
      <header className="flex items-center gap-3 border-b border-primary/20 pb-3">
        <button onClick={() => setView('workout')} className="p-2 bg-card rounded-lg border border-primary/50 text-primary"><ChevronLeft size={20}/></button>
        <h2 className="text-lg font-black italic uppercase text-primary tracking-tighter">CENTRAL DE DADOS</h2>
      </header>

      {/* MATRIX MUSCULAR (EFEITO AGRESSIVO ATIVADO) */}
      <Section title="SISTEMA MUSCULAR (30D)" icon={Shield} h="auto">
        <div className="grid grid-cols-3 gap-2">
          {heatmap.map(m => {
            const isHot = m.intensity >= 80;
            return (
              <div 
                key={m.name} 
                className={`bg-input/30 border p-2 rounded-xl relative overflow-hidden transition-all duration-500 
                  ${isHot ? 'border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-border'}`}
              >
                {/* Preenchimento de fundo */}
                <div 
                  className={`absolute bottom-0 left-0 w-full transition-all duration-1000 
                    ${isHot ? 'bg-red-600 opacity-40' : 'bg-primary opacity-20'}`} 
                  style={{ height: `${m.intensity}%` }} 
                />
                <div className="relative z-10">
                    <span className={`text-[7px] font-black block uppercase ${isHot ? 'text-red-400' : 'text-muted'}`}>{m.name}</span>
                    <span className={`text-sm font-black italic ${isHot ? 'text-white' : 'text-main'}`}>{m.intensity}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="BIOMETRIA" icon={Activity}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={biometry} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="date" stroke={colors.t} fontSize={10} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.p}`, fontSize: '10px' }} />
            <Area type="monotone" dataKey="peso" stroke={colors.p} fill={colors.p} fillOpacity={0.2} />
            <Area type="monotone" dataKey="cintura" stroke={colors.s} fill={colors.s} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <Section title="TONELAGEM (VOLUME)" icon={Flame}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={volume} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="date" stroke={colors.t} fontSize={10} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${colors.p}`, fontSize: '10px' }} />
            <Area type="stepAfter" dataKey="volume" stroke={colors.p} fill={colors.p} fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <Section title="TOP RECORDES" icon={Trophy} h="auto">
        <div className="grid grid-cols-2 gap-2">
          {hallOfFame.map(([n, w]) => (
            <div key={n} className="bg-card/80 p-2 rounded-xl border border-warning/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-warning/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <h4 className="text-[9px] font-bold text-main truncate uppercase relative z-10">{n}</h4>
              <p className="text-lg font-black italic relative z-10">{w}<span className="text-[8px] ml-0.5 text-warning">KG</span></p>
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
              <LineChart data={loadData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" stroke={colors.t} fontSize={10} tickLine={false} />
                <YAxis stroke={colors.t} fontSize={10} tickLine={false} domain={['auto', 'auto']} width={25} />
                <Line type="monotone" dataKey="carga" stroke={colors.s} strokeWidth={3} dot={{ fill: colors.s, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-muted text-[10px] uppercase opacity-50">Aguardando seleção...</div>}
        </Section>
      </section>

      {isSelectorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-200" onClick={() => setIsSelectorOpen(false)}>
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

// --- SUB-COMPONENTE: ESTRUTURA DE SEÇÃO ---
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