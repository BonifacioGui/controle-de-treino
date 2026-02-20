import React from 'react';
import { Zap, History, BarChart2, ShieldAlert, User } from 'lucide-react'; // 🔥 Import do User adicionado

const CyberNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'workout', label: 'TREINO', icon: Zap, color: 'text-primary' },
    { id: 'history', label: 'LOGS', icon: History, color: 'text-secondary' },
    { id: 'stats', label: 'DATA', icon: BarChart2, color: 'text-success' },
    { id: 'profile', label: 'PERFIL', icon: User, color: 'text-blue-500' }, // 🔥 O NOVO BOTÃO DE PERFIL
    { id: 'manage', label: 'SISTEMA', icon: ShieldAlert, color: 'text-warning' }, 
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-xl border-t border-border px-6 pb-6 pt-3 animate-in slide-in-from-bottom-full duration-500 transition-colors">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'scale-110' : 'opacity-50 grayscale hover:opacity-100'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive ? `bg-input border border-primary/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]` : 'border border-transparent'
              }`}>
                <Icon size={24} className={isActive ? item.color : 'text-muted'} />
              </div>
              
              <span className={`text-[8px] font-black tracking-[0.2em] uppercase transition-colors ${
                isActive ? 'text-main' : 'text-muted'
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className={`w-1 h-1 rounded-full mt-1 animate-pulse ${item.color.replace('text-', 'bg-')}`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CyberNav;