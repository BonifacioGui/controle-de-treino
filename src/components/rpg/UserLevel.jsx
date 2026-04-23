import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

// 🔥 PADRÃO OURO: Recebe 'stats' direto, sem recalcular nada!
const UserLevel = ({ stats }) => {
  
  // Cálculo rápido apenas para fins visuais da interface (XP que falta)
  // Como sabemos que a base é 100, é uma matemática simples:
  const nextLevelXp = Math.pow((stats?.level || 1), 2) * 100;
  const xpMissing = nextLevelXp - (stats?.xp || 0);

  // 🔥 ESTADO DE ANIMAÇÃO: Controla a largura da barra
  const [barWidth, setBarWidth] = useState(0);

  // 🔥 EFEITO GATILHO: Espera a tela renderizar e joga a barra para o valor real
  useEffect(() => {
    // Começa no zero
    setBarWidth(0);
    
    // Pequeno atraso (150ms) para o navegador "respirar" e então aplicar a transição
    const timer = setTimeout(() => {
      setBarWidth(stats?.nextLevelProgress || 0);
    }, 150);

    return () => clearTimeout(timer);
  }, [stats?.nextLevelProgress]);

  if (!stats) return null; // Prevenção contra carregamento fantasma

  return (
    <div className="bg-card border border-primary/50 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(var(--primary),0.15)] group">
      
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-primary transition-colors">
        <Trophy size={80} />
      </div>

      <div className="flex justify-between items-end mb-2 relative z-10">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">
            PROTOCOLO DE EVOLUÇÃO
          </span>
          <h2 className="text-2xl font-black text-main dark:text-white uppercase leading-none drop-shadow-md">
            {stats.title || 'Recruta'}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-primary leading-none block">
            LVL {stats.level || 1}
          </span>
          <span className="text-[9px] font-bold text-muted uppercase">
            {(stats.xp || 0).toLocaleString()} XP TOTAL
          </span>
        </div>
      </div>

      {/* Barra de XP */}
      <div className="relative z-10">
        <div className="flex justify-between text-[9px] font-black text-muted mb-1 uppercase tracking-wider">
          <span>Progresso</span>
          <span>{Math.max(0, xpMissing).toLocaleString()} XP p/ Nvl {(stats.level || 1) + 1}</span>
        </div>
        
        <div className="h-4 bg-input/80 dark:bg-black/50 rounded-full border border-border overflow-hidden relative shadow-inner">
          {/* O preenchimento dinâmico */}
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all flex items-center justify-end pr-1 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            style={{ 
              width: `${Math.min(100, barWidth)}%`,
              transitionDuration: '1500ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
            {/* Brilho na ponta da barra */}
            <div className="h-full w-[2px] bg-white/50 shadow-[0_0_10px_white]"></div>
          </div>
          
          {/* Texto de % com mix-blend. */}
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference z-20 pointer-events-none">
            {Math.floor(stats.nextLevelProgress || 0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserLevel;