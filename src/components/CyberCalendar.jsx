import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CyberCalendar = ({ selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (!selectedDate) return new Date();
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  });

  useEffect(() => {
    if (selectedDate && selectedDate.length === 10) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      if (viewDate.getMonth() !== month - 1 || viewDate.getFullYear() !== year) {
        setViewDate(new Date(year, month - 1, day));
      }
    }
  }, [selectedDate]);
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  // Gera os últimos 100 anos para o Fast Travel
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-card/95 backdrop-blur-md border-2 border-primary shadow-[0_0_30px_rgba(0,0,0,0.3)] p-4 rounded-2xl font-cyber animate-in zoom-in-95 duration-200 w-72">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <button onClick={handlePrevMonth} className="p-1 text-primary hover:bg-input rounded-full transition-all">
          <ChevronLeft size={20} />
        </button>
        
        {/* 🔥 CONTROLES DE VIAGEM RÁPIDA (FAST TRAVEL) 🔥 */}
        <div className="text-center flex flex-col items-center">
          
          <div className="flex items-center gap-1 text-[8px] text-primary font-black uppercase tracking-[0.2em] opacity-70">
            LOG_YEAR: 
            <select 
              value={viewDate.getFullYear()} 
              onChange={(e) => setViewDate(new Date(Number(e.target.value), viewDate.getMonth(), 1))}
              className="bg-transparent border-none outline-none appearance-none cursor-pointer text-primary text-center hover:bg-primary/20 rounded px-1 transition-colors"
            >
              {years.map(y => <option key={y} value={y} className="bg-card text-white">{y}</option>)}
            </select>
          </div>
          
          <select 
            value={viewDate.getMonth()}
            onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), Number(e.target.value), 1))}
            className="bg-transparent border-none text-main font-black italic uppercase text-xs tracking-widest outline-none appearance-none cursor-pointer text-center hover:bg-input rounded px-1 mt-0.5 transition-colors"
          >
            {months.map((m, i) => <option key={i} value={i} className="bg-card text-white">{m}</option>)}
          </select>

        </div>

        <button onClick={handleNextMonth} className="p-1 text-primary hover:bg-input rounded-full transition-all">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 relative z-10 border-b border-border pb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-black text-muted">{d}</div>
        ))}
      </div>

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
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110 rotate-3' 
                  : 'text-muted hover:bg-input hover:text-primary hover:border border-primary/30'}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CyberCalendar;