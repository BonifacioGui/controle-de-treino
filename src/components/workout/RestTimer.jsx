import React, { useState, useEffect } from 'react';
import { Timer, X } from 'lucide-react';

const RestTimer = ({ initialSeconds = 90, onClose }) => {
  // Captura o exato momento em que o timer deve acabar
  const [endTime, setEndTime] = useState(() => Date.now() + initialSeconds * 1000);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  // Se o componente receber novos segundos (o usuário clicou em outra série), recalcula o alvo
  useEffect(() => {
    setEndTime(Date.now() + initialSeconds * 1000);
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  // Motor do relógio: roda a cada segundo checando a hora do celular
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      const distance = Math.round((endTime - Date.now()) / 1000);
      
      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        playBeep();
        onClose(); // Fecha via função pai, sem estado duplicado
      } else {
        setTimeLeft(distance);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, timeLeft, onClose]);

  const playBeep = () => {
    const beep = new Audio('https://www.myinstants.com/media/sounds/beep-ping.mp3'); 
    beep.volume = 0.5;
    beep.play().catch(() => {});
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  const addTime = (sec) => {
    setEndTime(prev => prev + sec * 1000);
    setTimeLeft(prev => prev + sec);
  };

  return (
    <div className="fixed bottom-24 right-4 z-[9999] flex flex-col items-end animate-in slide-in-from-bottom-5">
      {/* 🔥 AJUSTE: bg-card/95 para o claro e bg-black/90 para o escuro. Sombra atrelada à variável --primary */}
      <div className="bg-card/95 dark:bg-black/90 border border-primary text-primary p-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.4)] backdrop-blur-md flex items-center gap-4 min-w-[200px]">
        <div className="p-3 bg-primary/10 rounded-full animate-pulse">
          <Timer size={24} />
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted">Descanso</p>
          {/* O texto do tempo herda text-primary do container, mantendo o visual neon */}
          <p className="text-3xl font-black font-mono">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </p>
        </div>

        <div className="flex flex-col gap-1">
            {/* 🔥 AJUSTE: Remoção do gray-800 fixo. Uso do bg-input adaptável com fallback escuro */}
            <button onClick={() => addTime(30)} className="text-[10px] bg-input dark:bg-gray-800 px-2 py-1 rounded border border-border dark:border-gray-700 hover:border-primary transition text-main dark:text-white">
              +30s
            </button>
            <button onClick={() => addTime(-30)} className="text-[10px] bg-input dark:bg-gray-800 px-2 py-1 rounded border border-border dark:border-gray-700 hover:border-red-500 transition text-main dark:text-white">
              -30s
            </button>
        </div>

        <button onClick={onClose} className="absolute -top-2 -left-2 bg-red-500 text-black rounded-full p-1 hover:scale-110 transition shadow-lg flex items-center justify-center">
            <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default RestTimer;