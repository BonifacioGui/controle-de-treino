import React, { useMemo } from 'react';
import { calculateTotalXP, calculateLevel, getRankTitle, getNextLevelProgress } from '../utils/gameLogic';
import { Trophy, Zap } from 'lucide-react';

const UserLevel = ({ history }) => {
  // Cálculos otimizados (só refaz se o histórico mudar)
  const gameStats = useMemo(() => {
    const xp = calculateTotalXP(history);
    const level = calculateLevel(xp);
    const title = getRankTitle(level);
    const progress = getNextLevelProgress(xp, level);
    
    return { xp, level, title, progress };
  }, [history]);

  return (
    <div className="bg-card border border-primary/50 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(var(--primary),0.15)] group">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Trophy size={80} />
      </div>

      <div className="flex justify-between items-end mb-2 relative z-10">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">
            Status do Operador
          </span>
          <h2 className="text-2xl font-black text-main italic uppercase leading-none drop-shadow-md">
            {gameStats.title}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-primary leading-none block">
            LVL {gameStats.level}
          </span>
          <span className="text-[9px] font-bold text-muted uppercase">
            {gameStats.xp.toLocaleString()} XP TOTAL
          </span>
        </div>
      </div>

      {/* Barra de XP */}
      <div className="relative z-10">
        <div className="flex justify-between text-[9px] font-black text-muted mb-1 uppercase tracking-wider">
          <span>Progresso</span>
          <span>{gameStats.progress.xpMissing} XP p/ Nvl {gameStats.level + 1}</span>
        </div>
        
        <div className="h-4 bg-black/50 rounded-full border border-border overflow-hidden relative">
          {/* Efeito de preenchimento animado */}
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out flex items-center justify-end pr-1 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            style={{ width: `${gameStats.progress.percentage}%` }}
          >
            {/* Brilho na ponta da barra */}
            <div className="h-full w-[2px] bg-white/50 shadow-[0_0_10px_white]"></div>
          </div>
          
          {/* Texto de % dentro da barra (se couber) ou centralizado */}
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference z-20">
            {gameStats.progress.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserLevel;