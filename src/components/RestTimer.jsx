import React, { useState, useEffect } from 'react';
import { Timer, X } from 'lucide-react';

const RestTimer = ({ initialSeconds = 90, onClose }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  // Reinicia o timer se o initialSeconds mudar (ex: novo exercício)
  useEffect(() => {
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  useEffect(() => {
    let interval = null;
    
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      // Tocou o som? Para o active para não tocar de novo
      const beep = new Audio('https://www.myinstants.com/media/sounds/beep-ping.mp3'); 
      beep.volume = 0.5;
      beep.play().catch(() => {});
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setIsActive(false);
      // Opcional: Chamar onClose() aqui se quiser que feche sozinho
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const addTime = (sec) => setSeconds(s => Math.max(0, s + sec));

  if (!isActive && seconds === 0) return null; 

  return (
    <div className="fixed bottom-24 right-4 z-[150] flex flex-col items-end animate-in slide-in-from-bottom-5">
      <div className="bg-black/90 border border-primary text-primary p-4 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] backdrop-blur-md flex items-center gap-4 min-w-[200px]">
        <div className="p-3 bg-primary/10 rounded-full animate-pulse">
          <Timer size={24} />
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted">Descanso</p>
          <p className="text-3xl font-black font-mono">
            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
          </p>
        </div>

        <div className="flex flex-col gap-1">
            <button onClick={() => addTime(30)} className="text-[10px] bg-gray-800 px-2 py-1 rounded border border-gray-700 hover:border-primary transition">+30s</button>
            <button onClick={() => addTime(-30)} className="text-[10px] bg-gray-800 px-2 py-1 rounded border border-gray-700 hover:border-red-500 transition">-30s</button>
        </div>

        <button onClick={onClose} className="absolute -top-2 -left-2 bg-red-500 text-black rounded-full p-1 hover:scale-110 transition shadow-lg">
            <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default RestTimer;