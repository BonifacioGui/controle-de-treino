import React, { useEffect } from 'react';
import Confetti from 'react-confetti';
import { Zap, Target, Terminal } from 'lucide-react';

const LevelUpModal = ({ level, onClose }) => {
  useEffect(() => {
    // Espaço reservado para som de "Level Up"
  }, [level]);

  // 🔥 Paleta restrita: Cores neons industriais
  const cyberColors = ['#00E5FF', '#FF007F', '#FCEE0A', '#FFFFFF'];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500 p-4">
      
      {/* 1. Overlay Tático de Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]"></div>

      <div className="absolute inset-0 pointer-events-none z-50">
        <Confetti numberOfPieces={200} recycle={false} gravity={0.15} colors={cyberColors} />
      </div>
      
      {/* 2. O Card Principal (Ajustado para o "Sweet Spot" de escala) */}
      <div 
        className="relative z-20 bg-[#050B14] p-[2px] shadow-[0_0_50px_rgba(250,204,21,0.15)] max-w-[360px] w-full animate-in zoom-in-95 duration-500"
        style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
      >
        <div 
          className="bg-gradient-to-br from-yellow-500/10 via-[#0a0f16] to-yellow-900/20 border border-yellow-500/40 p-6 md:p-8 w-full flex flex-col items-center text-center relative overflow-hidden"
          style={{ clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)' }}
        >
          
          {/* Micro-UI */}
          <div className="absolute top-3 left-3 flex gap-1">
             <div className="w-1.5 h-1.5 bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
             <div className="w-4 h-1.5 bg-yellow-500/30"></div>
          </div>
          <div className="absolute top-2 right-3 text-[7px] font-mono text-yellow-500/50 tracking-widest">
             SYS.UPGRADE
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-1 mt-2 text-yellow-500 opacity-80">
            <Zap size={20} className="fill-yellow-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          </div>

          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 mb-5 uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">
            LEVEL UP
          </h2>
          
          {/* 🔥 IMAGEM AMPLIADA AQUI */}
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
            <img 
              src="aranha.gif"
              alt="Victory" 
              className="w-40 h-40 mx-auto mb-4 object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] relative z-10"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full justify-center opacity-70 mb-1">
            <div className="h-[1px] w-8 bg-yellow-500/50"></div>
            <p className="text-yellow-500 text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
              Patente Atualizada
            </p>
            <div className="h-[1px] w-8 bg-yellow-500/50"></div>
          </div>
          
          {/* NÚMERO DO NÍVEL AMPLIADO */}
          <div className="text-[96px] leading-none font-black text-white my-2 drop-shadow-[0_0_30px_rgba(250,204,21,0.9)] tracking-tighter">
            {level !== undefined ? level : "?"}
          </div>
          
          <p className="text-[10px] text-yellow-300 mt-2 uppercase font-black tracking-widest mb-6 opacity-90 bg-yellow-500/10 px-3 py-2 border border-yellow-500/30 flex items-center justify-center gap-1.5 w-full">
            <Terminal size={14} />
            Missões desbloqueadas
          </p>
          
          <button 
            onClick={onClose} 
            className="group relative w-full bg-yellow-500 py-4 px-4 flex items-center justify-center transition-all duration-300 overflow-hidden hover:bg-yellow-400 active:scale-[0.98] shadow-[0_0_15px_rgba(250,204,21,0.4)] border-b-[3px] border-yellow-700"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            
            <span className="font-sans font-black text-black uppercase tracking-[0.2em] text-lg relative z-10 flex items-center gap-2 drop-shadow-sm">
              <Target size={20} className="stroke-[2.5]" />
              CONFIRMAR
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;