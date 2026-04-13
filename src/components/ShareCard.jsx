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
        className="font-cyber relative overflow-hidden"
      >
        {/* ========================================== */}
        {/* CAMADA 0: FUNDO (SELFIE OU PADRÃO) */}
        {/* ========================================== */}
        {selfieUrl ? (
          <img src={selfieUrl} alt="Selfie de Fundo" className="absolute inset-0 w-full h-full object-cover z-0" />
        ) : (
          <div 
            className="absolute inset-0 z-0 opacity-10 bg-black" 
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
          />
        )}
        
        {/* ========================================== */}
        {/* CAMADA 1: OVERLAY DE LEITURA (GRADIENTE ESCURO) */}
        {/* ========================================== */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/50 to-black/20" />

        {/* ========================================== */}
        {/* CAMADA 2: CONTEÚDO TÁTICO (HUD/DADOS) */}
        {/* ========================================== */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between">
          
          {variant === 'rpg' && (
            <>
              <div className="pt-32 px-20 border-b-8 border-primary/20 pb-12">
                <h1 className="text-[130px] font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">
                  MISSÃO<br/><span className="text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.6)]">CUMPRIDA</span>
                </h1>
                <div className="mt-8 flex items-center gap-4 bg-black/60 backdrop-blur-sm inline-block px-6 py-3 rounded-2xl border border-white/10">
                  <p className="text-3xl font-bold text-primary tracking-[0.4em] uppercase">
                    HORA: {horaAtual}
                  </p>
                </div>
              </div>

              <div className="px-20 space-y-10 flex-1 flex flex-col justify-center">
                <div className="bg-black/60 backdrop-blur-md p-10 rounded-[30px] border border-white/20 shadow-2xl">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                      <Skull size={48} className="text-red-500" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-2xl font-bold text-red-500 uppercase tracking-widest truncate">
                        {volumeNumber >= hpTarget ? "Alvo Neutralizado" : "Alvo Sobreviveu"}
                      </p>
                      <h2 className="text-7xl font-black text-white uppercase tracking-tighter truncate drop-shadow-lg">{bossName}</h2>
                    </div>
                  </div>
                  <div className="bg-white/10 border border-white/20 p-6 rounded-2xl mb-8">
                    <p className="text-3xl text-white italic leading-relaxed font-medium">"{battleReport}"</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-4xl font-black text-fuchsia-400 uppercase tracking-widest drop-shadow-md">Nível {currentLevel}</span>
                      <span className="text-3xl font-bold text-fuchsia-400/80">Progresso</span>
                    </div>
                    <div className="w-full h-6 bg-black/50 rounded-full overflow-hidden border border-white/20 shadow-[inner_0_2px_4px_rgba(0,0,0,0.8)]">
                      <div className="h-full bg-fuchsia-500 shadow-[0_0_20px_#ff00ff]" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 bg-black/60 backdrop-blur-md p-8 rounded-[30px] border border-white/20 divide-x divide-white/20 shadow-2xl">
                  <StatBox icon={Clock} label="Duração" value={stats.duration} color="text-purple-400" first={true} />
                  <StatBox icon={Zap} label="Volume" value={`${stats.volume}`} color="text-cyan-400" />
                  <StatBox icon={Trophy} label="Recordes" value={stats.prs || 0} color="text-yellow-400" />
                </div>
                
                <div className="grid grid-cols-3 gap-6 bg-black/60 backdrop-blur-md p-8 rounded-[30px] border border-white/20 divide-x divide-white/20 shadow-2xl">
                  <StatBox icon={ChevronUp} label="XP Ganho" value={`+${earnedXp}`} color="text-fuchsia-500" first={true} />
                  <StatBox icon={Flame} label="Streak" value={`${streak} Dias`} color="text-orange-500" />
                  <StatBox icon={Target} label="Foco" value="100%" color="text-green-400" />
                </div>
              </div>
            </>
          )}

          {variant === 'data' && (
            <>
              <div className="pt-24 px-20 border-b border-cyan-500/50 pb-8 flex items-end justify-between bg-black/40 backdrop-blur-sm">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Terminal size={32} className="text-cyan-400" />
                    <h2 className="text-2xl font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                      SYS.LOG //
                    </h2>
                  </div>
                  <h1 className="text-[70px] font-black text-white leading-none tracking-tighter uppercase drop-shadow-2xl">
                    REGISTRO <span className="text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">TÁTICO</span>
                  </h1>
                </div>
                <Activity size={64} className="text-white/30" />
              </div>

              <div className="px-20 space-y-8 flex-1 flex flex-col justify-center">
                <div className="bg-black/70 backdrop-blur-xl p-12 rounded-[20px] border-l-8 border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col items-center justify-center py-20">
                  <Dumbbell size={80} className="text-cyan-500/70 mb-6 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                  <p className="text-4xl text-cyan-400 font-mono tracking-[0.3em] uppercase mb-2">Volume Total</p>
                  <p className="text-[140px] font-black text-white leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                    {stats.volume} <span className="text-6xl text-cyan-500">KG</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-black/70 backdrop-blur-xl p-10 rounded-[20px] border border-white/20 flex flex-col items-start justify-center relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-6 opacity-30"><Clock size={100} className="text-white" /></div>
                    <p className="text-2xl text-white/70 font-mono uppercase tracking-widest mb-4">Duração</p>
                    <p className="text-7xl font-black text-white tracking-tighter relative z-10 drop-shadow-md">{stats.duration}</p>
                  </div>
                  
                  <div className="bg-black/70 backdrop-blur-xl p-10 rounded-[20px] border border-white/20 flex flex-col items-start justify-center relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-6 opacity-30"><Flame size={100} className="text-orange-500" /></div>
                    <p className="text-2xl text-orange-500 font-mono uppercase tracking-widest mb-4 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">Streak Ativa</p>
                    <p className="text-7xl font-black text-white tracking-tighter relative z-10 drop-shadow-md">{streak} <span className="text-4xl text-white/70">Dias</span></p>
                  </div>
                </div>

                <div className="bg-fuchsia-900/40 backdrop-blur-md border border-fuchsia-500/50 p-8 rounded-[20px] flex items-center justify-between shadow-[0_0_30px_rgba(217,70,239,0.2)]">
                  <div className="flex items-center gap-4">
                    <Activity size={40} className="text-fuchsia-400" />
                    <div>
                      <p className="text-xl text-fuchsia-300 font-mono uppercase tracking-widest">Status Atual</p>
                      <p className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-md">Nível {currentLevel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.6)]">+{earnedXp} XP</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- FOOTER UNIFICADO --- */}
          <div className="px-20 pb-24 flex justify-between items-end mt-auto bg-gradient-to-t from-black/80 to-transparent pt-10">
            <p className="text-3xl font-black text-white/50 tracking-tighter uppercase italic drop-shadow-md">
              SOLO OS // {variant === 'data' ? 'DADOS_BRUTOS' : 'REDE_DE_BATALHA'}
            </p>
            <p className="text-4xl font-mono text-white/80 bg-black/70 px-6 py-2 rounded-xl border border-white/20 backdrop-blur-sm shadow-lg">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, color, first }) => (
  <div className={`flex flex-col items-center text-center ${first ? 'pl-0' : 'pl-6'}`}>
    <div className="flex items-center gap-3 mb-2">
      <Icon size={28} className={color} />
      <span className="text-xl font-bold text-white/60 uppercase tracking-widest truncate">{label}</span>
    </div>
    <p className={`text-5xl font-black ${color} truncate w-full drop-shadow-[0_0_10px_currentColor]`}>{value}</p>
  </div>
);

export default ShareCard;