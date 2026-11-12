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

const DataFirstBackground = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#05070d]">
    <div className="absolute -right-48 -top-36 h-[660px] w-[660px] rounded-full bg-cyan-500/10 blur-[120px]" />
    <div className="absolute -bottom-40 -left-44 h-[720px] w-[720px] rounded-full bg-fuchsia-600/10 blur-[135px]" />
    <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
    <div className="absolute inset-[26px] border border-white/10" />
  </div>
);

const PhotoMetric = ({ label, value, accent = 'text-white' }) => (
  <div className="min-w-0 flex-1 border-l border-white/15 pl-5 first:border-l-0 first:pl-0">
    <p className="truncate text-[17px] font-bold uppercase tracking-[0.12em] text-white/55">{label}</p>
    <p className={`mt-2 truncate text-[31px] font-black leading-none ${accent}`}>{value}</p>
  </div>
);

const PhotoFirstShareCard = ({
  photo,
  workoutTitle,
  displayDate,
  volume,
  metrics,
  highlight,
  progress,
}) => {
  const compactMetrics = metrics.slice(0, 3);
  return (
    <>
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_28%]" />
      <div className="absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

      <div className="relative z-10 flex h-full flex-col px-[64px] py-[62px]">
        <header className="flex items-start justify-between gap-8">
          <img src={logoSolo} alt="SOLO" className="h-[58px] w-auto max-w-[280px] object-contain object-left drop-shadow-[0_3px_14px_rgba(0,0,0,0.65)]" />
          <div className="rounded-full border border-white/25 bg-black/25 px-5 py-3 text-right shadow-lg backdrop-blur-md">
            <p className="text-[17px] font-black uppercase tracking-[0.16em] text-white">Treino concluído</p>
            {displayDate && <p className="mt-1 text-[15px] font-bold uppercase tracking-[0.1em] text-white/65">{displayDate}</p>}
          </div>
        </header>

        <section data-photo-summary="true" className="mt-auto rounded-[38px] border border-white/20 bg-[#05070d]/70 p-[42px] shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="font-cyber text-[18px] font-black uppercase tracking-[0.23em] text-cyan-300">Resumo do treino</p>
          <h1 className="mt-4 max-w-[850px] text-[58px] font-bold leading-[0.98] tracking-[-0.03em] text-white">{workoutTitle || 'Treino'}</h1>

          <div className="mt-8 flex gap-5 border-y border-white/12 py-6">
            <PhotoMetric label={volume ? 'Volume' : 'Resultado'} value={volume ? `${volume} KG` : 'Concluído'} accent="text-cyan-300" />
            {compactMetrics.map(({ key, label, value, accent }) => (
              <PhotoMetric key={key} label={label} value={value} accent={accent} />
            ))}
          </div>

          {(highlight || progress) && (
            <div className="mt-6 flex items-center justify-between gap-6">
              {highlight ? (
                <div className="min-w-0">
                  <p className="text-[15px] font-black uppercase tracking-[0.14em] text-yellow-300">{highlight.eyebrow}</p>
                  <p className="mt-1 truncate text-[24px] font-black uppercase text-white">{highlight.title}</p>
                </div>
              ) : <span />}
              {progress && <p className="shrink-0 rounded-full border border-fuchsia-300/30 px-4 py-2 text-[18px] font-black text-fuchsia-300">Nível {progress.level}</p>}
            </div>
          )}
        </section>

        <footer className="mt-5 flex items-center justify-between px-2 text-[14px] font-bold uppercase tracking-[0.16em] text-white/65">
          <span>SOLO</span>
          <span>Disciplina vira evolução</span>
        </footer>
      </div>
    </>
  );
};

const DataFirstShareCard = ({
  workoutTitle,
  displayDate,
  volume,
  metrics,
  highlight,
  progress,
}) => (
  <>
    <DataFirstBackground />
    <div className="relative z-10 flex h-full flex-col px-[84px] py-[78px]">
      <ShareCardHeader sessionDate={displayDate} />
      <main className="flex flex-1 flex-col justify-center gap-14 pb-12 pt-16">
        <section>
          <p className="mb-6 font-cyber text-[23px] font-black uppercase tracking-[0.25em] text-fuchsia-300">Operação concluída</p>
          <h1 className="max-w-[900px] text-[82px] font-bold leading-[0.94] tracking-[-0.035em] text-white">{workoutTitle || 'Treino'}</h1>
        </section>
        <MainResult volume={volume} />
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
  </>
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
  const volume = formatShareVolume(stats.volume);
  const photoMode = Boolean(selfieUrl);

  return (
    <div aria-hidden="true" className="fixed left-[-9999px] top-0 pointer-events-none">
      <div
        ref={cardRef}
        data-share-card-mode={photoMode ? 'photo-first' : 'data-first'}
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        className="relative overflow-hidden bg-[#05070d] font-sans"
      >
        {photoMode ? (
          <PhotoFirstShareCard photo={selfieUrl} workoutTitle={workoutTitle} displayDate={displayDate} volume={volume} metrics={metrics} highlight={highlight} progress={progress} />
        ) : (
          <DataFirstShareCard workoutTitle={workoutTitle} displayDate={displayDate} volume={volume} metrics={metrics} highlight={highlight} progress={progress} />
        )}
      </div>
    </div>
  );
};

export default ShareCard;
