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
  createShareCardMetricSelection,
  formatShareDuration,
  formatShareVolume,
  getSelectedShareCardMetricKeys,
  getShareCardLevelProgress,
  parseDurationSeconds,
  parseMetricNumber,
  resolveShareCardHighlight,
} from './ShareCardUtils';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

const ShareCardHeader = ({ sessionDate }) => (
  <header className="flex items-start justify-between border-b border-white/10 pb-8">
    <img src={logoSolo} alt="SOLO" className="h-[72px] w-auto max-w-[340px] object-contain object-left" />
    <div className="text-right">
      <div className="flex items-center justify-end gap-3 text-cyan-300">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />
        <span className="text-[25px] font-black uppercase tracking-[0.2em]">Treino concluído</span>
      </div>
      {sessionDate && <p className="mt-3 text-[20px] font-bold uppercase tracking-[0.12em] text-white/45">{sessionDate}</p>}
    </div>
  </header>
);

const ShareCardMetric = ({ label, value, accent = 'text-white', Icon }) => (
  <div className="min-w-0 flex-1 border-l border-white/10 pl-7 first:border-l-0 first:pl-0">
    <div className="mb-3 flex items-center gap-3 text-white/55">
      {Icon && <Icon aria-hidden="true" size={25} className={accent} />}
      <p className="text-[20px] font-bold uppercase tracking-[0.13em]">{label}</p>
    </div>
    <p className={`truncate text-[44px] font-black leading-none ${accent}`}>{value}</p>
  </div>
);

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

const HIGHLIGHT_ICON = { level: Zap, badge: Award, pr: Trophy, boss: ShieldCheck };

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

const MainResult = ({ volume }) => (
  <section>
    <div className="flex items-baseline gap-5">
      <p className="text-[142px] font-black leading-[0.86] tracking-[-0.055em] text-white">{volume || '—'}</p>
      {volume && <p className="text-[50px] font-black text-cyan-300">KG</p>}
    </div>
    <p className="mt-6 text-[24px] font-black uppercase tracking-[0.24em] text-cyan-300">{volume ? 'Volume movimentado' : 'Volume não registrado'}</p>
  </section>
);

const ShareCardFooter = () => (
  <footer className="mt-auto border-t border-white/10 pt-7">
    <p className="text-[30px] font-black tracking-[0.28em] text-white">SOLO</p>
    <p className="mt-2 text-[17px] font-bold uppercase tracking-[0.23em] text-white/40">Where discipline becomes dopamine</p>
  </footer>
);

const ShareCardBackground = ({ photo }) => (
  <div className="absolute inset-0 overflow-hidden bg-[#05070d]">
    {photo ? (
      <>
        <img src={photo} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/95" />
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-[#03050a] via-[#03050a]/80 to-transparent" />
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

const METRIC_CONFIG = {
  duration: { label: 'Duração', Icon: Clock3 },
  xp: { label: 'XP ganho', Icon: Zap, accent: 'text-fuchsia-300' },
  streak: { label: 'Sequência', Icon: Flame, accent: 'text-orange-400' },
  sets: { label: 'Séries', Icon: Dumbbell },
  density: { label: 'Densidade', Icon: Gauge },
};

const ShareCard = ({
  stats = {},
  bossEncounter = null,
  workoutTitle = 'Treino',
  streak = null,
  xp = null,
  cardRef,
  selfieUrl = null,
  totalXp = null,
  metricSelection,
  highlightSelection = 'auto',
  sessionDate = null,
  levelUp = false,
  newBadges = [],
}) => {
  const numericXp = parseMetricNumber(xp);
  const numericStreak = parseMetricNumber(streak);
  const numericSets = parseMetricNumber(stats.sets);
  const density = calcDensity(stats.volume, stats.duration);
  const progress = getShareCardLevelProgress(totalXp);
  const selection = createShareCardMetricSelection({
    selection: metricSelection,
    hasDuration: parseDurationSeconds(stats.duration) !== null,
    hasXp: numericXp !== null,
    hasStreak: numericStreak !== null && numericStreak > 0,
    hasSets: numericSets !== null && numericSets > 0,
    hasDensity: density !== null,
  });
  const values = {
    duration: formatShareDuration(stats.duration),
    xp: numericXp === null ? null : `+${Math.max(0, Math.round(numericXp))}`,
    streak: numericStreak === null ? null : `${Math.max(0, Math.round(numericStreak))} ${Math.round(numericStreak) === 1 ? 'dia' : 'dias'}`,
    sets: numericSets === null ? null : Math.max(0, Math.round(numericSets)),
    density: density === null ? null : `${density} kg/min`,
  };
  const metrics = getSelectedShareCardMetricKeys(selection)
    .map((key) => ({ key, ...METRIC_CONFIG[key], value: values[key] }))
    .filter((metric) => metric.value !== null);
  const highlight = resolveShareCardHighlight({
    selection: highlightSelection,
    levelUp,
    levelProgress: progress,
    newBadges,
    prs: parseMetricNumber(stats.prs) ?? 0,
    bossEncounter,
  });
  const displayDate = sessionDate
    ? formatLocalDate(sessionDate, { month: 'short' }).replace('.', '').toUpperCase()
    : null;

  return (
    <div aria-hidden="true" className="fixed left-[-9999px] top-0 pointer-events-none">
      <div ref={cardRef} style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} className="relative overflow-hidden bg-[#05070d] font-cyber">
        <ShareCardBackground photo={selfieUrl} />
        <div className="relative z-10 flex h-full flex-col px-[84px] py-[78px]">
          <ShareCardHeader sessionDate={displayDate} />
          <main className={`flex flex-1 flex-col justify-center gap-14 pb-12 ${selfieUrl ? 'pt-[360px]' : 'pt-16'}`}>
            <section>
              <p className="mb-6 text-[23px] font-black uppercase tracking-[0.25em] text-fuchsia-300">Operação concluída</p>
              <h1 className="max-w-[900px] text-[82px] font-black uppercase leading-[0.94] tracking-[-0.035em] text-white">{workoutTitle || 'Treino'}</h1>
            </section>
            <MainResult volume={formatShareVolume(stats.volume)} />
            {metrics.length > 0 && (
              <section className="flex gap-5 border-y border-white/10 py-8">
                {metrics.map(({ key, ...metric }) => <ShareCardMetric key={key} {...metric} />)}
              </section>
            )}
            <ShareCardProgress progress={progress} />
            <ShareCardHighlight highlight={highlight} />
          </main>
          <ShareCardFooter />
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
