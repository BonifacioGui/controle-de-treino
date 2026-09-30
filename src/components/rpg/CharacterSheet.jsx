import React, { useState } from 'react';
import { Activity, ChevronRight, Crosshair, Heart, ListChecks, Shield, Star, Zap } from 'lucide-react';
import {
  calculateDisciplineLevel,
  calculateFocusLevel,
  getRpgLevelProgress,
  RPG_ATTRIBUTE_INFO,
} from '../../utils/rpgProgressionModel';
import ProgressionDetailsSheet from './ProgressionDetailsSheet';

const STAT_CONFIG = {
  STR: { icon: Shield, color: 'text-red-500', bgIcon: 'bg-red-500/10', bar: 'bg-red-600 dark:bg-red-500', glow: 'dark:shadow-[0_0_10px_rgba(239,68,68,0.5)]' },
  DEX: { icon: Zap, color: 'text-blue-500', bgIcon: 'bg-blue-500/10', bar: 'bg-blue-600 dark:bg-blue-500', glow: 'dark:shadow-[0_0_10px_rgba(59,130,246,0.5)]' },
  VIT: { icon: Heart, color: 'text-green-500', bgIcon: 'bg-green-500/10', bar: 'bg-green-600 dark:bg-green-500', glow: 'dark:shadow-[0_0_10px_rgba(34,197,94,0.5)]' },
  CHA: { icon: Star, color: 'text-purple-500', bgIcon: 'bg-purple-500/10', bar: 'bg-purple-600 dark:bg-purple-500', glow: 'dark:shadow-[0_0_10px_rgba(168,85,247,0.5)]' },
  FOCUS: { icon: Crosshair, color: 'text-cyan-500', bgIcon: 'bg-cyan-500/10' },
  DISCIPLINE: { icon: ListChecks, color: 'text-amber-500', bgIcon: 'bg-amber-500/10' },
};

const PRIMARY_ATTRIBUTE_KEYS = ['STR', 'DEX', 'VIT', 'CHA'];

const AttributeCard = ({ statKey, data, onOpen }) => {
  const config = STAT_CONFIG[statKey] || { icon: Activity, color: 'text-zinc-500', bgIcon: 'bg-zinc-500/10', bar: 'bg-zinc-500', glow: '' };
  const info = RPG_ATTRIBUTE_INFO[statKey];
  const Icon = config.icon;
  const levelProgress = getRpgLevelProgress(data.xp);

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${info.name}, nível ${levelProgress.level}. Ver detalhes.`}
      onClick={onOpen}
      className="group w-full rounded-xl border border-border bg-input/40 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/5 dark:bg-zinc-900/45 dark:hover:border-white/20 sm:p-4"
    >
      <span className="flex min-w-0 items-center gap-2.5">
          <span className={`shrink-0 rounded-lg p-1.5 sm:p-2 ${config.bgIcon} ${config.color}`}>
            <Icon aria-hidden="true" size={17} />
          </span>
          <span className="min-w-0">
            <span className="block whitespace-nowrap text-[9px] font-black uppercase tracking-[0.04em] text-main sm:text-xs sm:tracking-[0.11em]">{info.name}</span>
            <span className="mt-0.5 block text-[11px] font-black text-main sm:text-xs">Nível {levelProgress.level}</span>
          </span>
      </span>

      <span className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-black/10 shadow-inner dark:bg-black/60">
        <span
          className={`block h-full transition-all duration-700 ${config.bar} ${config.glow}`}
          style={{ width: `${levelProgress.progress}%` }}
        />
      </span>
      <span className="mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-muted">
        <span>Faltam {levelProgress.xpRemaining.toLocaleString('pt-BR')} XP</span>
        <ChevronRight aria-hidden="true" size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
};

const CharacterSheet = ({ rpgData, history = [], stats }) => {
  const [activeKey, setActiveKey] = useState(null);
  const safeData = rpgData || {
    STR: { xp: 0, level: 1, label: 'FORÇA' },
    DEX: { xp: 0, level: 1, label: 'TÉCNICA' },
    VIT: { xp: 0, level: 1, label: 'RESISTÊNCIA' },
    CHA: { xp: 0, level: 1, label: 'ESTÉTICA' },
  };
  const focusValue = calculateFocusLevel(stats?.streak);
  const disciplineValue = calculateDisciplineLevel(history);
  const displayData = {
    ...safeData,
    FOCUS: { valueLabel: `${focusValue} ${focusValue === 1 ? 'ponto' : 'pontos'}` },
    DISCIPLINE: { valueLabel: `${disciplineValue} ${disciplineValue === 1 ? 'ponto' : 'pontos'}` },
  };

  const isConsistencyOpen = activeKey === 'CONSISTENCY';
  const activeData = activeKey && !isConsistencyOpen ? displayData[activeKey] : null;
  const activeLevelProgress = activeData && Number.isFinite(Number(activeData.xp))
    ? getRpgLevelProgress(activeData.xp)
    : null;
  const sheetItems = isConsistencyOpen
    ? ['FOCUS', 'DISCIPLINE'].map((key) => ({
        key,
        info: RPG_ATTRIBUTE_INFO[key],
        valueLabel: displayData[key].valueLabel,
      }))
    : activeKey && activeData
      ? [{
          key: activeKey,
          info: RPG_ATTRIBUTE_INFO[activeKey],
          levelProgress: activeLevelProgress,
          valueLabel: `Nível ${activeLevelProgress?.level || 1}`,
          progressValueLabel: `${Math.floor(Math.max(0, Number(activeData.xp) || 0)).toLocaleString('pt-BR')} XP`,
        }]
      : [];

  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xl backdrop-blur-sm sm:p-5 dark:border-zinc-800/50 dark:bg-zinc-950/80">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 hidden h-40 w-40 rounded-full bg-purple-500/10 blur-[60px] dark:block" />

      <div className="relative z-10 mb-4">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-muted sm:text-sm dark:text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
          </span>
          Atributos do operador
        </h3>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2" aria-label="Atributos principais">
        {PRIMARY_ATTRIBUTE_KEYS.map((key) => (
          <AttributeCard
            key={key}
            statKey={key}
            data={displayData[key] || { xp: 0 }}
            onOpen={() => setActiveKey(key)}
          />
        ))}
      </div>

      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setActiveKey('CONSISTENCY')}
        className="relative z-10 mt-4 flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-input/25 px-3 py-2 text-left transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-muted">Consistência</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-black text-main sm:text-sm">
            <span className="inline-flex items-center gap-1"><Crosshair aria-hidden="true" size={13} className={STAT_CONFIG.FOCUS.color} /> Foco {focusValue}</span>
            <span aria-hidden="true" className="text-muted">•</span>
            <span className="inline-flex items-center gap-1"><ListChecks aria-hidden="true" size={13} className={STAT_CONFIG.DISCIPLINE.color} /> Disciplina {disciplineValue}</span>
          </span>
        </span>
        <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-muted" />
      </button>

      <ProgressionDetailsSheet
        isOpen={Boolean(activeKey)}
        onClose={() => setActiveKey(null)}
        title={isConsistencyOpen ? 'Consistência' : RPG_ATTRIBUTE_INFO[activeKey]?.name || 'Detalhes'}
        items={sheetItems}
      />
    </section>
  );
};

export default CharacterSheet;
