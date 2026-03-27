import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Trophy, Zap, Award, Target } from 'lucide-react';
import { isSameExercise, parseDateTimestamp, safeParseFloat } from '../utils/workoutUtils';

// 🔥 IMPORTAÇÕES WEBP SEM ERRO (Design de Elite) 🔥
import scavengerImg from '../assets/scavenger.webp';
import t800Img from '../assets/t-800.webp'; 
import mechagodzillaImg from '../assets/mechagodzilla.webp';
import irontitanImg from '../assets/irontitan.webp'; 
import adamsmasherImg from '../assets/adamsmasher.webp';

// Roster com as cores de aura de volta apenas para o brilho do drop-shadow
const BOSS_ROSTER = [
  { name: "SCAVENGER UNIT", image: scavengerImg, aura: "rgba(156, 163, 175, 0.8)" },
  { name: "T-800", image: t800Img, aura: "rgba(34, 197, 94, 0.8)" }, 
  { name: "MECHA-GODZILLA", image: mechagodzillaImg, aura: "rgba(59, 130, 246, 0.8)" }, 
  { name: "IRON TITAN", image: irontitanImg, aura: "rgba(168, 85, 247, 0.8)" }, 
  { name: "ADAM SMASHER", image: adamsmasherImg, aura: "rgba(239, 68, 68, 0.8)" } 
];

// O "Banco" de Recompensas (Loot Table) - Padrão Ouro
const LOOT_TABLE = [
  { title: "NÚCLEO DE FORÇA", desc: "+20% XP", icon: <Zap size={24} className="text-yellow-400 fill-yellow-400/20" /> },
  { title: "PLACA DE TITÂNIO", desc: "Defesa Aumentada", icon: <Trophy size={24} className="text-zinc-300 fill-zinc-300/20" /> },
  { title: "MOTOR DE DOBRA", desc: "Recuperação Turbo", icon: <Zap size={24} className="text-blue-400 fill-blue-400/20" /> },
  { title: "MEDALHA DE HONRA", desc: "Badge Liberada", icon: <Award size={24} className="text-purple-400 fill-purple-400/20" /> }
];

const BossSection = ({ currentWorkout, todayVolume, history, selectedDate, activeDay, prHit = false }) => {
  const [damageAnim, setDamageAnim] = useState(false);
  const prevVolumeRef = useRef(todayVolume);
  const [showLootOverlay, setShowLootOverlay] = useState(false);
  const [droppedLoot, setDroppedLoot] = useState(null);
  const wasAliveRef = useRef(true);

  // LÓGICA PADRÃO OURO: Multiplicador de PR STRIKE (+20% de dano visual)
  const effectiveVolume = prHit ? todayVolume * 1.2 : todayVolume;

  // LÓGICA PADRÃO OURO: Animação de Dano Violenta
  useEffect(() => {
    if (effectiveVolume > prevVolumeRef.current) {
      setDamageAnim(true);
      const timer = setTimeout(() => setDamageAnim(false), 300); 
      return () => clearTimeout(timer);
    }
    prevVolumeRef.current = effectiveVolume;
  }, [effectiveVolume]);

  // LÓGICA PADRÃO OURO: Sorteio Anti-Repetição Deterministico (Data + Treino)
  const currentBoss = useMemo(() => {
    const dateStr = selectedDate || new Date().toISOString().split('T')[0];
    const workoutStr = (activeDay || "") + (currentWorkout?.title || "") + (currentWorkout?.focus || "");
    if (!workoutStr) return BOSS_ROSTER[0];

    const seedString = dateStr + workoutStr;
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
    }
    const pseudoRandom = (Math.abs((1664525 * hash + 1013904223) % 4294967296)) / 4294967296;

    return BOSS_ROSTER[Math.floor(pseudoRandom * BOSS_ROSTER.length)];
  }, [selectedDate, activeDay, currentWorkout]);

  // LÓGICA PADRÃO OURO: HP Baseado no Histórico Real (Volume Anterior + 5%)
  const bossStats = useMemo(() => {
    if (!currentWorkout || !currentWorkout.exercises?.length) return { max: 5000, current: 5000, percent: 100, status: 'ALIVE' };
    
    let maxHp = 0;
    const previousSession = history?.filter(h => h.exercises.some(e => isSameExercise(e.name, currentWorkout.exercises[0].name)))?.sort((a, b) => parseDateTimestamp(b.date) - parseDateTimestamp(a.date))[0];
    
    if (previousSession) {
        let prevVolume = 0;
        previousSession.exercises.forEach(ex => { ex.sets?.forEach(s => prevVolume += (safeParseFloat(s.weight) * safeParseFloat(s.reps))); });
        maxHp = Math.max(Math.round(prevVolume * 1.05), 2000); 
    } else { 
        maxHp = 5000; 
    }
    
    const remainingHp = Math.max(0, maxHp - effectiveVolume);
    const percent = (remainingHp / maxHp) * 100;
    return { max: maxHp, current: remainingHp, percent, status: percent <= 0 ? 'DEFEATED' : 'ALIVE' };
  }, [effectiveVolume, currentWorkout, history]);

  // LÓGICA PADRÃO OURO: Gatilho de Loot
  useEffect(() => {
    if (wasAliveRef.current && bossStats.status === 'DEFEATED') {
      const randomLootIndex = Math.floor(Math.random() * LOOT_TABLE.length);
      setDroppedLoot(LOOT_TABLE[randomLootIndex]);
      setShowLootOverlay(true);
      setTimeout(() => setShowLootOverlay(false), 4000);
      wasAliveRef.current = false; 
    } else if (bossStats.status === 'ALIVE') { 
      wasAliveRef.current = true; 
    }
  }, [bossStats.status]);

  return (
    <div className={`relative w-full mb-4 sm:mb-6 transition-transform duration-200 ${damageAnim ? 'scale-[1.01] translate-x-1' : 'scale-100'}`}>
      
      {/* FRAME METÁLICO CHANFRADO */}
      <div 
        className={`relative p-[1px] sm:p-[2px] bg-zinc-800 transition-all duration-500 shadow-xl sm:shadow-2xl border-red-600 ring-1 ring-red-600/30
          ${bossStats.status === 'DEFEATED' ? 'border-green-600 ring-green-600/30 shadow-[0_0_15px_rgba(22,163,74,0.4)]' : ''}`}
        style={{ clipPath: 'polygon(0% 15%, 2% 0%, 98% 0%, 100% 15%, 100% 85%, 98% 100%, 2% 100%, 0% 85%)' }}
      >
        <div className="bg-zinc-950 flex items-stretch relative overflow-hidden h-16 sm:h-22" 
             style={{ clipPath: 'polygon(0% 15%, 2% 0%, 98% 0%, 100% 15%, 100% 85%, 98% 100%, 2% 100%, 0% 85%)' }}>
          
          {/* PORTRAIT DO BOSS */}
          <div className="relative w-20 h-20 sm:w-36 sm:h-32 shrink-0 bg-transparent flex items-center justify-center overflow-hidden">
            {bossStats.status === 'DEFEATED' ? (
              <div className="relative flex flex-col items-center justify-center">
                {/* Glow de fundo pulsante */}
                <div className="absolute w-12 h-12 sm:w-20 sm:h-20 bg-green-500/30 rounded-full blur-xl animate-pulse"></div>
                {/* Troféu preenchido, brilhante e quicando */}
                <Trophy 
                  size={42} 
                  strokeWidth={1.5}
                  className="relative z-10 text-green-400 fill-green-500/30 filter drop-shadow-[0_0_20px_rgba(34,197,94,1)] animate-bounce" 
                />
              </div>
            ) : (
              <>
                <img 
                  src={currentBoss.image} 
                  alt={currentBoss.name} 
                  className={`relative z-10 w-full h-full object-cover grayscale-[15%] transition-all duration-100 animate-pulse
                    ${damageAnim ? 'brightness-150 scale-110 saturate-200' : 'opacity-90'}`}
                  style={{ filter: `drop-shadow(0px 0px 8px ${currentBoss.aura})` }}
                />
              </>
            )}
          </div>

          {/* HUD CENTRAL */}
          <div className="flex-1 flex flex-col justify-center px-2 sm:px-6">
            
            <div className="flex justify-between items-end mb-1 sm:mb-2 pt-1 sm:pt-0">
              <div className="min-w-0 pr-1 sm:pr-2">
                <div className="flex items-center gap-0.5 sm:gap-1 text-red-500 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-0.5 sm:mb-1 truncate pr-1">
                  <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-600 rotate-45 ${damageAnim ? 'animate-ping' : 'animate-pulse'}`}></div>
                  {bossStats.status === 'DEFEATED' ? 'NEUTRALIZADO' : 'ALVO ATUAL'}
                </div>
                <h3 className="text-xs sm:text-2xl font-black uppercase tracking-tight sm:tracking-tighter text-white leading-none truncate pr-1">
                  {currentBoss.name}
                </h3>
              </div>
              
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-0.5 sm:hidden"></p>
                <span className="text-base sm:text-2xl font-black text-red-600 leading-none tabular-nums drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">
                  {bossStats.current.toLocaleString()} <span className="text-[10px] text-zinc-400 font-bold uppercase tabular-nums">HP</span>
                </span>
              </div>
            </div>

            {/* BARRA DE VIDA PLASMA */}
            <div className="relative h-2 sm:h-6 w-full bg-zinc-900 border border-zinc-800 shadow-[inset_0_1px_5px_rgba(0,0,0,1)] overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ease-out relative 
                  ${bossStats.status === 'DEFEATED' ? 'bg-green-600' : 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)]'}`}
                style={{ width: `${bossStats.percent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/30 animate-pulse"></div>
                {prHit && (
                   <div className="absolute inset-0 bg-white/30 animate-pulse flex items-center justify-center">
                      <span className="text-[6px] sm:text-[8px] font-black text-white uppercase tracking-[0.6em] drop-shadow-md">CRITICAL HIT</span>
                   </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-1 sm:mt-2 items-center px-0.5 sm:px-1 text-[8px] sm:text-[11px] font-black uppercase tracking-widest">
               <span className="text-zinc-500 leading-none truncate pr-1">
                  LIMIT: <span className="text-zinc-300 tabular-nums">{bossStats.max.toLocaleString()} KG</span>
               </span>
               <div className="text-red-600 leading-none flex gap-1 items-center shrink-0">
                <span>{Math.round(100 - bossStats.percent)}% DANO</span>
                <span className="opacity-60 text-[8px] hidden sm:inline">Integridade: 100%</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETALHES DECORATIVOS NAS QUINAS */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 sm:w-1.5 sm:h-12 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 sm:w-1.5 sm:h-12 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>

      {/* OVERLAY DE LOOT (Melhorado para brilhar junto com os ícones atualizados) */}
      {showLootOverlay && droppedLoot && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in zoom-in duration-300 p-2 sm:p-4">
           <div className="bg-zinc-950 border-2 border-green-500 py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-[0_0_40px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3 sm:gap-4 w-full">
              
              {/* Ícone brilhante do loot */}
              <div className="relative p-2 sm:p-3 bg-green-900/30 border border-green-500/80 text-green-400 rounded-lg animate-bounce shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                <div className="absolute inset-0 bg-green-500/20 blur-md animate-pulse"></div>
                <div className="relative z-10">{droppedLoot.icon}</div>
              </div>
              
              <div className="flex-1">
                <p className="text-[9px] font-black text-green-500 uppercase tracking-widest leading-none mb-1">RECOMPENSA DE COMBATE</p>
                <p className="text-sm sm:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{droppedLoot.title}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">{droppedLoot.desc}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BossSection;