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
  Accessibility: Accessibility, // Ícone da Cadeira de Rodas
  Flame: Flame,
  Crown: Crown
};

const BadgeList = ({ history }) => {
  const badges = useMemo(() => getUnlockedBadges(history), [history]);

  return (
    <div className="mt-6 pl-1 animate-in slide-in-from-bottom-4 duration-700 delay-150">
      <div className="flex justify-between items-baseline px-2 mb-2">
         <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">
            Hall da Fama
         </h3>
         <span className="text-[9px] font-bold text-primary">
            {badges.filter(b => b.unlocked).length} / {badges.length}
         </span>
      </div>
      
      {/* Container com Scroll Horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
        {badges.map((badge) => {
          const IconComponent = ICON_MAP[badge.icon] || Medal;
          
          return (
            <div 
              key={badge.id} 
              className={`relative min-w-[110px] w-[110px] flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all duration-500 group
                ${badge.unlocked 
                  ? 'bg-card border-secondary shadow-[0_0_20px_rgba(var(--secondary),0.15)] scale-100' 
                  : 'bg-black/20 border-border opacity-40 grayscale scale-95'}`}
            >
              {/* Ícone com Brilho */}
              <div className={`mb-3 p-3 rounded-full transition-all duration-500 ${badge.unlocked ? 'bg-secondary text-white shadow-[0_0_15px_var(--secondary)]' : 'bg-input text-muted'}`}>
                {badge.unlocked ? <IconComponent size={24} /> : <Lock size={24} />}
              </div>

              {/* Título */}
              <h4 className={`text-[9px] font-black uppercase leading-tight mb-1 ${badge.unlocked ? 'text-white' : 'text-muted'}`}>
                {badge.title}
              </h4>
              
              {/* Descrição */}
              <p className="text-[7px] text-muted font-bold leading-tight px-1">
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