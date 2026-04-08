import React, { useState, useEffect } from 'react';
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

  // 🔥 LÓGICA DE ANIMAÇÃO
  const [barWidth, setBarWidth] = useState(0);

  // O divisor base do seu RPG é 100 para a raiz quadrada. 
  // Para exibir o "resto" na barra, usamos a matemática da fórmula inversa.
  const currentLevel = data.level || 1;
  const currentXp = data.xp || 0;
  
  // Exemplo: Se Nível 2 precisa de 100 XP e Nível 3 precisa de 400 XP.
  const xpBaseDoNivelAtual = Math.pow(currentLevel - 1, 2) * 100;
  const xpNecessarioProProximoNivel = Math.pow(currentLevel, 2) * 100;
  const xpDentroDoNivel = currentXp - xpBaseDoNivelAtual;
  const xpGap = xpNecessarioProProximoNivel - xpBaseDoNivelAtual;
  
  const progress = Math.min(100, Math.max(0, (xpDentroDoNivel / xpGap) * 100));

  useEffect(() => {
    setBarWidth(0); 
    
    let timer;
    requestAnimationFrame(() => {
      timer = setTimeout(() => {
        setBarWidth(progress);
      }, 400); // Acelerei um pouco a animação para melhor UX
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
              {data.label || 'ATRIBUTO'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black text-main dark:text-white leading-none drop-shadow-sm dark:drop-shadow-md">
            {currentLevel}
          </span>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between items-end text-[8px] uppercase font-bold text-muted dark:text-zinc-500">
          <span>Progresso</span>
          <span className="tabular-nums">{Math.floor(currentXp).toLocaleString()} XP</span>
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

// 🔥 PADRÃO OURO: O CharacterSheet agora APENAS RECEBE o rpgData já calculado pelo ProfileView.
// Removida a propriedade 'history' desnecessária.
const CharacterSheet = ({ rpgData }) => {
  // Se por acaso o rpgData não for passado, temos um fallback de segurança
  const safeData = rpgData || {
    STR: { xp: 0, level: 1, label: "FORÇA" },
    DEX: { xp: 0, level: 1, label: "TÉCNICA" },
    VIT: { xp: 0, level: 1, label: "RESISTÊNCIA" },
    CHA: { xp: 0, level: 1, label: "ESTÉTICA" }
  };

  // Filtramos as chaves que não são atributos (ex: level global, xp global)
  const attributeKeys = ['STR', 'DEX', 'VIT', 'CHA'];

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
        {attributeKeys.map(key => {
          // Garante que se o dado faltar, o StatCard não quebre
          const statData = safeData[key] || { xp: 0, level: 1, label: key };
          return <StatCard key={key} statKey={key} data={statData} />;
        })}
      </div>
    </div>
  );
};

export default CharacterSheet;