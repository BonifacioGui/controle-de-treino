import React from 'react';
import { Skull, Zap, Trophy, Flame, Target } from 'lucide-react';

const ShareCard = ({ stats, bossName, streak, theme, cardRef }) => {
  return (
    /* A div que será capturada precisa ter tamanho fixo (proporção Stories) */
    <div 
      ref={cardRef}
      className="fixed -left-[2000px] top-0 w-[1080px] h-[1920px] bg-card p-20 flex flex-col justify-between font-cyber overflow-hidden shadow-2xl"
      data-theme={theme}
    >
      {/* Background Decorativo Adaptável ao Tema */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute top-0 left-0 w-full h-full border-[40px] border-primary/20 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 border-b-8 border-primary pb-10">
        <h1 className="text-[120px] font-black text-main leading-none drop-shadow-md">
          MISSÃO<br/>
          <span className="text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.4)]">CUMPRIDA</span>
        </h1>
        <p className="text-4xl font-bold text-main/50 mt-4 tracking-[0.5em]">LOG_ID: {new Date().getTime()}</p>
      </div>

      {/* Body - Status do Combate */}
      <div className="relative z-10 space-y-16">
        <div className="flex items-center gap-10">
          <div className="w-40 h-40 bg-red-600 flex items-center justify-center rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-red-500/50">
            <Skull size={80} className="text-white drop-shadow-md" />
          </div>
          <div>
            <p className="text-4xl font-black text-red-600 dark:text-red-500 uppercase tracking-widest drop-shadow-sm">Alvo Eliminado</p>
            <h2 className="text-8xl font-black text-main drop-shadow-md">{bossName}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10">
          <StatBox icon={Zap} label="Tonelagem" value={`${stats.volume.toLocaleString()}kg`} color="text-primary" glow="rgba(var(--primary), 0.4)" />
          <StatBox icon={Target} label="Duração" value={stats.duration} color="text-secondary" glow="rgba(var(--secondary), 0.4)" />
          <StatBox icon={Trophy} label="Recordes" value={stats.prs} color="text-amber-500" glow="rgba(245, 158, 11, 0.4)" />
          <StatBox icon={Flame} label="Streak" value={`${streak} Dias`} color="text-orange-500" glow="rgba(249, 115, 22, 0.4)" />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-between items-end border-t-4 border-border pt-10">
        <div>
          <p className="text-3xl font-black text-primary drop-shadow-sm">PROJETO BOMBA v2.4</p>
          <p className="text-2xl text-main/50 font-bold tracking-widest mt-2">SISTEMA_OPERACIONAL_ATIVO</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-mono text-main font-black drop-shadow-sm">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

// 🔥 StatBox refatorado para ter o Padrão Ouro
const StatBox = ({ icon: Icon, label, value, color, glow }) => (
  <div className="bg-input border-4 border-border p-10 rounded-3xl shadow-inner relative overflow-hidden">
    
    {/* Efeito de brilho interno cibernético (Garante leitura no modo claro) */}
    <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-60" style={{ backgroundColor: glow }}></div>
    
    <div className="flex items-center gap-4 mb-4 relative z-10">
      <Icon size={40} className={color} />
      <span className="text-3xl font-black text-main/60 uppercase tracking-widest">{label}</span>
    </div>
    
    <p className={`text-7xl font-black relative z-10 ${color}`} style={{ textShadow: `0 0 30px ${glow}` }}>
      {value}
    </p>
  </div>
);

export default ShareCard;