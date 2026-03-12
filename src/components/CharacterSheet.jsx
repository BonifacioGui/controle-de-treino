import React, { useMemo } from 'react';
import { calculateStats } from '../utils/rpgSystem';
import { Shield, Zap, Heart, Star } from 'lucide-react';

const STAT_ICONS = {
  STR: { icon: Shield, color: 'text-red-500', bar: 'bg-red-500' },
  // Troquei o yellow para amber para dar mais constraste e leitura no fundo branco
  DEX: { icon: Zap, color: 'text-amber-500', bar: 'bg-amber-500' },
  VIT: { icon: Heart, color: 'text-green-500', bar: 'bg-green-500' },
  CHA: { icon: Star, color: 'text-purple-500', bar: 'bg-purple-500' }
};

const CharacterSheet = ({ history }) => {
  const stats = useMemo(() => calculateStats(history), [history]);

  return (
    // 🔥 bg-card substitui o bg-black/40 para integração total com modo claro/escuro
    <div className="bg-card border border-border rounded-2xl p-4 mt-6 shadow-sm relative overflow-hidden z-10">
      
      {/* Brilho de fundo muito sutil para dar um ar cibernético */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <h3 className="text-xs font-black text-main/60 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]"></span>
        Atributos de Combate
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(stats).map(([key, data]) => {
          const Config = STAT_ICONS[key];
          const Icon = Config.icon;
          const progress = (data.xp % 1000) / 10; 

          return (
            // 🔥 Slots de atributos usando bg-input e shadow-inner para profundidade
            <div key={key} className="bg-input border border-border p-3.5 rounded-xl shadow-inner group hover:border-primary/30 transition-all flex flex-col justify-between">
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Ícone elevado (bg-card) para contrastar com o fundo afundado (bg-input) */}
                  <div className={`p-1.5 rounded-lg bg-card border border-border shadow-sm ${Config.color}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-[10px] font-black text-main/70 uppercase tracking-wider">{key}</span>
                </div>
                {/* 🔥 text-main garante leitura no claro e no escuro */}
                <span className="text-xl font-black text-main drop-shadow-sm">
                  {data.level}
                </span>
              </div>
              
              <div className="space-y-1.5 mt-auto">
                <div className="flex justify-between text-[8px] uppercase font-bold text-main/50">
                   <span>{data.label}</span>
                   <span>{Math.floor(data.xp)} XP</span>
                </div>
                {/* 🔥 Trilho da barra adaptado: bg-border/50 no claro, bg-black/60 no escuro */}
                <div className="h-1.5 w-full bg-border/50 dark:bg-black/60 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full ${Config.bar} shadow-[0_0_10px_currentColor] transition-all duration-1000`} 
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