import React from 'react';
import { Zap, History, BarChart2, ShieldAlert, User } from 'lucide-react';

const CyberNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'workout', label: 'TREINO', icon: Zap, color: 'text-primary' },
    { id: 'history', label: 'LOGS', icon: History, color: 'text-secondary' },
    { id: 'stats', label: 'DATA', icon: BarChart2, color: 'text-success' },
    { id: 'profile', label: 'PERFIL', icon: User, color: 'text-blue-500' },
    { id: 'manage', label: 'SISTEMA', icon: ShieldAlert, color: 'text-warning' }, 
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-xl border-t border-border px-6 pb-6 pt-3 animate-in slide-in-from-bottom-full duration-500 transition-colors shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 group ${
                isActive ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              {/* Box do Ícone - Contraste ajustado para Claro/Escuro */}
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-primary/10 border border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.15)]' 
                  : 'border border-transparent group-hover:bg-input/50'
              }`}>
                {/* Ícone: Usa a cor se ativo, senão usa main/40 para não sumir no branco */}
                <Icon size={24} className={`transition-colors duration-300 ${isActive ? item.color : 'text-main/40 group-hover:text-main/70'}`} />
              </div>
              
              {/* Label */}
              <span className={`text-[8px] font-black tracking-[0.2em] uppercase transition-colors ${
                isActive ? 'text-main' : 'text-main/40 group-hover:text-main/70'
              }`}>
                {item.label}
              </span>
              
              {/* Ponto Pulsante - Renderizado sempre para evitar pulos de layout, mas oculto se inativo */}
              <div 
                className={`w-1 h-1 rounded-full mt-1 transition-all duration-300 ${
                  isActive 
                    ? `animate-pulse opacity-100 ${item.color.replace('text-', 'bg-')} shadow-[0_0_5px_currentColor]` 
                    : 'opacity-0'
                }`} 
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CyberNav;