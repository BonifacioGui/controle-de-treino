import React, { useEffect } from 'react';
import Confetti from 'react-confetti';

// Note que agora estamos usando 'level' (minúsculo)
export default function LevelUpModal({ level, onClose }) {
  
  useEffect(() => {
  }, [level]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Confetes cobrindo a tela toda */}
      <div className="absolute inset-0 pointer-events-none">
        <Confetti numberOfPieces={300} recycle={false} />
      </div>
      
      {/* O Card do Level Up */}
      <div className="relative z-10 bg-slate-900 p-8 rounded-2xl border-4 border-yellow-400 text-center shadow-2xl max-w-sm w-full mx-4">
        <h2 className="text-4xl font-black text-yellow-400 mb-6 italic uppercase tracking-tighter drop-shadow-md">
          LEVEL UP!
        </h2>
        
        <img 
          src="aranha.gif"
          alt="Victory" 
          className="w-48 h-48 mx-auto mb-8 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <p className="text-gray-300 text-lg font-bold uppercase">
          VOCÊ ALCANÇOU O NÍVEL
        </p>
        
        {/* Verificação de segurança: Se level for undefined, mostra erro */}
        <div className="text-8xl font-black text-white my-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          {level !== undefined ? level : "?"}
        </div>
        
        <p className="text-xs text-yellow-200/80 mt-4 uppercase font-bold tracking-widest mb-6">
          Novas missões desbloqueadas!
        </p>
        
        <button 
          onClick={onClose} 
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl transition-transform active:scale-95 uppercase tracking-widest text-lg shadow-lg"
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}