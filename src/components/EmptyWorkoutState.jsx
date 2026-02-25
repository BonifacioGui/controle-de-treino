import React from 'react';
import { Target, PlusCircle } from 'lucide-react';

const EmptyWorkoutState = ({ onStartWorkout }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 mt-6 bg-card/50 border-2 border-dashed border-border/50 rounded-3xl text-center shadow-inner relative overflow-hidden">
      
      {/* Efeito de grade sutil de fundo */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

      {/* Ícone Central */}
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30 relative z-10">
        <Target size={48} className="text-primary opacity-80" />
        <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20"></div>
      </div>

      {/* Texto Tático */}
      <h2 className="text-xl font-black text-white tracking-widest uppercase mb-3 relative z-10">
        Arsenal Vazio
      </h2>
      <p className="text-muted text-sm mb-8 max-w-[250px] relative z-10 leading-relaxed">
        Nenhum registro de combate detectado. Inicie seu primeiro treinamento para calibrar o scanner biométrico.
      </p>

      {/* Botão de Chamada para Ação (CTA) */}
      <button
        onClick={onStartWorkout}
        className="flex items-center gap-2 bg-primary text-black font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-105 active:scale-95 relative z-10"
      >
        <PlusCircle size={22} />
        Iniciar Primeira Missão
      </button>

    </div>
  );
};

export default EmptyWorkoutState;