import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CyberCalendar = ({ selectedDate, onSelect, onClose }) => {
  // Ajuste para evitar bugs de fuso horário
  const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T00:00:00'));
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
  };

  return (
    <div className="bg-slate-950/95 backdrop-blur-md border-2 border-cyan-500 shadow-[0_0_30px_rgba(0,243,255,0.2)] p-4 rounded-2xl font-cyber animate-in zoom-in-95 duration-200 w-72">
      {/* Efeito de Scanline Interno */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <button onClick={handlePrevMonth} className="p-1 text-cyan-500 hover:bg-cyan-500/20 rounded-full transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="text-[8px] text-cyan-500 font-black uppercase tracking-[0.4em] opacity-70">Log_Year: {viewDate.getFullYear()}</div>
          <div className="text-white font-black italic uppercase text-xs tracking-widest neon-text-cyan">{months[viewDate.getMonth()]}</div>
        </div>
        <button onClick={handleNextMonth} className="p-1 text-cyan-500 hover:bg-cyan-500/20 rounded-full transition-all">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* DIAS DA SEMANA */}
      <div className="grid grid-cols-7 gap-1 mb-2 relative z-10 border-b border-slate-800 pb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-black text-slate-500">{d}</div>
        ))}
      </div>

      {/* GRADE DE DIAS */}
      <div className="grid grid-cols-7 gap-1 relative z-10">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 w-8" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(dateStr);
                onClose();
              }}
              className={`h-8 w-8 text-[10px] font-black rounded-lg transition-all duration-300 flex items-center justify-center
                ${isSelected 
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_#00f3ff] scale-110 rotate-3' 
                  : 'text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border border-cyan-500/30'}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ... todo o seu código do CyberCalendar ...

export default CyberCalendar; // <--- Isso resolve o erro de exportação