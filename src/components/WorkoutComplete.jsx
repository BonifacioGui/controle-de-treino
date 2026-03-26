import React from 'react';
import { Check } from 'lucide-react';

export default function WorkoutComplete({ 
  onClose, 
  sessionVolume = "0", 
  sessionDuration = "0", 
  sessionPoints = "+0",
  history = [] // 🔥 1. Agora o componente recebe o histórico real
}) {
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
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-500 p-6">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 blur-[50px] rounded-full pointer-events-none"></div>

        <h2 className="font-mono text-slate-400 tracking-[0.3em] text-xs uppercase mb-8">
          Relatório de Operação
        </h2>

        {/* Visual de Consistência DINÂMICO REAL */}
        <div className="flex gap-2 mb-10 z-10">
          {weekDays.map((dayLabel, index) => {
            const isToday = index === currentDayIndex;
            const dateStr = currentWeekDates[index];
            
            // 🔥 A MÁGICA: Verifica se no 'history' existe algum treino salvo com a data deste quadrado
            // Se o seu history salvar a data em outro formato (ex: DD/MM/YYYY), me avise!
            const isCompleted = history.some(entry => entry.date === dateStr);
            
            let boxClass = "bg-slate-800 border-slate-700"; // Padrão (Vazio/Futuro)
            let textClass = "text-slate-600 font-normal";
            
            if (isCompleted) {
              boxClass = "bg-primary/20 border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.2)]";
              textClass = "text-primary/70 font-bold";
            } else if (isToday) {
              boxClass = "bg-secondary/30 border-secondary shadow-[0_0_15px_rgba(var(--secondary),0.6)]";
              textClass = "text-secondary font-black drop-shadow-[0_0_5px_rgba(var(--secondary),0.8)]";
            }

            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <span className={`text-[10px] font-mono ${textClass}`}>
                  {dayLabel}
                </span>
                <div className={`w-8 h-8 rounded border flex items-center justify-center ${boxClass}`}>
                  {/* Se tiver histórico nesse dia, mostra o check verde/ciano */}
                  {isCompleted && <Check size={18} className="text-primary opacity-80" strokeWidth={3} />}
                  
                  {/* Se for hoje E ainda não tiver treinado, mostra a bolinha piscando */}
                  {(isToday && !isCompleted) && <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--secondary),1)]"></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ... (O resto do código dos dados e botão continua igualzinho) ... */}
        <div className="flex w-full justify-between border-y border-slate-800 py-6 mb-8 z-10">
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 font-mono mb-1">DURAÇÃO</p>
            <p className="text-xl font-black text-white">{sessionDuration}</p>
          </div>
          <div className="w-px bg-slate-800"></div>
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 font-mono mb-1">VOLUME</p>
            <p className="text-xl font-black text-white">{sessionVolume}</p>
          </div>
          <div className="w-px bg-slate-800"></div>
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 font-mono mb-1">SOLO PTS</p>
            <p className="text-xl font-black text-primary">{sessionPoints}</p>
          </div>
        </div>

        <div className="text-center w-full z-10">
          <p className="text-sm text-slate-300 font-medium mb-1">
            O trabalho de hoje está <span className="text-white font-black">FEITO.</span>
          </p>
          <p className="text-xs text-slate-500 font-mono mb-8">
            O protocolo continua amanhã.
          </p>

          <button 
            onClick={onClose} 
            className="w-full bg-slate-900/80 backdrop-blur-md py-4 rounded-xl font-black text-white uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 border border-slate-700 shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:border-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:bg-slate-800 active:scale-95"
          >
            <div className="w-1 h-4 bg-primary rounded-full opacity-60"></div>
            <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
              RETORNAR À BASE
            </span>
            <div className="w-1 h-4 bg-primary rounded-full opacity-60"></div>
          </button>
        </div>

      </div>
    </div>
  );
}