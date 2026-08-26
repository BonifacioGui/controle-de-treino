import React from 'react';
import { History, User, Dumbbell, ChartNoAxesColumnIncreasing } from 'lucide-react';

const CyberNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'workout', label: 'Treino', icon: Dumbbell },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'stats', label: 'Progresso', icon: ChartNoAxesColumnIncreasing },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav aria-label="Navegação principal" className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card/95 px-1 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:px-6">
      
      <div className="mx-auto flex max-w-md items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`touch-target relative flex min-w-16 flex-col items-center gap-1 rounded-xl px-1 outline-none tap-highlight-transparent ${isActive ? 'text-primary' : 'text-muted'}`}
            >
              
              <div className={`p-2 rounded-xl transition-all duration-300 relative z-10 ${
                isActive 
                  ? 'border border-primary/50 bg-primary/10 shadow-[0_0_12px_rgba(var(--primary),0.16)]'
                  : 'border border-transparent bg-transparent'
              }`}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? 'text-primary' : 'text-muted'}
                />
              </div>
              
              <span className={`text-[11px] font-bold transition-colors duration-300 ${
                isActive ? 'text-primary' : 'text-muted'
              }`}>
                {item.label}
              </span>
              
              <div className="h-1 flex items-center justify-center">
                <div 
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    isActive ? 'scale-100 bg-primary opacity-100' : 'scale-0 opacity-0'
                  }`} 
                />
              </div>

            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CyberNav;
