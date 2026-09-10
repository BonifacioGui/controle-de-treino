import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, CalendarCheck, Shield, Target, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 🛠️ Importando as lógicas pesadas
import { daysBetweenLocalDates, formatLocalDate, getLocalDateKey, normalizeLocalDateKey } from '../../utils/dateUtils';
import { calculateCompletedVolume } from '../../utils/sessionModel';
import { getMuscleVolumeDistribution } from '../../utils/muscleVolumeModel';
import {
  getSemanticHallOfFame,
  getSemanticLoadSeries,
  getTrackableExerciseNames,
} from '../../utils/statsPerformanceModel';

// 🧩 Importando os Módulos (Nossos novos soldados)
import MuscleHeatmap from '../profile/MuscleHeatmap';
import BiometryChart from './BiometryChart';
import VolumeChart from './VolumeChart';
import TopRecords from './TopRecords';
import ExerciseSearchModal from '../workout/ExerciseSearchModal';

// Componente auxiliar de Seção (mantido para padronizar blocos internos)
const Section = ({ title, children, h = "h-48" }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-muted uppercase tracking-[0.16em] flex items-center gap-2">
            {title}
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

  // Sincroniza o modal com o elemento pai (caso exista)
  useEffect(() => { setIsModalOpen?.(isSelectorOpen); }, [isSelectorOpen, setIsModalOpen]);

  // 🧠 Processamento Central de Dados
  const { biometry, volume, muscleDistribution, hallOfFame, exercises, recentWorkoutsCount } = useMemo(() => {
    const h = Array.isArray(history) ? history : [];
    const b = Array.isArray(bodyHistory) ? bodyHistory : [];
    const referenceDateKey = getLocalDateKey();
    
    // 1. Biometria
    const biometry = b.map(e => ({ 
      date: formatLocalDate(normalizeLocalDateKey(e.date), { day: '2-digit', month: '2-digit' }),
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
    const muscleDistribution = getMuscleVolumeDistribution(h, { referenceDateKey });
    let recentCount = 0;

    const volume = h.map(s => {
      const daysAgo = daysBetweenLocalDates(s.dateKey, referenceDateKey);
      const isRecent = daysAgo !== null && daysAgo >= 0 && daysAgo <= 30;
      const vol = Number(s.totalVolume) || s.exercises.reduce(
        (sum, exercise) => sum + calculateCompletedVolume(exercise.sets || [], exercise),
        0,
      );
      
      if (isRecent) recentCount++;
      return { date: formatLocalDate(s.dateKey, { day: '2-digit', month: '2-digit' }), volume: Math.round(vol), full: s.dateKey };
    }).filter(v => v.volume > 0).reverse();

    return {
      biometry, volume, recentWorkoutsCount: recentCount,
      muscleDistribution,
      hallOfFame: getSemanticHallOfFame(h, workoutData),
      exercises: getTrackableExerciseNames(h, workoutData),
    };
  }, [history, bodyHistory, workoutData]);

  // Filtro de Carga Baseado no Exercício Selecionado
  const loadData = useMemo(() => {
    if (!selectedExercise) return [];
    return getSemanticLoadSeries(history, selectedExercise, workoutData)
      .map((entry) => ({
        date: formatLocalDate(entry.dateKey, { day: '2-digit', month: '2-digit' }),
        carga: entry.canonicalLoad,
        full: entry.dateKey,
      }))
      .sort((a, b) => a.full.localeCompare(b.full));
  }, [history, selectedExercise, workoutData]);


  const monthlyTarget = 20; 
  const consistencyProgress = Math.min(100, Math.round((recentWorkoutsCount / monthlyTarget) * 100));
  
  let statusColor = 'text-danger';
  let barColor = 'bg-danger';
  let borderColor = 'border-danger/50';
  let statusText = 'CRÍTICO';

  if (consistencyProgress >= 80) {
    statusColor = 'text-success';
    barColor = 'bg-success';
    borderColor = 'border-success/50';
    statusText = 'ELITE';
  } else if (consistencyProgress >= 50) {
    statusColor = 'text-primary';
    barColor = 'bg-primary';
    borderColor = 'border-primary/50';
    statusText = 'ESTÁVEL';
  } else if (consistencyProgress >= 25) {
    statusColor = 'text-warning';
    barColor = 'bg-warning';
    borderColor = 'border-warning/50';
    statusText = 'BAIXA';
  }


  return (
    <main className="space-y-6 animate-in fade-in duration-500 font-sans pb-24 relative">
      <header className="flex items-center gap-3 border-b border-primary/20 pb-3">
        <button onClick={() => setView('workout')} className="p-2 bg-card rounded-lg border border-primary/50 text-primary transition-all active:scale-95">
          <ChevronLeft size={20}/>
        </button>
        <h2 className="font-cyber text-lg font-black uppercase text-primary tracking-tighter">CENTRAL DE DADOS</h2>
      </header>

      {/* DASHBOARD DE CONSISTÊNCIA TÁTICO */}
      <div className={`relative bg-card dark:bg-[#050B14] border-l-4 border-y border-r rounded-r-2xl p-5 overflow-hidden transition-all duration-500 border-y-border dark:border-y-white/5 border-r-border dark:border-r-white/5 ${borderColor} shadow-sm hover:shadow-md`}>
        {/* Scanlines e background tático */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
        <div className={`absolute top-[-50%] right-[-10%] w-32 h-32 ${barColor.split(' ')[0]}/10 rounded-full blur-[40px] pointer-events-none`}></div>

        {/* Header do Card */}
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-xs font-black text-muted uppercase tracking-[0.16em] flex items-center gap-1.5 mb-1">
              <CalendarCheck size={14} className={statusColor} /> 
              Consistência (30D)
            </h3>
            <p className="text-[11px] font-bold text-main/70 dark:text-zinc-400 uppercase tracking-wider">
              Operações em Campo
            </p>
          </div>
          
          {/* Status Badge */}
          <div className={`px-2 py-0.5 rounded border ${borderColor} ${barColor.split(' ')[0]}/10 flex items-center`}>
            <span className={`text-xs font-black uppercase tracking-wide ${statusColor}`}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Números e Progress Bar */}
        <div className="relative z-10">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className={`text-4xl font-black leading-none drop-shadow-md ${statusColor}`}>
              {recentWorkoutsCount}
            </span>
            <span className="text-xs font-bold text-muted uppercase tracking-widest">
              / {monthlyTarget} TREINOS
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full h-1.5 bg-black/10 dark:bg-black/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ${barColor}`} 
              style={{ width: `${consistencyProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* DISTRIBUIÇÃO MUSCULAR */}
      <Section title="DISTRIBUIÇÃO MUSCULAR (30D)" icon={Shield} h="auto">
        <div className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-3">
          {muscleDistribution.map((muscle) => (
            <div
              key={muscle.name}
              aria-label={`${muscle.name}: ${muscle.percentage}% do volume, ${Math.round(muscle.volume).toLocaleString('pt-BR')} kg`}
              className="relative overflow-hidden rounded-xl border border-border bg-input/30 p-2 transition-all duration-500"
            >
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 w-full bg-primary opacity-15 transition-all duration-1000"
                style={{ height: `${muscle.percentage}%` }}
              />
              <div className="relative z-10">
                <span className="block text-xs font-black uppercase text-muted">{muscle.name}</span>
                <div className="flex flex-wrap items-baseline justify-between gap-x-1">
                  <span className="text-sm font-black text-main">{muscle.percentage}%</span>
                  <span className="text-[9px] font-bold text-muted">
                    {Math.round(muscle.volume).toLocaleString('pt-BR')} kg
                  </span>
                </div>
              </div>
            </div>
          ))}
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
          className="touch-target w-full bg-card border border-success/30 text-success text-xs font-black p-3 rounded-xl flex justify-between items-center uppercase active:scale-95 shadow-sm transition-all hover:bg-success/5"
        >
          {selectedExercise || "SELECIONAR EXERCÍCIO"} <Search size={14} />
        </button>
        
        <Section title="EVOLUÇÃO DE CARGA" icon={Target}>
          <div className="w-full h-56 mt-4">
            {selectedExercise && loadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 320, height: 200 }}>
                <LineChart data={loadData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--chart-text)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} tickFormatter={(val) => `${val}kg`} width={48} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', color: 'var(--text-main)', fontSize: '12px', borderRadius: '10px' }}
                    labelStyle={{ color: 'var(--chart-text)' }}
                    itemStyle={{ color: 'var(--chart-secondary)', fontWeight: 'bold' }}
                    formatter={(value) => [`${value} kg`, 'Carga canônica máxima']}
                  />
                  {/* Se tiver apenas 1 ponto, a bolinha vai aparecer graças a esse "dot" */}
                  <Line type="monotone" dataKey="carga" stroke="var(--chart-secondary)" strokeWidth={3} dot={{ fill: 'var(--chart-secondary)', r: 4 }} activeDot={{ r: 6, stroke: 'var(--chart-tooltip-bg)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted text-xs uppercase border-2 border-dashed border-border rounded-xl">
                {selectedExercise ? "DADOS INSUFICIENTES PARA O GRÁFICO" : "AGUARDANDO SELEÇÃO..."}
              </div>
            )}
          </div>
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
