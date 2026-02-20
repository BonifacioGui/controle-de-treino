import React from 'react';
import { Skull, Zap, Trophy, Flame, Target } from 'lucide-react';

const ShareCard = ({ stats, bossName, streak, theme, cardRef }) => {
  return (
    /* A div que será capturada precisa ter tamanho fixo (proporção Stories) */
    <div 
      ref={cardRef}
      className="fixed -left-[2000px] top-0 w-[1080px] h-[1920px] bg-black p-20 flex flex-col justify-between font-cyber overflow-hidden"
      data-theme={theme}
    >
      {/* Background Decorativo */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute top-0 left-0 w-full h-full border-[40px] border-primary/20"></div>

      {/* Header */}
      <div className="relative z-10 border-b-8 border-primary pb-10">
        <h1 className="text-[120px] font-black text-white italic leading-none">
          MISSÃO<br/><span className="text-primary">CUMPRIDA</span>
        </h1>
        <p className="text-4xl font-bold text-muted mt-4 tracking-[0.5em]">LOG_ID: {new Date().getTime()}</p>
      </div>

      {/* Body - Status do Combate */}
      <div className="relative z-10 space-y-16">
        <div className="flex items-center gap-10">
          <div className="w-40 h-40 bg-red-600 flex items-center justify-center rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <Skull size={80} color="white" />
          </div>
          <div>
            <p className="text-4xl font-black text-red-500 uppercase tracking-widest">Alvo Eliminado</p>
            <h2 className="text-8xl font-black text-white italic">{bossName}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10">
          <StatBox icon={Zap} label="Tonelagem" value={`${stats.volume.toLocaleString()}kg`} color="text-cyan-400" />
          <StatBox icon={Target} label="Duração" value={stats.duration} color="text-purple-400" />
          <StatBox icon={Trophy} label="Recordes" value={stats.prs} color="text-yellow-400" />
          <StatBox icon={Flame} label="Streak" value={`${streak} Dias`} color="text-orange-500" />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-between items-end border-t-4 border-white/10 pt-10">
        <div>
          <p className="text-3xl font-black text-primary">PROJETO BOMBA v2.4</p>
          <p className="text-2xl text-muted">SISTEMA_OPERACIONAL_ATIVO</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-mono text-white">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white/5 border-2 border-white/10 p-10 rounded-3xl">
    <div className="flex items-center gap-4 mb-4">
      <Icon size={40} className={color} />
      <span className="text-3xl font-black text-muted uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-7xl font-black italic ${color}`}>{value}</p>
  </div>
);

export default ShareCard;