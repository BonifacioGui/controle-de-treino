import React from 'react';
import { History, ShieldAlert, User, Dumbbell, ChartNoAxesColumnIncreasing } from 'lucide-react'; 

const CyberNav = ({ currentView, setView }) => {
  const navItems = [
    // 🔥 AJUSTE: No borderGlow, adicionamos shadow-sm para o modo claro (sombra física) 
    // e mantemos o shadow holográfico apenas no dark:
    { id: 'workout', label: 'TREINO', icon: Dumbbell, color: 'text-primary', dot: 'bg-primary', borderGlow: 'border-primary/50 shadow-sm dark:shadow-[0_0_15px_rgba(var(--primary),0.4)]' },
    { id: 'history', label: 'HISTÓRICO', icon: History, color: 'text-secondary', dot: 'bg-secondary', borderGlow: 'border-secondary/50 shadow-sm dark:shadow-[0_0_15px_rgba(var(--secondary),0.4)]' },
    { id: 'stats', label: 'DADOS', icon: ChartNoAxesColumnIncreasing, color: 'text-success', dot: 'bg-success', borderGlow: 'border-success/50 shadow-sm dark:shadow-[0_0_15px_rgba(var(--success),0.4)]' },
    { id: 'profile', label: 'PERFIL', icon: User, color: 'text-blue-500', dot: 'bg-blue-500', borderGlow: 'border-blue-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.4)]' },
    { id: 'manage', label: 'SISTEMA', icon: ShieldAlert, color: 'text-warning', dot: 'bg-warning', borderGlow: 'border-warning/50 shadow-sm dark:shadow-[0_0_15px_rgba(var(--warning),0.4)]' }, 
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-xl border-t border-border px-2 sm:px-6 pb-6 pt-3 animate-in slide-in-from-bottom-full duration-500">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center gap-1 transition-all duration-300 outline-none w-16 tap-highlight-transparent ${
                isActive ? 'scale-105' : 'opacity-40 grayscale hover:opacity-100 hover:scale-100'
              }`}
            >
              
              {/* CAIXA DO ÍCONE */}
              <div className={`p-2 rounded-xl transition-all duration-300 relative z-10 ${
                isActive 
                  ? `bg-input border ${item.borderGlow}` 
                  : 'border border-transparent bg-transparent'
              }`}>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-colors duration-300 ${isActive ? item.color : 'text-muted'}`} 
                />
              </div>
              
              {/* LABEL */}
              {/* 🔥 AJUSTE PADRÃO OURO: text-main garante consistência sem o peso excessivo do foreground puro em fontes pequenas */}
              <span className={`text-[8px] font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase transition-colors duration-300 ${
                isActive ? 'text-main dark:text-white' : 'text-muted'
              }`}>
                {item.label}
              </span>
              
              {/* PONTINHO LED */}
              <div className="h-1 flex items-center justify-center">
                <div 
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    isActive ? `scale-100 opacity-100 animate-pulse ${item.dot}` : 'scale-0 opacity-0'
                  }`} 
                />
              </div>

              {/* Reflexo holográfico - Apenas Dark Mode */}
              {isActive && (
                <div className={`absolute inset-0 top-2 blur-xl opacity-20 -z-10 hidden dark:block ${item.dot}`}></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CyberNav;