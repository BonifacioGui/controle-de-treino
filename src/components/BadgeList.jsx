import React, { useMemo } from 'react';
import { getUnlockedBadges } from '../utils/gameLogic';
import { 
  Sword, CalendarCheck, Medal, Dumbbell, Zap, Lock, 
  Truck, Accessibility, Flame, Crown 
} from 'lucide-react';

// Mapa de ícones
const ICON_MAP = {
  Sword: Sword,
  CalendarCheck: CalendarCheck,
  Medal: Medal,
  Dumbbell: Dumbbell,
  Zap: Zap,
  Truck: Truck,
  Accessibility: Accessibility,
  Flame: Flame,
  Crown: Crown
};

const BadgeList = ({ history }) => {
  const badges = useMemo(() => getUnlockedBadges(history), [history]);
  
  // Cálculos prévios para a barra de progresso
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-150 relative">
      
      {/* CABEÇALHO DO HALL DA FAMA */}
      <div className="flex justify-between items-end px-4 mb-4">
         <div>
           <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
             <Crown size={16} className="text-secondary" /> Hall da Fama
           </h3>
           <p className="text-[9px] text-muted font-bold uppercase mt-1">Conquistas de Combate</p>
         </div>
         
         {/* Mini HUD de Progresso */}
         <div className="flex flex-col items-end gap-1">
           <span className="text-[10px] font-black text-secondary tracking-wider">
             {unlockedCount} / {totalCount}
           </span>
           <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden border border-border/50">
             <div 
               className="h-full bg-secondary shadow-[0_0_8px_var(--secondary)] transition-all duration-1000 ease-out" 
               style={{ width: `${progressPercent}%` }}
             />
           </div>
         </div>
      </div>
      
      {/* CONTAINER COM SCROLL (Padding ajustado para dar pista visual de scroll) */}
      <div className="flex gap-4 overflow-x-auto pb-6 px-4 pt-2 scrollbar-hide snap-x">
        {badges.map((badge) => {
          const IconComponent = ICON_MAP[badge.icon] || Medal;
          
          return (
            <div 
              key={badge.id} 
              className={`relative min-w-[120px] w-[120px] flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all duration-300 snap-center shrink-0
                ${badge.unlocked 
                  ? 'bg-card border-secondary shadow-[0_0_20px_rgba(var(--secondary),0.15)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(var(--secondary),0.3)]' 
                  : 'bg-black/20 border-border/50 opacity-60 grayscale hover:opacity-80'}`}
            >
              {/* Mini Cadeado de Status (Somente se bloqueado) */}
              {!badge.unlocked && (
                <div className="absolute top-2 right-2 text-muted/50">
                  <Lock size={12} />
                </div>
              )}

              {/* ÍCONE (A silhueta se mantém mesmo bloqueado) */}
              <div className={`mb-3 p-3 rounded-full transition-all duration-500 flex items-center justify-center
                ${badge.unlocked 
                  ? 'bg-secondary text-white shadow-[0_0_15px_var(--secondary)]' 
                  : 'bg-black/40 text-muted/50 border border-muted/20'}`}
              >
                <IconComponent size={24} />
              </div>

              {/* TÍTULO */}
              <h4 className={`text-[11px] font-black uppercase leading-tight mb-1.5 w-full truncate 
                ${badge.unlocked ? 'text-white' : 'text-muted/70'}`}
              >
                {badge.title}
              </h4>
              
              {/* DESCRIÇÃO */}
              <p className={`text-[9px] font-bold leading-tight line-clamp-2 
                ${badge.unlocked ? 'text-slate-300' : 'text-muted/50'}`}
              >
                 {badge.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeList;