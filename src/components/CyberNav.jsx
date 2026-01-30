import React from 'react';
import { Zap, History, BarChart2, ShieldAlert } from 'lucide-react';

const CyberNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'workout', label: 'TREINO', icon: Zap, color: 'text-cyan-400' },
    { id: 'history', label: 'LOGS', icon: History, color: 'text-pink-500' },
    { id: 'stats', label: 'DATA', icon: BarChart2, color: 'text-emerald-400' },
    { id: 'manage', label: 'SISTEMA', icon: ShieldAlert, color: 'text-amber-400' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-6 pb-6 pt-3 animate-in slide-in-from-bottom-full duration-500">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${
                isActive ? `bg-slate-900 shadow-[0_0_15px_rgba(0,243,255,0.3)] border border-slate-700` : ''
              }`}>
                <Icon size={24} className={isActive ? item.color : 'text-slate-400'} />
              </div>
              <span className={`text-[8px] font-black tracking-[0.2em] uppercase ${
                isActive ? 'text-white' : 'text-slate-600'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className={`w-1 h-1 rounded-full mt-1 animate-pulse ${item.color.replace('text', 'bg')}`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CyberNav;