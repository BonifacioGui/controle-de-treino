import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  changeCalendarMonth,
  changeCalendarYear,
  createCalendarViewDate,
  formatCalendarDate,
  isFutureCalendarDate,
} from '../../utils/calendarModel';

const CyberCalendar = ({ selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(() => createCalendarViewDate(selectedDate));

  useEffect(() => {
    if (selectedDate && selectedDate.length === 10) {
      // Sincroniza apenas quando a prop externa muda; navegar internamente não dispara este efeito.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewDate(createCalendarViewDate(selectedDate));
    }
  }, [selectedDate]);
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const today = new Date();
  const viewingCurrentMonth = viewDate.getFullYear() === today.getFullYear()
    && viewDate.getMonth() === today.getMonth();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  return (
    <div className="bg-card/95 backdrop-blur-md border-2 border-primary shadow-xl dark:shadow-[0_0_30px_rgba(0,0,0,0.3)] p-4 rounded-2xl font-sans animate-in zoom-in-95 duration-200 w-72 relative">
      
      {/* Textura sutil: Visível apenas no Dark Mode para não "sujar" o tema claro */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none hidden dark:block"></div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <button onClick={handlePrevMonth} aria-label="Mês anterior" className="p-2 text-primary hover:bg-input rounded-full transition-all">
          <ChevronLeft size={20} />
        </button>
        
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-1 text-[8px] text-primary font-black uppercase tracking-[0.2em] opacity-70">
            ANO
            <select 
              value={viewDate.getFullYear()} 
              onChange={(e) => setViewDate((current) => changeCalendarYear(current, e.target.value))}
              className="bg-transparent border-none outline-none appearance-none cursor-pointer text-primary text-center hover:bg-primary/20 rounded px-1 transition-colors"
            >
              {years.map(y => <option key={y} value={y} className="bg-card text-main">{y}</option>)}
            </select>
          </div>
          
          <select 
            value={viewDate.getMonth()}
            onChange={(e) => setViewDate((current) => changeCalendarMonth(current, e.target.value))}
            className="mt-0.5 cursor-pointer appearance-none rounded border-none bg-transparent px-1 text-center text-sm font-semibold text-main outline-none transition-colors hover:bg-input"
          >
            {months.map((m, i) => <option key={i} value={i} className="bg-card text-main">{m}</option>)}
          </select>
        </div>

        <button type="button" onClick={handleNextMonth} disabled={viewingCurrentMonth} aria-label="Próximo mês" className="p-2 text-primary hover:bg-input rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-30">
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
          const dateStr = formatCalendarDate(viewDate, day);
          const isSelected = selectedDate === dateStr;
          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const isFuture = isFutureCalendarDate(date, today);
          const isToday = 
            day === today.getDate() && 
            viewDate.getMonth() === today.getMonth() && 
            viewDate.getFullYear() === today.getFullYear();

          return (
            <button
              type="button"
              key={day}
              disabled={isFuture}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(dateStr);
                onClose();
              }}
              className={`relative h-8 w-8 text-[10px] font-black rounded-lg transition-all duration-300 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-25
                ${isSelected 
                  ? 'bg-primary text-on-primary shadow-md scale-110 rotate-3 z-10'
                  : 'text-muted hover:bg-input hover:text-primary hover:border border-primary/30'}`}
            >
              {day}
              
              {isToday && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-success shadow-[0_0_5px_rgba(var(--success),0.8)]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CyberCalendar;
