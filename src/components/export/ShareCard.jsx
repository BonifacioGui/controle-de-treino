import React from 'react';
import {
  Skull, Zap, Trophy, Flame, Target,
  ChevronUp, Clock, Activity, Terminal, Dumbbell,
} from 'lucide-react';
import {
  parseNumeric,
  stripUnit,
  calcDensity,
  getBattleReport,
  levelProgressPercent,
} from './ShareCardUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_WIDTH  = 1080;
const CARD_HEIGHT = 1920;
const VARIANTS    = ['rpg', 'data'];

// ─── StatCell ─────────────────────────────────────────────────────────────────

/**
 * A single stat cell used inside grid rows.
 *
 * @param {object}  props
 * @param {React.ElementType} props.icon
 * @param {string}  props.label
 * @param {string|number} props.value
 * @param {string}  [props.suffix]
 * @param {string}  props.colorClass    - Tailwind text-color class
 * @param {boolean} [props.hasDivider]
 */
const StatCell = ({ icon: Icon, label, value, suffix, colorClass, hasDivider = false }) => (
  <div className={`flex flex-col items-center justify-center text-center ${hasDivider ? 'border-l border-white/10' : ''}`}>
    <div className="flex items-center justify-center gap-3 mb-4">
      <Icon size={36} className={colorClass} />
      <span style={{ fontSize: '26px' }} className="font-bold text-white/60 uppercase tracking-widest">
        {label}
      </span>
    </div>
    <div className="flex items-baseline justify-center gap-2">
      <p style={{ fontSize: '72px', lineHeight: '1' }} className={`font-black ${colorClass} truncate`}>
        {value}
      </p>
      {suffix && (
        <span style={{ fontSize: '28px' }} className={`font-bold ${colorClass} uppercase`}>
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// ─── CardBackground ───────────────────────────────────────────────────────────

const CardBackground = ({ selfieUrl }) => (
  <>
    {selfieUrl ? (
      <img
        src={selfieUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
    ) : (
      <div
        className="absolute inset-0 z-0 opacity-15"
        style={{
          backgroundColor: '#02040a',
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    )}
    {/* Gradient overlay */}
    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/80 to-black/30" />
    {/* Border frame — inline zIndex: z-15 is not a valid Tailwind class */}
    <div
      className="absolute inset-6 rounded-[40px] pointer-events-none border-2 border-white/10"
      style={{ zIndex: 15 }}
    />
  </>
);

// ─── RpgVariant ───────────────────────────────────────────────────────────────

const RpgVariant = ({ stats, bossName, streak, xp, currentLevel, totalXp, bossHp }) => {
  const volume       = parseNumeric(stats.volume);
  const hpTarget     = parseNumeric(bossHp) || 1;
  const bossDefeated = volume >= hpTarget;
  const battleReport = getBattleReport(stats, bossHp);
  const progressPct  = levelProgressPercent(totalXp, currentLevel);
  const horaAtual    = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b-4 border-primary/30 pb-10 mb-12 shrink-0">
        <h1
          style={{ fontSize: '120px', lineHeight: '0.9', letterSpacing: '-0.02em' }}
          className="font-black text-white uppercase drop-shadow-2xl"
        >
          MISSÃO<br />
          <span className="text-primary">CUMPRIDA</span>
        </h1>
        <div className="mt-8 inline-flex items-center gap-4 bg-primary/10 px-8 py-3 rounded-2xl border border-primary/20">
          {/* Static dot — animate-pulse intentionally omitted; breaks html2canvas */}
          <span className="w-4 h-4 rounded-full bg-primary" />
          <p style={{ fontSize: '32px' }} className="font-bold text-primary tracking-[0.3em] uppercase">
            HORA: {horaAtual}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center gap-10">
        {/* Boss card */}
        <div className="bg-black/80 p-12 rounded-[40px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-8 mb-10">
            <div className="w-32 h-32 bg-red-900/30 rounded-3xl flex items-center justify-center border border-red-500/40 shrink-0">
              <Skull size={64} className="text-red-500" />
            </div>
            <div className="overflow-hidden flex-1">
              <p style={{ fontSize: '28px' }} className="font-bold text-red-500 uppercase tracking-widest mb-2">
                {bossDefeated ? 'Alvo Neutralizado' : 'Alvo Sobreviveu'}
              </p>
              <h2
                style={{ fontSize: '80px', lineHeight: '1' }}
                className="font-black text-white uppercase tracking-tighter truncate"
              >
                {bossName}
              </h2>
            </div>
          </div>

          {/* Battle report */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-10">
            <p style={{ fontSize: '36px', lineHeight: '1.4' }} className="text-white/90 italic font-medium">
              "{battleReport}"
            </p>
          </div>

          {/* Level progress */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span style={{ fontSize: '48px' }} className="font-black text-fuchsia-400 uppercase tracking-widest">
                Nível {currentLevel}
              </span>
              <span style={{ fontSize: '32px' }} className="font-bold text-fuchsia-400/80">
                Progresso
              </span>
            </div>
            <div className="w-full h-8 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats row 1 */}
        <div className="grid grid-cols-3 gap-8 bg-black/80 p-10 rounded-[40px] border border-white/10 shadow-2xl shrink-0">
          <StatCell icon={Clock}  label="Duração"  value={stats.duration}           colorClass="text-purple-400" />
          <StatCell icon={Zap}    label="Volume"   value={stripUnit(stats.volume)}  colorClass="text-cyan-400"   hasDivider suffix="kg" />
          <StatCell icon={Trophy} label="Recordes" value={stats.prs ?? 0}           colorClass="text-yellow-400" hasDivider />
        </div>

        {/* Stats row 2 */}
        <div className="grid grid-cols-3 gap-8 bg-black/80 p-10 rounded-[40px] border border-white/10 shadow-2xl shrink-0">
          <StatCell icon={ChevronUp} label="XP Ganho" value={`+${xp}`}            colorClass="text-fuchsia-500" />
          <StatCell icon={Flame}     label="Streak"   value={streak} suffix="Dias" colorClass="text-orange-500" hasDivider />
          <StatCell icon={Target}    label="Foco"     value="100%"                 colorClass="text-green-400"  hasDivider />
        </div>
      </div>
    </div>
  );
};

// ─── DataVariant ──────────────────────────────────────────────────────────────

const DataVariant = ({ stats, bossName, streak, xp, currentLevel }) => {
  const cleanVolume = stripUnit(stats.volume);
  const density     = calcDensity(stats.volume, stats.duration);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b-4 border-cyan-500/30 pb-10 mb-12 shrink-0 flex items-end justify-between bg-black/80 p-8 rounded-[40px]">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Terminal size={40} className="text-cyan-400" />
            <h2 className="text-3xl font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              SYS.LOG // {bossName}
            </h2>
          </div>
          <h1
            style={{ fontSize: '90px', lineHeight: '0.9', letterSpacing: '-0.02em' }}
            className="font-black text-white uppercase drop-shadow-2xl"
          >
            REGISTRO<br />
            <span className="text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">TÁTICO</span>
          </h1>
        </div>
        <Activity size={80} className="text-white/20" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        {/* Volume card */}
        <div className="relative bg-black/90 p-12 rounded-[40px] border-l-8 border-cyan-500 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />

          {stats.prs > 0 && (
            <div className="absolute top-8 right-8 bg-yellow-500/20 border border-yellow-500/50 px-6 py-2 rounded-full flex items-center gap-3">
              <Trophy size={24} className="text-yellow-500" />
              <span className="text-yellow-500 font-bold text-2xl tracking-widest uppercase">
                {stats.prs} Novos PRs
              </span>
            </div>
          )}

          <Dumbbell size={80} className="relative text-cyan-500/70 mb-6 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
          <p className="relative text-4xl text-cyan-400 font-mono tracking-[0.3em] uppercase mb-4">Volume Total</p>
          <div className="relative flex items-baseline gap-4">
            <p style={{ fontSize: '130px', lineHeight: '1' }} className="font-black text-white tracking-tighter drop-shadow-md">
              {cleanVolume}
            </p>
            <span className="text-6xl text-cyan-500 font-bold">KG</span>
          </div>
        </div>

        {/* Duration / Density grid */}
        <div className="grid grid-cols-2 gap-8">
          <div className="relative bg-black/90 p-10 rounded-[40px] border border-white/20 flex flex-col items-start justify-center overflow-hidden shadow-xl min-h-[260px]">
            <div className="absolute -top-4 -right-4 p-6 opacity-20 pointer-events-none">
              <Clock size={160} className="text-white" />
            </div>
            <p className="relative text-3xl text-white/70 font-mono uppercase tracking-widest mb-6">Duração</p>
            <p style={{ fontSize: '90px', lineHeight: '1' }} className="relative font-black text-white tracking-tighter drop-shadow-md">
              {stats.duration}
            </p>
          </div>

          <div className="relative bg-black/90 p-10 rounded-[40px] border border-white/20 flex flex-col items-start justify-center overflow-hidden shadow-xl min-h-[260px]">
            <div className="absolute -top-4 -right-4 p-6 opacity-20 pointer-events-none">
              <Zap size={160} className="text-cyan-500" />
            </div>
            <p className="relative text-3xl text-cyan-500 font-mono uppercase tracking-widest mb-6 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
              Densidade
            </p>
            <p style={{ fontSize: '90px', lineHeight: '1' }} className="relative font-black text-white tracking-tighter drop-shadow-md">
              {density}{' '}
              <span className="text-4xl text-white/70">kg/min</span>
            </p>
          </div>
        </div>

        {/* Status / Streak grid */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-[#1a2332] border border-cyan-500/30 p-10 rounded-[40px] flex items-center justify-between shadow-2xl">
            <div>
              <p className="text-2xl text-cyan-300 font-mono uppercase tracking-widest mb-2">Status</p>
              <p className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                Nível {currentLevel}
              </p>
            </div>
            <p className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
              +{xp} XP
            </p>
          </div>

          <div className="bg-black/90 border border-orange-500/30 p-10 rounded-[40px] flex items-center justify-between shadow-2xl">
            <div>
              <p className="text-2xl text-orange-400 font-mono uppercase tracking-widest mb-2">Streak</p>
              <p className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                {streak} Dias
              </p>
            </div>
            <Flame size={60} className="text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CardFooter ───────────────────────────────────────────────────────────────

const CardFooter = ({ variant }) => (
  <div className="pt-8 mt-auto flex justify-between items-end border-t border-white/10 shrink-0">
    <p style={{ fontSize: '32px' }} className="font-black text-white/40 tracking-widest uppercase italic">
      SOLO OS // {variant === 'data' ? 'DADOS_BRUTOS' : 'REDE_DE_BATALHA'}
    </p>
    <p style={{ fontSize: '32px' }} className="font-mono font-bold text-white/60">
      {new Date().toLocaleDateString('pt-BR')}
    </p>
  </div>
);

// ─── ShareCard ────────────────────────────────────────────────────────────────

/**
 * Renders an off-screen 1080×1920 share-card for html2canvas capture.
 *
 * @param {object}  props
 * @param {{ volume: string|number, duration: string, prs: number }} props.stats
 * @param {string}  props.bossName
 * @param {number}  props.streak
 * @param {number}  props.xp             - XP earned this session
 * @param {React.Ref} props.cardRef      - Forwarded ref for html2canvas
 * @param {string}  [props.selfieUrl]
 * @param {number}  [props.currentLevel]
 * @param {number}  [props.totalXp]      - Cumulative XP (used for progress bar)
 * @param {number}  [props.bossHp]
 * @param {'rpg'|'data'} [props.variant]
 */
const ShareCard = ({
  stats,
  bossName,
  streak,
  xp,
  cardRef,
  selfieUrl,
  currentLevel = 1,
  totalXp      = 0,
  bossHp       = 10_000,
  variant      = 'rpg',
}) => {
  const safeVariant = VARIANTS.includes(variant) ? variant : 'rpg';

  return (
    <div className="fixed top-0 left-[-9999px] pointer-events-none">
      <div
        ref={cardRef}
        style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px`, backgroundColor: '#050B14' }}
        className="font-cyber relative overflow-hidden flex flex-col"
      >
        {/* Layers 0–1: background + overlays */}
        <CardBackground selfieUrl={selfieUrl} />

        {/* Layer 2: content */}
        <div className="absolute inset-0 flex flex-col p-[80px]" style={{ zIndex: 20 }}>
          {safeVariant === 'rpg' && (
            <RpgVariant
              stats={stats}
              bossName={bossName}
              streak={streak}
              xp={xp}
              currentLevel={currentLevel}
              totalXp={totalXp}
              bossHp={bossHp}
            />
          )}

          {safeVariant === 'data' && (
            <DataVariant
              stats={stats}
              bossName={bossName}
              streak={streak}
              xp={xp}
              currentLevel={currentLevel}
            />
          )}

          <CardFooter variant={safeVariant} />
        </div>
      </div>
    </div>
  );
};

export default ShareCard;