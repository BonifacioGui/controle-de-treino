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
    <div className="bg-card border border-primary/40 rounded-2xl p-4 relative overflow-hidden shadow-sm group">
      
      {/* Background Decorativo - Usa text-main para adaptar a cor do ícone no fundo */}
      <div className="absolute top-0 right-0 p-4 text-main opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Trophy size={80} />
      </div>

      <div className="flex justify-between items-end mb-2 relative z-10">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">
            Status do Operador
          </span>
          <h2 className="text-2xl font-black text-main uppercase leading-none drop-shadow-sm">
            {gameStats.title}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-primary leading-none block drop-shadow-sm">
            LVL {gameStats.level}
          </span>
          <span className="text-[9px] font-bold text-main/60 uppercase">
            {gameStats.xp.toLocaleString()} XP TOTAL
          </span>
        </div>
      </div>

      {/* Barra de XP */}
      <div className="relative z-10 mt-3">
        <div className="flex justify-between text-[9px] font-black text-main/60 mb-1.5 uppercase tracking-wider">
          <span>Progresso</span>
          <span>{gameStats.progress.xpMissing.toLocaleString()} XP p/ Nvl {gameStats.level + 1}</span>
        </div>
        
        {/* 🔥 Fundo da barra ajustado para bg-input e shadow-inner 🔥 */}
        <div className="h-4 bg-input rounded-full border border-border shadow-inner relative overflow-hidden">
          {/* Efeito de preenchimento animado */}
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out flex items-center justify-end pr-1 shadow-[0_0_10px_rgba(var(--primary),0.4)]"
            style={{ width: `${gameStats.progress.percentage}%` }}
          >
            {/* Brilho na ponta da barra */}
            <div className="h-full w-[2px] bg-white/70 shadow-[0_0_5px_white]"></div>
          </div>
          
          {/* 🔥 Porcentagem com sombra forte para leitura em qualquer fundo 🔥 */}
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] z-20">
            {gameStats.progress.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserLevel;