import React from 'react';
import {
  Award,
  Clock3,
  Dumbbell,
  Flame,
  Gauge,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import logoSolo from '../../assets/logo-solo.svg';
import { formatLocalDate } from '../../utils/dateUtils';
import {
  calcDensity,
  createShareCardFieldSelection,
  formatShareDuration,
  formatShareVolume,
  getShareCardLevelProgress,
  normalizeShareCardVariant,
  parseDurationSeconds,
  parseMetricNumber,
  resolveShareCardHighlight,
} from './ShareCardUtils';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

const ShareCardHeader = ({ label = 'Treino concluído' }) => (
  <header className="flex items-center justify-between border-b border-white/10 pb-8">
    <img src={logoSolo} alt="SOLO" className="h-[72px] w-auto max-w-[340px] object-contain object-left" />
    <div className="flex items-center gap-3 text-cyan-300">
      <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />
      <span className="text-[25px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
  </header>
);

const ShareCardMetric = ({ label, value, accent = 'text-white', Icon }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="min-w-0 flex-1 border-l border-white/10 pl-7 first:border-l-0 first:pl-0">
      <div className="mb-3 flex items-center gap-3 text-white/55">
        {Icon && <Icon aria-hidden="true" size={25} className={accent} />}
        <p className="text-[21px] font-bold uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className={`truncate text-[46px] font-black leading-none ${accent}`}>{value}</p>
    </div>
  );
};

const ShareCardProgress = ({ progress }) => {
  if (!progress) return null;
  const percent = Math.round(progress.progress);
  const xpForLevel = Math.max(1, progress.nextThreshold - progress.currentThreshold);
  const xpIntoLevel = Math.max(0, xpForLevel - progress.xpRemaining);
  return (
    <section className="py-7">
      <div className="mb-5 flex items-end justify-between">
        <p className="text-[34px] font-black uppercase tracking-[0.08em] text-white">Nível {progress.level}</p>
        <p className="text-[28px] font-black text-fuchsia-300">{percent}%</p>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_22px_rgba(217,70,239,0.5)]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <p className="mt-4 text-[20px] font-bold uppercase tracking-[0.13em] text-white/45">
        {xpIntoLevel.toLocaleString('pt-BR')} / {xpForLevel.toLocaleString('pt-BR')} XP para o próximo nível
      </p>
    </section>
  );
};

const HIGHLIGHT_ICON = {
  level: Zap,
  badge: Award,
  pr: Trophy,
  boss: ShieldCheck,
};

const ShareCardHighlight = ({ highlight }) => {
  if (!highlight) return null;
  const Icon = HIGHLIGHT_ICON[highlight.type] || Sparkles;
  return (
    <section className="flex items-center gap-7 border-y border-yellow-300/25 bg-yellow-300/[0.06] px-8 py-7">
      <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full border border-yellow-300/35 text-yellow-300">
        <Icon aria-hidden="true" size={39} />
      </div>
      <div className="min-w-0">
        <p className="text-[20px] font-black uppercase tracking-[0.18em] text-yellow-300">{highlight.eyebrow}</p>
        <p className="mt-2 truncate text-[38px] font-black uppercase leading-tight text-white">{highlight.title}</p>
      </div>
    </section>
  );
};

const MainResult = ({ volume, compact = false }) => {
  if (!volume) return null;
  return (
    <section>
      <div className="flex items-baseline gap-5">
        <p className={`${compact ? 'text-[96px]' : 'text-[142px]'} font-black leading-[0.86] tracking-[-0.055em] text-white`}>{volume}</p>
        <p className={`${compact ? 'text-[40px]' : 'text-[50px]'} font-black text-cyan-300`}>KG</p>
      </div>
      <p className="mt-6 text-[24px] font-black uppercase tracking-[0.24em] text-cyan-300">Volume movimentado</p>
    </section>
  );
};

const ShareCardFooter = ({ sessionDate }) => (
  <footer className="mt-auto flex items-end justify-between border-t border-white/10 pt-7">
    <div>
      <p className="text-[30px] font-black tracking-[0.28em] text-white">SOLO</p>
      <p className="mt-2 text-[17px] font-bold uppercase tracking-[0.23em] text-white/40">Where discipline becomes dopamine</p>
    </div>
    {sessionDate && <p className="text-[22px] font-bold uppercase tracking-[0.12em] text-white/45">{sessionDate}</p>}
  </footer>
);

const SecondaryMetrics = ({ duration, xp, streak, sets, performance = false }) => {
  const metrics = performance
    ? [
      duration && { key: 'duration', label: 'Duração', value: duration, Icon: Clock3 },
      Number.isFinite(sets) && sets > 0 && { key: 'sets', label: 'Séries', value: sets, Icon: Dumbbell },
      xp !== null && { key: 'xp', label: 'XP ganho', value: `+${xp}`, accent: 'text-fuchsia-300', Icon: Zap },
    ].filter(Boolean)
    : [
      duration && { key: 'duration', label: 'Duração', value: duration, Icon: Clock3 },
      xp !== null && { key: 'xp', label: 'XP ganho', value: `+${xp}`, accent: 'text-fuchsia-300', Icon: Zap },
      streak !== null && { key: 'streak', label: 'Sequência', value: streak, accent: 'text-orange-400', Icon: Flame },
    ].filter(Boolean);

  if (metrics.length === 0) return null;
  return (
    <section className="flex gap-5 border-y border-white/10 py-8">
      {metrics.map(({ key, ...metric }) => <ShareCardMetric key={key} {...metric} />)}
    </section>
  );
};

const SoloShareVariant = ({ title, volume, duration, xp, streak, progress, highlight, sessionDate }) => (
  <div className="relative z-10 flex h-full flex-col px-[84px] py-[78px]">
    <ShareCardHeader />
    <main className="flex flex-1 flex-col justify-center gap-14 pb-12 pt-16">
      <section>
        <p className="mb-6 text-[23px] font-black uppercase tracking-[0.25em] text-fuchsia-300">Operação concluída</p>
        <h1 className="max-w-[900px] text-[82px] font-black uppercase leading-[0.94] tracking-[-0.035em] text-white">{title}</h1>
      </section>
      <MainResult volume={volume} />
      <SecondaryMetrics duration={duration} xp={xp} streak={streak} />
      <ShareCardProgress progress={progress} />
      <ShareCardHighlight highlight={highlight} />
    </main>
    <ShareCardFooter sessionDate={sessionDate} />
  </div>
);

const PerformanceShareVariant = ({ title, volume, duration, sets, xp, streak, density, progress, highlight, sessionDate }) => (
  <div className="relative z-10 flex h-full flex-col px-[84px] py-[78px]">
    <ShareCardHeader label="Performance" />
    <main className="flex flex-1 flex-col justify-center gap-14 pb-10 pt-16">
      <section>
        <p className="mb-5 text-[22px] font-black uppercase tracking-[0.22em] text-cyan-300">Resumo da sessão</p>
        <h1 className="max-w-[900px] text-[76px] font-black uppercase leading-[0.96] tracking-[-0.03em] text-white">{title}</h1>
      </section>
      <MainResult volume={volume} compact />
      <SecondaryMetrics duration={duration} xp={xp} sets={sets} performance />
      {density !== null && (
        <section className="flex items-center justify-between border-b border-white/10 pb-8">
          <div className="flex items-center gap-4 text-cyan-300"><Gauge size={30} /><span className="text-[24px] font-black uppercase tracking-[0.16em]">Densidade</span></div>
          <p className="text-[42px] font-black text-white">{density} <span className="text-[24px] text-white/45">KG/MIN</span></p>
        </section>
      )}
      {streak !== null && <p className="flex items-center gap-4 text-[30px] font-black text-orange-400"><Flame size={31} /> {streak} {streak === 1 ? 'DIA EM SEQUÊNCIA' : 'DIAS EM SEQUÊNCIA'}</p>}
      <ShareCardProgress progress={progress} />
      <ShareCardHighlight highlight={highlight} />
    </main>
    <ShareCardFooter sessionDate={sessionDate} />
  </div>
);

const PhotoShareVariant = ({ title, volume, duration, xp, streak, progress, sessionDate }) => (
  <div className="relative z-10 flex h-full flex-col px-[74px] py-[70px]">
    <div className="flex items-start justify-between">
      <img src={logoSolo} alt="SOLO" className="h-[70px] w-auto max-w-[330px] object-contain object-left drop-shadow-[0_3px_18px_rgba(0,0,0,0.8)]" />
      {sessionDate && <p className="rounded-full bg-black/45 px-5 py-3 text-[20px] font-bold uppercase tracking-[0.12em] text-white/80">{sessionDate}</p>}
    </div>
    <main className="mt-auto pb-5">
      <p className="mb-5 text-[21px] font-black uppercase tracking-[0.23em] text-cyan-300">Treino concluído</p>
      <h1 className="max-w-[900px] text-[71px] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white drop-shadow-[0_3px_20px_rgba(0,0,0,0.9)]">{title}</h1>
      <div className="mt-10"><MainResult volume={volume} compact /></div>
      <div className="mt-9"><SecondaryMetrics duration={duration} xp={xp} streak={streak} /></div>
      <ShareCardProgress progress={progress} />
      <p className="mt-5 text-[18px] font-bold uppercase tracking-[0.24em] text-white/55">SOLO · Where discipline becomes dopamine</p>
    </main>
  </div>
);

const ShareCardBackground = ({ photo }) => (
  <div className="absolute inset-0 overflow-hidden bg-[#05070d]">
    {photo ? (
      <>
        <img src={photo} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/95" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#03050a] via-[#03050a]/75 to-transparent" />
      </>
    ) : (
      <>
        <div className="absolute -right-48 -top-36 h-[660px] w-[660px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-44 h-[720px] w-[720px] rounded-full bg-fuchsia-600/10 blur-[135px]" />
        <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
      </>
    )}
    <div className="absolute inset-[26px] border border-white/10" />
  </div>
);

const ShareCard = ({
  stats = {},
  bossEncounter = null,
  workoutTitle = 'Treino',
  streak = null,
  xp = null,
  cardRef,
  selfieUrl = null,
  totalXp = null,
  variant = 'solo',
  fieldSelection,
  sessionDate = null,
  levelUp = false,
  newBadges = [],
}) => {
  const safeVariant = normalizeShareCardVariant(variant);
  const numericXp = parseMetricNumber(xp);
  const numericStreak = parseMetricNumber(streak);
  const volume = formatShareVolume(stats.volume);
  const duration = formatShareDuration(stats.duration);
  const sets = parseMetricNumber(stats.sets);
  const prs = parseMetricNumber(stats.prs) ?? 0;
  const fields = createShareCardFieldSelection({
    selection: fieldSelection,
    hasVolume: volume !== null,
    hasDuration: parseDurationSeconds(stats.duration) !== null,
    hasXp: numericXp !== null,
    hasStreak: numericStreak !== null && numericStreak > 0,
    hasPr: prs > 0,
    hasBoss: bossEncounter?.defeated === true,
  });
  const progress = fields.xp ? getShareCardLevelProgress(totalXp) : null;
  const highlight = resolveShareCardHighlight({ levelUp, levelProgress: progress, newBadges, prs, bossEncounter, fields });
  const displayDate = formatLocalDate(sessionDate, { month: 'short' }).replace('.', '').toUpperCase();
  const shared = {
    title: workoutTitle || 'Treino',
    volume: fields.volume ? volume : null,
    duration: fields.duration ? duration : null,
    xp: fields.xp ? Math.max(0, Math.round(numericXp)) : null,
    streak: fields.streak ? Math.max(0, Math.round(numericStreak)) : null,
    progress,
    highlight,
    sessionDate: displayDate,
  };

  return (
    <div aria-hidden="true" className="fixed left-[-9999px] top-0 pointer-events-none">
      <div ref={cardRef} style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} className="relative overflow-hidden bg-[#05070d] font-cyber">
        <ShareCardBackground photo={selfieUrl} />
        {selfieUrl ? (
          <PhotoShareVariant {...shared} />
        ) : safeVariant === 'performance' ? (
          <PerformanceShareVariant {...shared} sets={sets} density={fields.volume && fields.duration ? calcDensity(stats.volume, stats.duration) : null} />
        ) : (
          <SoloShareVariant {...shared} />
        )}
      </div>
    </div>
  );
};

export default ShareCard;
