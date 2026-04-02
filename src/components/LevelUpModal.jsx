import React, { useEffect } from 'react';
import Confetti from 'react-confetti';

export default function LevelUpModal({ level, onClose }) {
  
  useEffect(() => {
    // Espaço reservado para colocar um som de "Level Up" no futuro!
  }, [level]);

  return (
    // 🔥 OVERLAY MANTIDO ESCURO PARA DAR FOCO, MAS COM ANIMAÇÃO DE ENTRADA SUTIL
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Confetes cobrindo a tela toda */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* Adicionei 'gravity' para os confetes caírem de forma mais natural */}
        <Confetti numberOfPieces={300} recycle={false} gravity={0.2} />
      </div>
      
      {/* O Card do Level Up */}
      {/* 🔥 PADRÃO OURO: bg-card e animação de zoom-in para impacto de RPG */}
      <div className="relative z-10 bg-card p-8 rounded-2xl border-4 border-yellow-500 dark:border-yellow-400 text-center shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-500">
        
        {/* 🔥 AJUSTE: text-yellow-600 no dia tem mais contraste no branco */}
        <h2 className="text-4xl font-black text-yellow-600 dark:text-yellow-400 mb-6 uppercase tracking-tighter drop-shadow-sm dark:drop-shadow-md">
          LEVEL UP!
        </h2>
        
        <img 
          src="aranha.gif"
          alt="Victory" 
          className="w-48 h-48 mx-auto mb-8 object-contain drop-shadow-xl"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* 🔥 AJUSTE: text-muted em vez de cinza fixo */}
        <p className="text-muted text-lg font-bold uppercase tracking-widest">
          VOCÊ ALCANÇOU O NÍVEL
        </p>
        
        {/* 🔥 AJUSTE: text-main dark:text-white com glow amarelo apenas no modo escuro */}
        <div className="text-8xl font-black text-main dark:text-white my-4 drop-shadow-md dark:drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]">
          {level !== undefined ? level : "?"}
        </div>
        
        {/* 🔥 AJUSTE: Cores flexíveis para a mensagem de baixo */}
        <p className="text-xs text-yellow-600 dark:text-yellow-200/80 mt-4 uppercase font-bold tracking-widest mb-6">
          Novas missões desbloqueadas!
        </p>
        
        <button 
          onClick={onClose} 
          className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-black font-black rounded-xl transition-transform active:scale-95 uppercase tracking-widest text-lg shadow-lg"
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}