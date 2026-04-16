import React from 'react';
import { Skull, Zap, Trophy, Flame, Target, ChevronUp, Clock, Activity, Terminal, Dumbbell } from 'lucide-react';

const ShareCard = ({ 
  stats, bossName, streak, xp, cardRef, selfieUrl, 
  currentLevel = 1, totalXp = 0, bossHp = 10000,
  variant = 'rpg' 
}) => {
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const earnedXp = xp; 
  const volumeNumber = parseInt(String(stats.volume).replace(/\D/g, '')) || 0;
  const hpTarget = parseInt(String(bossHp).replace(/\D/g, '')) || 1; 
  const damagePercent = (volumeNumber / hpTarget) * 100;
  
  // 🔥 Limpa o "kg" que vem do sistema para não duplicar
  const cleanVolume = String(stats.volume).replace(/[^0-9.,]/g, '');

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
        className="font-cyber relative overflow-hidden flex flex-col"
      >
        {/* ========================================== */}
        {/* CAMADA 0: FUNDO (SELFIE OU MATRIX) */}
        {/* ========================================== */}
        {selfieUrl ? (
          <img src={selfieUrl} alt="Selfie de Fundo" className="absolute inset-0 w-full h-full object-cover z-0" />
        ) : (
          <div 
            className="absolute inset-0 z-0 opacity-15" 
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundColor: '#02040a' }} 
          />
        )}
        
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/80 to-black/30" />
        <div className="absolute inset-6 z-15 border-2 border-white/10 rounded-[40px] pointer-events-none" />

        {/* ========================================== */}
        {/* CAMADA 2: CONTEÚDO PRINCIPAL */}
        {/* ========================================== */}
        <div className="absolute inset-0 z-20 flex flex-col p-[80px]">
          
          {/* ======================================================== */}
          {/* MODO BATALHA (MANTIDO INTACTO) */}
          {/* ======================================================== */}
          {variant === 'rpg' && (
            <div className="flex flex-col h-full">
              <div className="border-b-4 border-primary/30 pb-10 mb-12 shrink-0">
                <h1 style={{ fontSize: '120px', lineHeight: '0.9', letterSpacing: '-0.02em' }} className="font-black text-white uppercase drop-shadow-2xl">
                  MISSÃO<br/><span className="text-primary">CUMPRIDA</span>
                </h1>
                <div className="mt-8 inline-flex items-center gap-4 bg-primary/10 px-8 py-3 rounded-2xl border border-primary/20">
                  <span className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                  <p style={{ fontSize: '32px' }} className="font-bold text-primary tracking-[0.3em] uppercase">
                    HORA: {horaAtual}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-10">
                <div className="bg-black/80 p-12 rounded-[40px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-8 mb-10">
                    <div className="w-32 h-32 bg-red-900/30 rounded-3xl flex items-center justify-center border border-red-500/40 shrink-0">
                      <Skull size={64} className="text-red-500" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p style={{ fontSize: '28px' }} className="font-bold text-red-500 uppercase tracking-widest mb-2">
                        {volumeNumber >= hpTarget ? "Alvo Neutralizado" : "Alvo Sobreviveu"}
                      </p>
                      <h2 style={{ fontSize: '80px', lineHeight: '1' }} className="font-black text-white uppercase tracking-tighter truncate">{bossName}</h2>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-10">
                    <p style={{ fontSize: '36px', lineHeight: '1.4' }} className="text-white/90 italic font-medium">"{battleReport}"</p>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <span style={{ fontSize: '48px' }} className="font-black text-fuchsia-400 uppercase tracking-widest">Nível {currentLevel}</span>
                      <span style={{ fontSize: '32px' }} className="font-bold text-fuchsia-400/80">Progresso</span>
                    </div>
                    <div className="w-full h-8 bg-black/60 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.5)]" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 bg-black/80 p-10 rounded-[40px] border border-white/10 shadow-2xl shrink-0">
                  <StatBox icon={Clock} label="Duração" value={stats.duration} color="text-purple-400" />
                  <StatBox icon={Zap} label="Volume" value={`${stats.volume}`} color="text-cyan-400" border />
                  <StatBox icon={Trophy} label="Recordes" value={stats.prs || 0} color="text-yellow-400" border />
                </div>
                
                <div className="grid grid-cols-3 gap-8 bg-black/80 p-10 rounded-[40px] border border-white/10 shadow-2xl shrink-0">
                  <StatBox icon={ChevronUp} label="XP Ganho" value={`+${earnedXp}`} color="text-fuchsia-500" />
                  <StatBox icon={Flame} label="Streak" value={`${streak}`} suffix="Dias" color="text-orange-500" border />
                  <StatBox icon={Target} label="Foco" value="100%" color="text-green-400" border />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODO DADOS (AJUSTADO PARA CABER NA TELA) */}
          {/* ======================================================== */}
          {variant === 'data' && (
            <div className="flex flex-col h-full">
              
              {/* HEADER DATA */}
              <div className="flex justify-between items-end border-b-4 border-cyan-500/40 pb-6 mb-8 shrink-0">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <Terminal size={40} className="text-cyan-400" />
                    <h2 style={{ fontSize: '30px' }} className="font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase">
                      SYS.LOG //
                    </h2>
                  </div>
                  <h1 style={{ fontSize: '85px', lineHeight: '0.9' }} className="font-black text-white uppercase tracking-tighter">
                    REGISTRO<br/><span className="text-cyan-500">TÁTICO</span>
                  </h1>
                </div>
                <Activity size={80} className="text-cyan-500/20 mb-2" />
              </div>

              {/* MIOLO: Reduzimos o gap e o padding para caber tudo */}
              <div className="flex-1 flex flex-col justify-center gap-6">
                
                {/* GRANDE PAINEL CENTRAL (VOLUME) */}
                <div className="bg-[#0a101a] border border-cyan-500/30 rounded-[30px] flex flex-col justify-center items-center relative overflow-hidden shadow-2xl py-14">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                    <Dumbbell size={350} className="text-cyan-500" />
                  </div>
                  
                  <p style={{ fontSize: '32px' }} className="text-cyan-500 font-mono tracking-[0.4em] uppercase mb-4 z-10">
                    Volume Total
                  </p>
                  <div className="flex items-baseline gap-4 z-10">
                    <p style={{ fontSize: '130px', lineHeight: '0.8' }} className="font-black text-white tracking-tighter">
                      {cleanVolume || "0"}
                    </p>
                    <span style={{ fontSize: '46px' }} className="font-black text-cyan-500 uppercase">KG</span>
                  </div>
                </div>

                {/* GRID INFERIOR */}
                <div className="grid grid-cols-2 gap-6 shrink-0">
                  <div className="bg-[#0a101a] border border-white/10 rounded-[30px] p-8 flex flex-col items-center justify-center text-center shadow-xl">
                    <Clock size={56} className="text-purple-400 mb-4" />
                    <p style={{ fontSize: '26px' }} className="text-white/50 font-mono uppercase tracking-widest mb-2">Duração</p>
                    <p style={{ fontSize: '64px', lineHeight: '1' }} className="font-black text-white tracking-tighter">{stats.duration}</p>
                  </div>
                  
                  <div className="bg-[#0a101a] border border-white/10 rounded-[30px] p-8 flex flex-col items-center justify-center text-center shadow-xl">
                    <Flame size={56} className="text-orange-500 mb-4" />
                    <p style={{ fontSize: '26px' }} className="text-white/50 font-mono uppercase tracking-widest mb-2">Streak</p>
                    <div className="flex items-baseline gap-2">
                      <p style={{ fontSize: '64px', lineHeight: '1' }} className="font-black text-white tracking-tighter">{streak}</p>
                      <span style={{ fontSize: '28px' }} className="font-bold text-orange-500 uppercase">Dias</span>
                    </div>
                  </div>
                </div>

                {/* PAINEL DE XP */}
                <div className="bg-[#1a0820] border border-fuchsia-500/40 rounded-[30px] p-8 flex items-center justify-between shadow-2xl shrink-0">
                  <div className="flex items-center gap-6">
                    <Target size={48} className="text-fuchsia-500" />
                    <div>
                      <p style={{ fontSize: '24px' }} className="text-fuchsia-400/80 font-mono uppercase tracking-widest mb-1">Status Atual</p>
                      <p style={{ fontSize: '42px', lineHeight: '1' }} className="font-black text-white uppercase tracking-tighter">Nível {currentLevel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: '56px', lineHeight: '1' }} className="font-black text-fuchsia-400">+{earnedXp} XP</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* FOOTER UNIFICADO */}
          {/* ========================================== */}
          <div className="pt-8 mt-auto flex justify-between items-end border-t border-white/10 shrink-0">
            <p style={{ fontSize: '32px' }} className="font-black text-white/40 tracking-widest uppercase italic">
              SOLO OS // {variant === 'data' ? 'DADOS_BRUTOS' : 'REDE_DE_BATALHA'}
            </p>
            <p style={{ fontSize: '32px' }} className="font-mono font-bold text-white/60">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, suffix, color, border }) => (
  <div className={`flex flex-col items-center justify-center text-center ${border ? 'border-l border-white/10' : ''}`}>
    <div className="flex items-center justify-center gap-3 mb-4">
      <Icon size={36} className={`${color}`} />
      <span style={{ fontSize: '26px' }} className="font-bold text-white/60 uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex items-baseline justify-center gap-2">
      <p style={{ fontSize: '72px', lineHeight: '1' }} className={`font-black ${color} truncate`}>{value}</p>
      {suffix && <span style={{ fontSize: '28px' }} className={`font-bold ${color} uppercase`}>{suffix}</span>}
    </div>
  </div>
);

export default ShareCard;