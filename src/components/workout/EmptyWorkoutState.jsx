import React from 'react';
import { Target, PlusCircle } from 'lucide-react';

const EmptyWorkoutState = ({ onStartWorkout }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 mt-6 bg-card/50 border-2 border-dashed border-border dark:border-border/50 rounded-3xl text-center shadow-inner relative overflow-hidden transition-colors duration-300">
      
      {/* 🔥 PADRÃO OURO: Grade preta suave no claro, grade branca no escuro */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

      {/* Ícone Central */}
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30 relative z-10">
        <Target size={48} className="text-primary opacity-80" />
        <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20"></div>
      </div>

      {/* 🔥 PADRÃO OURO: text-main adapta sozinho para preto no claro e branco no escuro */}
      <h2 className="text-xl font-black text-main dark:text-white tracking-widest uppercase mb-3 relative z-10">
        Arsenal Vazio
      </h2>
      <p className="text-muted text-sm mb-8 max-w-[250px] relative z-10 leading-relaxed font-bold">
        Nenhum registro de combate detectado. Inicie seu primeiro treinamento para calibrar o scanner biométrico.
      </p>

      {/* 🔥 PADRÃO OURO: shadow-lg (física) no dia, shadow holográfica na noite */}
      <button
        onClick={onStartWorkout}
        className="flex items-center gap-2 bg-primary text-black font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg dark:shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-105 active:scale-95 relative z-10"
      >
        <PlusCircle size={22} />
        Iniciar Primeira Missão
      </button>

    </div>
  );
};

export default EmptyWorkoutState;