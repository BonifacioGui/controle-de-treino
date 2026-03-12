import React, { useEffect } from 'react';
import Confetti from 'react-confetti';

export default function LevelUpModal({ level, onClose }) {
  
  useEffect(() => {
  }, [level]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Confetes cobrindo a tela toda */}
      <div className="absolute inset-0 pointer-events-none">
        <Confetti numberOfPieces={300} recycle={false} />
      </div>
      
      {/* O Card do Level Up adaptado para o Padrão Ouro (Claro/Escuro) */}
      <div className="relative z-10 bg-card p-8 rounded-3xl border-4 border-amber-400 dark:border-amber-500 text-center shadow-[0_0_50px_rgba(250,204,21,0.2)] max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
        
        <h2 className="text-4xl font-black text-amber-500 mb-6 uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">
          LEVEL UP!
        </h2>
        
        {/* Imagem com Aura de Poder */}
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full"></div>
          <img 
            src="aranha.gif"
            alt="Victory" 
            className="relative z-10 w-48 h-48 mx-auto mb-8 object-contain drop-shadow-xl"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        
        <p className="text-main/70 text-sm font-bold uppercase tracking-widest">
          VOCÊ ALCANÇOU O NÍVEL
        </p>
        
        {/* O número do level adaptável (Preto no claro, Branco no escuro) */}
        <div className="text-8xl font-black text-main my-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
          {level !== undefined ? level : "?"}
        </div>
        
        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-4 uppercase font-black tracking-widest mb-8">
          Novas missões desbloqueadas!
        </p>
        
        {/* Botão de Resgate (Gritando) */}
        <button 
          onClick={onClose} 
          className="w-full py-4 bg-amber-500 text-black font-black rounded-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-lg shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_35px_rgba(250,204,21,0.6)] hover:bg-amber-400 animate-pulse"
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}