import React from 'react';
import { Skull, Zap, Trophy, Flame, Target, ChevronUp, Clock, Activity, Terminal, Dumbbell } from 'lucide-react';

const ShareCard = ({ 
  stats, bossName, streak, xp, cardRef, selfieUrl, 
  currentLevel = 1, totalXp = 0, bossHp = 10000,
  variant = 'rpg' 
}) => {
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // --- LÓGICA DE RPG REAL ---
  const earnedXp = xp; 
  const volumeNumber = parseInt(String(stats.volume).replace(/\D/g, '')) || 0;
  const hpTarget = parseInt(String(bossHp).replace(/\D/g, '')) || 1; 
  const damagePercent = (volumeNumber / hpTarget) * 100;
  
  let battleReport = "";
  if (volumeNumber >= hpTarget && stats.prs > 0) {
    battleReport = `Aniquilação total. O alvo foi obliterado e ${stats.prs} recorde(s) absoluto(s) de força foram estabelecidos.`;
  } else if (volumeNumber >= hpTarget) {
    battleReport = "Eliminação confirmada. O alvo foi neutralizado com volume de fogo impecável. Excelente trabalho tático.";
  } else if (damagePercent >= 80) {
    battleReport = "Danos críticos. O alvo sobreviveu por pouco e recuou. Exija mais de si mesmo na próxima investida.";
  } else if (damagePercent >= 50) {
    battleReport = "Danos moderados confirmados. A missão foi completada, mas o alvo continua sendo uma ameaça.";
  } else {
    battleReport = "Relatório de danos baixo. O volume tático foi insuficiente e o alvo escapou quase ileso. Comando exige retaliação.";
  }

  const nextLevelXp = currentLevel * 1000;
  const progressPercent = Math.min(100, (totalXp / nextLevelXp) * 100);

  return (
    <div className="fixed top-0 left-[-9999px] pointer-events-none">
      <div 
        ref={cardRef}
        style={{ width: '1080px', height: '1920px', backgroundColor: '#050B14' }}
        className="flex flex-col justify-between font-cyber relative overflow-hidden"
      >
        {/* FUNDO CORRIGIDO: TEXTURA NATIVA CSS */}
        {selfieUrl ? (
          <img src={selfieUrl} className="absolute inset-0 w-full h-full object-cover z-0" />
        ) : (
          <div 
            className="absolute inset-0 z-0 opacity-10" 
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
          />
        )}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* ========================================== */}
        {/* VARIANTE 1: RPG TÁTICO */}
        {/* ========================================== */}
        {variant === 'rpg' && (
          <>
            <div className="relative z-30 pt-32 px-20 border-b-8 border-primary/20 pb-12">
              <h1 className="text-[130px] font-black text-white leading-[0.85] tracking-tighter uppercase">
                MISSÃO<br/><span className="text-primary">CUMPRIDA</span>
              </h1>
              <div className="mt-8 flex items-center gap-4 bg-black/50 inline-block px-6 py-3 rounded-2xl">
                <p className="text-3xl font-bold text-primary tracking-[0.4em] uppercase">
                  HORA: {horaAtual}
                </p>
              </div>
            </div>

            <div className="relative z-30 px-20 space-y-10">
              <div className="bg-black/40 backdrop-blur-md p-10 rounded-[30px] border border-white/10">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                    <Skull size={48} className="text-red-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-2xl font-bold text-red-500/70 uppercase tracking-widest truncate">
                      {volumeNumber >= hpTarget ? "Alvo Neutralizado" : "Alvo Sobreviveu"}
                    </p>
                    <h2 className="text-7xl font-black text-white uppercase tracking-tighter truncate">{bossName}</h2>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl mb-8">
                  <p className="text-3xl text-white italic leading-relaxed font-medium">"{battleReport}"</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-black text-fuchsia-400 uppercase tracking-widest">Nível {currentLevel}</span>
                    <span className="text-3xl font-bold text-fuchsia-400/50">Progresso</span>
                  </div>
                  <div className="w-full h-6 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.5)]">
                    <div className="h-full bg-fuchsia-500 shadow-[0_0_20px_#ff00ff]" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 bg-black/40 backdrop-blur-md p-8 rounded-[30px] border border-white/10 divide-x divide-white/5">
                <StatBox icon={Clock} label="Duração" value={stats.duration} color="text-purple-400" first={true} />
                <StatBox icon={Zap} label="Volume" value={`${stats.volume}`} color="text-cyan-400" />
                <StatBox icon={Trophy} label="Recordes" value={stats.prs || 0} color="text-yellow-400" />
              </div>
              <div className="grid grid-cols-3 gap-6 bg-black/40 backdrop-blur-md p-8 rounded-[30px] border border-white/10 divide-x divide-white/5">
                <StatBox icon={ChevronUp} label="XP Ganho" value={`+${earnedXp}`} color="text-fuchsia-500" first={true} />
                <StatBox icon={Flame} label="Streak" value={`${streak} Dias`} color="text-orange-500" />
                <StatBox icon={Target} label="Foco" value="100%" color="text-green-400" />
              </div>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* VARIANTE 2: RAW DATA (Dashboard Analítico) */}
        {/* ========================================== */}
        {variant === 'data' && (
          <>
            {/* 🔥 CABEÇALHO REDUZIDO E ELEGANTE */}
            <div className="relative z-30 pt-24 px-20 border-b border-cyan-500/30 pb-8 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Terminal size={32} className="text-cyan-400" />
                  <h2 className="text-2xl font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase">
                    SYS.LOG //
                  </h2>
                </div>
                <h1 className="text-[70px] font-black text-white leading-none tracking-tighter uppercase">
                  REGISTRO <span className="text-fuchsia-500">TÁTICO</span>
                </h1>
              </div>
              <Activity size={64} className="text-white/10" />
            </div>

            <div className="relative z-30 px-20 space-y-8 flex-1 flex flex-col justify-center">
              
              {/* Box Principal de Volume */}
              <div className="bg-black/60 backdrop-blur-xl p-12 rounded-[20px] border-l-8 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center py-20">
                <Dumbbell size={80} className="text-cyan-500/50 mb-6" />
                <p className="text-4xl text-cyan-400/80 font-mono tracking-[0.3em] uppercase mb-2">Volume Total</p>
                <p className="text-[140px] font-black text-white leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {stats.volume} <span className="text-6xl text-cyan-500">KG</span>
                </p>
              </div>

              {/* Grid de Metricas Secundárias */}
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-black/60 backdrop-blur-xl p-10 rounded-[20px] border border-white/5 flex flex-col items-start justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-20"><Clock size={100} /></div>
                  <p className="text-2xl text-white/50 font-mono uppercase tracking-widest mb-4">Duração</p>
                  <p className="text-7xl font-black text-white tracking-tighter relative z-10">{stats.duration}</p>
                </div>
                
                <div className="bg-black/60 backdrop-blur-xl p-10 rounded-[20px] border border-white/5 flex flex-col items-start justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-20"><Flame size={100} className="text-orange-500" /></div>
                  <p className="text-2xl text-orange-500/70 font-mono uppercase tracking-widest mb-4">Streak Ativa</p>
                  <p className="text-7xl font-black text-white tracking-tighter relative z-10">{streak} <span className="text-4xl text-white/50">Dias</span></p>
                </div>
              </div>

              {/* Info de Nível Discreta */}
              <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 p-8 rounded-[20px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Activity size={40} className="text-fuchsia-500" />
                  <div>
                    <p className="text-xl text-fuchsia-400 font-mono uppercase tracking-widest">Status Atual</p>
                    <p className="text-4xl font-black text-white uppercase tracking-tighter">Nível {currentLevel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-fuchsia-500">+{earnedXp} XP</p>
                </div>
              </div>

            </div>
          </>
        )}

        {/* --- FOOTER UNIFICADO --- */}
        <div className="relative z-30 px-20 pb-24 flex justify-between items-end mt-auto">
          <p className="text-3xl font-black text-white/30 tracking-tighter uppercase italic">
            SOLO OS // {variant === 'data' ? 'DADOS_BRUTOS' : 'REDE_DE_BATALHA'}
          </p>
          <p className="text-4xl font-mono text-white/50 bg-black/50 px-6 py-2 rounded-xl border border-white/10">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, color, first }) => (
  <div className={`flex flex-col items-center text-center ${first ? 'pl-0' : 'pl-6'}`}>
    <div className="flex items-center gap-3 mb-2">
      <Icon size={28} className={color} />
      <span className="text-xl font-bold text-white/30 uppercase tracking-widest truncate">{label}</span>
    </div>
    <p className={`text-5xl font-black ${color} truncate w-full`}>{value}</p>
  </div>
);

export default ShareCard;