import React from 'react';
import { Check } from 'lucide-react';

const WorkoutComplete = ({ 
  onClose, 
  sessionVolume = "0", 
  sessionDuration = "0", 
  sessionPoints = "+0",
  history = [] // 🔥 Agora o componente recebe o histórico real
}) => {
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  
  const today = new Date();
  const currentDayIndex = today.getDay();

  // Função auxiliar para pegar a data em formato YYYY-MM-DD (padrão de banco de dados)
  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcula qual foi o Domingo dessa semana
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayIndex);

  // Cria um array com as datas exatas (YYYY-MM-DD) desta semana
  const currentWeekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return getLocalDateString(d);
  });

  return (
    // 🔥 AJUSTE: bg-black/60 para o claro e bg-black/95 para o escuro
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/60 dark:bg-black/95 backdrop-blur-sm animate-in fade-in duration-500 p-6">
      {/* 🔥 AJUSTE: bg-card no claro, mantendo o aspecto slate/dark no escuro */}
      <div className="w-full max-w-md bg-card/95 dark:bg-slate-900/80 border border-border dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.3)] dark:shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 blur-[50px] rounded-full pointer-events-none"></div>

        {/* 🔥 AJUSTE: text-muted em vez de slate-400 fixo */}
        <h2 className="font-mono text-muted tracking-[0.3em] text-xs uppercase mb-8">
          Relatório de Operação
        </h2>

        {/* Visual de Consistência DINÂMICO REAL */}
        <div className="flex gap-2 mb-10 z-10">
          {weekDays.map((dayLabel, index) => {
            const isToday = index === currentDayIndex;
            const dateStr = currentWeekDates[index];
            
            const isCompleted = history.some(entry => entry.date === dateStr);
            
            // 🔥 AJUSTE: Classes dinâmicas para o padrão das caixinhas
            let boxClass = "bg-input/50 dark:bg-slate-800 border-border dark:border-slate-700"; // Padrão (Vazio/Futuro)
            let textClass = "text-muted font-normal";
            
            if (isCompleted) {
              boxClass = "bg-primary/10 dark:bg-primary/20 border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.2)]";
              textClass = "text-primary font-bold";
            } else if (isToday) {
              boxClass = "bg-secondary/20 dark:bg-secondary/30 border-secondary shadow-[0_0_15px_rgba(var(--secondary),0.6)]";
              textClass = "text-secondary font-black drop-shadow-[0_0_5px_rgba(var(--secondary),0.8)]";
            }

            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <span className={`text-[10px] font-mono ${textClass}`}>
                  {dayLabel}
                </span>
                <div className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${boxClass}`}>
                  {/* Se tiver histórico nesse dia, mostra o check verde/ciano */}
                  {isCompleted && <Check size={18} className="text-primary opacity-80" strokeWidth={3} />}
                  
                  {/* Se for hoje E ainda não tiver treinado, mostra a bolinha piscando */}
                  {(isToday && !isCompleted) && <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--secondary),1)]"></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 🔥 AJUSTE: border-border no lugar de border-slate-800 */}
        <div className="flex w-full justify-between border-y border-border dark:border-slate-800 py-6 mb-8 z-10">
          <div className="text-center flex-1">
            <p className="text-xs text-muted font-mono mb-1">DURAÇÃO</p>
            {/* 🔥 AJUSTE: text-main dark:text-white */}
            <p className="text-xl font-black text-main dark:text-white">{sessionDuration}</p>
          </div>
          {/* 🔥 AJUSTE: bg-border */}
          <div className="w-px bg-border dark:bg-slate-800"></div>
          <div className="text-center flex-1">
            <p className="text-xs text-muted font-mono mb-1">VOLUME</p>
            <p className="text-xl font-black text-main dark:text-white">{sessionVolume}</p>
          </div>
          <div className="w-px bg-border dark:bg-slate-800"></div>
          <div className="text-center flex-1">
            <p className="text-xs text-muted font-mono mb-1">SOLO PTS</p>
            <p className="text-xl font-black text-primary">{sessionPoints}</p>
          </div>
        </div>

        <div className="text-center w-full z-10">
          {/* 🔥 AJUSTE: text-main/80 e text-main dark:text-white */}
          <p className="text-sm text-main/80 dark:text-slate-300 font-medium mb-1">
            O trabalho de hoje está <span className="text-main dark:text-white font-black">FEITO.</span>
          </p>
          <p className="text-xs text-muted font-mono mb-8">
            O protocolo continua amanhã.
          </p>

          {/* 🔥 AJUSTE: bg-input/80 e border-border para o botão primário no claro */}
          <button 
            onClick={onClose} 
            className="w-full bg-input/80 dark:bg-slate-900/80 backdrop-blur-md py-4 rounded-xl font-black text-main dark:text-white uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 border border-border dark:border-slate-700 shadow-sm hover:border-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:bg-input dark:hover:bg-slate-800 active:scale-95"
          >
            <div className="w-1 h-4 bg-primary rounded-full opacity-60"></div>
            <span className="dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
              RETORNAR À BASE
            </span>
            <div className="w-1 h-4 bg-primary rounded-full opacity-60"></div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default WorkoutComplete;