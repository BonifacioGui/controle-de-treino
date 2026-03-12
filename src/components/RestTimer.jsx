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
      {/* 🔥 HUD Flutuante - Fundo adaptável ao invés de black/90 🔥 */}
      <div className="bg-card/95 border-2 border-primary p-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] backdrop-blur-md flex items-center gap-4 min-w-[200px]">
        
        <div className="p-3 bg-primary/10 rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.2)]">
          <Timer size={24} className="text-primary" />
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-main/60">Descanso</p>
          <p className="text-3xl font-black font-mono text-primary drop-shadow-[0_0_5px_rgba(var(--primary),0.4)]">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </p>
        </div>

        {/* 🔥 Botões Táticos ajustados para Claro/Escuro 🔥 */}
        <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => addTime(30)} 
              className="text-[10px] font-black text-main/70 bg-input px-2 py-1 rounded border border-border hover:border-primary hover:text-primary transition-all shadow-inner active:scale-95"
            >
              +30s
            </button>
            <button 
              onClick={() => addTime(-30)} 
              className="text-[10px] font-black text-main/70 bg-input px-2 py-1 rounded border border-border hover:border-red-500 hover:text-red-500 transition-all shadow-inner active:scale-95"
            >
              -30s
            </button>
        </div>

        {/* Botão Fechar com Glow de Alerta */}
        <button 
          onClick={onClose} 
          className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1.5 hover:scale-110 hover:bg-red-600 transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10"
        >
            <X size={12} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default RestTimer;