import React from 'react';
import { History, ShieldAlert, User, Dumbbell, ChartNoAxesColumnIncreasing } from 'lucide-react';

const CyberNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'workout', label: 'Treino', icon: Dumbbell, color: 'text-secondary', dot: 'bg-secondary', borderGlow: 'border-secondary/50 shadow-sm dark:shadow-[0_0_15px_rgba(var(--secondary),0.4)]' },
    { id: 'history', label: 'Histórico', icon: History, color: 'text-success', dot: 'bg-success', borderGlow: 'border-success/50 shadow-sm dark:shadow-[0_0_15px_rgba(var(--success),0.4)]' },
    { id: 'stats', label: 'Progresso', icon: ChartNoAxesColumnIncreasing, color: 'text-cyan-500', dot: 'bg-cyan-500', borderGlow: 'border-cyan-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.4)]' },
    { id: 'profile', label: 'Perfil', icon: User, color: 'text-blue-500', dot: 'bg-blue-500', borderGlow: 'border-blue-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.4)]' },
    { id: 'manage', label: 'Plano', icon: ShieldAlert, color: 'text-warning', dot: 'bg-warning', borderGlow: 'border-warning/50 shadow-sm dark:shadow-[0_0_15px_rgba(var(--warning),0.4)]' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-xl border-t border-border px-1 sm:px-6 pb-6 pt-3 animate-in slide-in-from-bottom-full duration-500">
      
      <div className="mx-auto flex max-w-md items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`touch-target relative flex min-w-16 flex-col items-center gap-1 rounded-xl px-1 transition-all duration-300 outline-none tap-highlight-transparent ${
                isActive ? 'scale-105' : 'hover:scale-100 grayscale'
              }`}
            >
              
              <div className={`p-2 rounded-xl transition-all duration-300 relative z-10 ${
                isActive 
                  ? `bg-input border ${item.borderGlow}` 
                  : 'border border-transparent bg-transparent'
              }`}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-colors duration-300 ${isActive ? item.color : 'text-[#888888] dark:text-[#777777]'}`} 
                />
              </div>
              
              <span className={`text-[11px] font-bold transition-colors duration-300 ${
                isActive ? 'text-main dark:text-white' : 'text-[#888888] dark:text-[#777777]'
              }`}>
                {item.label}
              </span>
              
              <div className="h-1 flex items-center justify-center">
                <div 
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    isActive ? `scale-100 opacity-100 animate-pulse ${item.dot}` : 'scale-0 opacity-0'
                  }`} 
                />
              </div>

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
