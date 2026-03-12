import React from 'react';
import { Target, PlusCircle } from 'lucide-react';

const EmptyWorkoutState = ({ onStartWorkout }) => {
  return (
    // Fundo ajustado para bg-input (para ter contraste no modo claro) com shadow-inner
    <div className="flex flex-col items-center justify-center p-10 mt-6 bg-input dark:bg-card/50 border-2 border-dashed border-primary/30 dark:border-border/50 rounded-3xl text-center shadow-inner relative overflow-hidden">
      
      {/* 🔥 Efeito de grade sutil de fundo - Agora usando a cor primária para aparecer no Claro e Escuro 🔥 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary),0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.05)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

      {/* Ícone Central - Glow neon adicionado */}
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30 relative z-10 shadow-[0_0_15px_rgba(var(--primary),0.15)]">
        <Target size={48} className="text-primary opacity-90 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
        <div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-20"></div>
      </div>

      {/* Texto Tático - text-main garante leitura no branco */}
      <h2 className="text-xl font-black text-main tracking-widest uppercase mb-3 relative z-10">
        Arsenal Vazio
      </h2>
      <p className="text-main/60 font-bold text-sm mb-8 max-w-[250px] relative z-10 leading-relaxed uppercase">
        Nenhum registro de combate detectado. Inicie seu primeiro treinamento para calibrar o scanner biométrico.
      </p>

      {/* 🔥 Botão de Chamada para Ação (CTA) Padrão Ouro Gritando 🔥 */}
      <button
        onClick={onStartWorkout}
        className="flex items-center gap-2 bg-primary text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] active:scale-95 relative z-10 animate-pulse"
      >
        <PlusCircle size={22} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
        Iniciar Primeira Missão
      </button>

    </div>
  );
};

export default EmptyWorkoutState;