import React, { useEffect } from 'react';
import Confetti from 'react-confetti';

const LevelUpModal = ({ level, onClose }) => {
  useEffect(() => {
    // Espaço reservado para som de "Level Up"
  }, [level]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      
      <div className="absolute inset-0 pointer-events-none z-50">
        <Confetti numberOfPieces={300} recycle={false} gravity={0.2} />
      </div>
      
      <div className="relative z-10 bg-card p-8 rounded-2xl border-4 border-yellow-500 dark:border-yellow-400 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] max-w-sm w-full mx-4 animate-in zoom-in-95 duration-500">
        
        <h2 className="text-4xl font-black text-yellow-600 dark:text-yellow-400 mb-6 uppercase tracking-tighter drop-shadow-sm dark:drop-shadow-md">
          LEVEL UP!
        </h2>
        
        <img 
          src="aranha.gif"
          alt="Victory" 
          className="w-48 h-48 mx-auto mb-8 object-contain drop-shadow-xl"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <p className="text-muted text-lg font-bold uppercase tracking-widest">
          VOCÊ ALCANÇOU O NÍVEL
        </p>
        
        <div className="text-8xl font-black text-main dark:text-white my-4 drop-shadow-md dark:drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]">
          {level !== undefined ? level : "?"}
        </div>
        
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
};

export default LevelUpModal;