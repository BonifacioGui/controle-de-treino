import React, { useMemo } from 'react';
import { calculateStats } from '../utils/rpgSystem';
import { Shield, Zap, Heart, Star } from 'lucide-react';

const STAT_ICONS = {
  STR: { icon: Shield, color: 'text-red-500', bar: 'bg-red-500' },
  DEX: { icon: Zap, color: 'text-yellow-500', bar: 'bg-yellow-500' },
  VIT: { icon: Heart, color: 'text-green-500', bar: 'bg-green-500' },
  CHA: { icon: Star, color: 'text-purple-500', bar: 'bg-purple-500' }
};

const CharacterSheet = ({ history }) => {
  const stats = useMemo(() => calculateStats(history), [history]);

  return (
    <div className="bg-black/40 border border-primary/30 rounded-2xl p-4 mt-6 backdrop-blur-sm">
      <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
        Atributos de Combate
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, data]) => {
          const Config = STAT_ICONS[key];
          const Icon = Config.icon;
          // Cálculo visual da barra (0 a 100% do próximo nível)
          // Simplificado para visualização
          const progress = (data.xp % 1000) / 10; 

          return (
            <div key={key} className="bg-card/50 p-3 rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-black/50 ${Config.color}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-muted uppercase">{key}</span>
                </div>
                <span className="text-xl font-black text-white italic">
                  {data.level}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] uppercase font-bold text-muted/60">
                   <span>{data.label}</span>
                   <span>{Math.floor(data.xp)} XP</span>
                </div>
                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${Config.bar} shadow-[0_0_10px_currentColor]`} 
                    style={{ width: `${Math.min(100, progress)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSheet;