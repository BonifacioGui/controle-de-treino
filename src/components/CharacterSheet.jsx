import React, { useMemo, useState, useEffect } from 'react';
import { calculateStats } from '../utils/rpgSystem';
import { Shield, Zap, Heart, Star, Activity } from 'lucide-react';

// 🔥 CONFIGURAÇÃO EM PORTUGUÊS (Glows blindados para o dark mode)
const STAT_CONFIG = {
  STR: { label: 'FOR', icon: Shield, color: 'text-red-500', bgIcon: 'bg-red-500/10', bar: 'bg-red-600 dark:bg-red-500', glow: 'dark:shadow-[0_0_10px_rgba(239,68,68,0.5)]' },
  DEX: { label: 'DES', icon: Zap, color: 'text-blue-500', bgIcon: 'bg-blue-500/10', bar: 'bg-blue-600 dark:bg-blue-500', glow: 'dark:shadow-[0_0_10px_rgba(59,130,246,0.5)]' },
  VIT: { label: 'VIT', icon: Heart, color: 'text-green-500', bgIcon: 'bg-green-500/10', bar: 'bg-green-600 dark:bg-green-500', glow: 'dark:shadow-[0_0_10px_rgba(34,197,94,0.5)]' },
  CHA: { label: 'CAR', icon: Star, color: 'text-purple-500', bgIcon: 'bg-purple-500/10', bar: 'bg-purple-600 dark:bg-purple-500', glow: 'dark:shadow-[0_0_10px_rgba(168,85,247,0.5)]' }
};

const StatCard = ({ statKey, data }) => {
  const Config = STAT_CONFIG[statKey] || { label: statKey, icon: Activity, color: 'text-zinc-500', bgIcon: 'bg-zinc-500/10', bar: 'bg-zinc-500', glow: '' };
  const Icon = Config.icon;

  // 🔥 LÓGICA DE ANIMAÇÃO: Voltando para a que funcionou no seu ambiente
  const [barWidth, setBarWidth] = useState(0);

  const XP_PER_LEVEL = 1000; 
  const progress = data.progressPercentage !== undefined 
    ? data.progressPercentage 
    : ((data.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  useEffect(() => {
    setBarWidth(0); // Reseta pra 0 ao montar
    
    let timer;
    requestAnimationFrame(() => {
      timer = setTimeout(() => {
        setBarWidth(progress);
      }, 1400); // Dá 50ms pro navegador "perceber" o 0 e fazer a mágica
    });

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="group bg-input/50 dark:bg-zinc-900/50 p-3 sm:p-4 rounded-xl border border-border dark:border-white/5 hover:border-primary/30 dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-lg ${Config.bgIcon} ${Config.color} transition-colors group-hover:bg-opacity-20`}>
            <Icon size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-[12px] font-black text-main dark:text-zinc-300 uppercase tracking-widest leading-none mb-0.5">
              {Config.label}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-muted dark:text-zinc-500 uppercase truncate max-w-[70px] sm:max-w-[90px] leading-none">
              {data.label}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black text-main dark:text-white leading-none drop-shadow-sm dark:drop-shadow-md">
            {data.level}
          </span>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between items-end text-[8px] uppercase font-bold text-muted dark:text-zinc-500">
          <span>Progresso</span>
          <span className="tabular-nums">{Math.floor(data.xp).toLocaleString()} XP</span>
        </div>
        
        {/* Fundo da barra */}
        <div className="h-1.5 sm:h-2 w-full bg-black/10 dark:bg-black/60 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
          <div 
            className={`h-full ${Config.bar} ${Config.glow} transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(100, barWidth)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const CharacterSheet = ({ history }) => {
  const stats = useMemo(() => calculateStats(history), [history]);

  return (
    <div className="bg-card dark:bg-zinc-950/80 border border-border dark:border-zinc-800/50 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-sm mt-4">
      
      {/* Efeito holográfico de fundo visível apenas no dark mode */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none hidden dark:block"></div>

      <h3 className="text-[10px] sm:text-xs font-black text-muted dark:text-zinc-400 uppercase tracking-[0.3em] mb-4 sm:mb-5 flex items-center gap-2 relative z-10">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
        </div>
        Atributos de Combate
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
        {Object.entries(stats).map(([key, data]) => (
          <StatCard key={key} statKey={key} data={data} />
        ))}
      </div>
    </div>
  );
};

export default CharacterSheet;