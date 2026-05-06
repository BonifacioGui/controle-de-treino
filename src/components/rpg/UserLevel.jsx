import React, { useState, useEffect } from 'react';
import { Trophy, Terminal } from 'lucide-react';

// 🔥 PADRÃO OURO: Recebe 'stats' direto, sem recalcular nada!
const UserLevel = ({ stats }) => {
  
  // Cálculo rápido apenas para fins visuais da interface (XP que falta)
  // Nota: Certifique-se de que essa matemática (x 100) bate com a regra do seu rpgSystem!
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
    <div 
      className="bg-card dark:bg-[#050B14] border border-yellow-500/30 dark:border-yellow-500/40 p-5 relative shadow-sm dark:shadow-[0_0_20px_rgba(250,204,21,0.1)] mt-2 group transition-colors"
      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
    >
      {/* Scanlines Táticas Adaptativas */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(250,204,21,0.03)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
      
      {/* Brilho Dourado no Fundo */}
      <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-yellow-500/5 dark:bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none z-0"></div>

      <div className="absolute top-2 right-4 opacity-5 dark:opacity-10 pointer-events-none text-yellow-600 dark:text-yellow-500 transition-all group-hover:scale-110 group-hover:opacity-10 dark:group-hover:opacity-20 duration-500 z-0">
        <Trophy size={80} />
      </div>

      <div className="flex justify-between items-end mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
            <Terminal size={10} className="text-yellow-600 dark:text-yellow-500" />
            <span className="text-[9px] font-mono font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest block">
              Status de Patente
            </span>
          </div>
          <h2 className="text-2xl font-black text-main dark:text-white uppercase leading-none dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            {stats.title || 'Recruta'}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-800 dark:from-yellow-300 dark:via-yellow-500 dark:to-yellow-700 leading-none block drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
            LVL {stats.level || 1}
          </span>
          <span className="text-[9px] font-black text-yellow-600/80 dark:text-yellow-500/70 uppercase tracking-widest mt-1 block">
            {(stats.xp || 0).toLocaleString()} XP TOTAL
          </span>
        </div>
      </div>

      {/* Barra de XP */}
      <div className="relative z-10">
        <div className="flex justify-between text-[9px] font-black text-muted mb-1.5 uppercase tracking-wider">
          <span>PROGRESSO DE NÍVEL</span>
          <span className="text-yellow-600 dark:text-yellow-500/80">{Math.max(0, xpMissing).toLocaleString()} XP P/ LVL {(stats.level || 1) + 1}</span>
        </div>
        
        <div className="h-4 bg-black/10 dark:bg-[#0a0f16] rounded-sm border border-yellow-500/30 overflow-hidden relative shadow-inner dark:shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]">
          {/* O preenchimento dinâmico */}
          <div 
            className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-300 dark:from-yellow-700 dark:via-yellow-500 dark:to-yellow-300 flex items-center justify-end pr-1 shadow-[0_0_10px_rgba(250,204,21,0.4)] dark:shadow-[0_0_15px_rgba(250,204,21,0.6)] relative"
            style={{ 
              width: `${Math.min(100, barWidth)}%`,
              transitionDuration: '1500ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
            {/* Brilho na ponta da barra */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/60 blur-[1px]"></div>
          </div>
          
          {/* Texto de % com mix-blend (mantido, pois cria um efeito visual incrível) */}
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference z-20 pointer-events-none drop-shadow-md">
            {Math.floor(stats.nextLevelProgress || 0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserLevel;