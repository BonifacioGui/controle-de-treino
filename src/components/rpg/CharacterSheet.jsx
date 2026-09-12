import React, { useId, useState } from 'react';
import { Activity, CircleHelp, Heart, Shield, Star, Zap } from 'lucide-react';
import {
  getRpgLevelProgress,
  RPG_ATTRIBUTE_INFO,
} from '../../utils/rpgProgressionModel';
import ProgressionDetails from './ProgressionDetails';

const STAT_CONFIG = {
  STR: { icon: Shield, color: 'text-red-500', bgIcon: 'bg-red-500/10', bar: 'bg-red-600 dark:bg-red-500', glow: 'dark:shadow-[0_0_10px_rgba(239,68,68,0.5)]' },
  DEX: { icon: Zap, color: 'text-blue-500', bgIcon: 'bg-blue-500/10', bar: 'bg-blue-600 dark:bg-blue-500', glow: 'dark:shadow-[0_0_10px_rgba(59,130,246,0.5)]' },
  VIT: { icon: Heart, color: 'text-green-500', bgIcon: 'bg-green-500/10', bar: 'bg-green-600 dark:bg-green-500', glow: 'dark:shadow-[0_0_10px_rgba(34,197,94,0.5)]' },
  CHA: { icon: Star, color: 'text-purple-500', bgIcon: 'bg-purple-500/10', bar: 'bg-purple-600 dark:bg-purple-500', glow: 'dark:shadow-[0_0_10px_rgba(168,85,247,0.5)]' },
};

const StatCard = ({ statKey, data, active, detailsId, onPreview, onPreviewEnd, onToggle }) => {
  const config = STAT_CONFIG[statKey] || { icon: Activity, color: 'text-zinc-500', bgIcon: 'bg-zinc-500/10', bar: 'bg-zinc-500', glow: '' };
  const info = RPG_ATTRIBUTE_INFO[statKey];
  const Icon = config.icon;
  const levelProgress = getRpgLevelProgress(data.xp);

  return (
    <button
      type="button"
      aria-expanded={active}
      aria-controls={detailsId}
      aria-label={`${info.name}, nível ${levelProgress.level}. Ver como evoluir.`}
      onClick={onToggle}
      onFocus={onPreview}
      onBlur={onPreviewEnd}
      onPointerEnter={(event) => event.pointerType === 'mouse' && onPreview()}
      onPointerLeave={(event) => event.pointerType === 'mouse' && onPreviewEnd()}
      className={`group w-full rounded-xl border bg-input/50 p-3 text-left shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4 dark:bg-zinc-900/50 ${active ? 'border-primary/60 bg-primary/5' : 'border-border hover:-translate-y-0.5 hover:border-primary/30 dark:border-white/5 dark:hover:border-white/20'}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className={`rounded-lg p-1.5 transition-colors group-hover:bg-opacity-20 sm:p-2 ${config.bgIcon} ${config.color}`}>
            <Icon aria-hidden="true" size={16} className="sm:h-5 sm:w-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="mb-0.5 text-[11px] font-black uppercase leading-none tracking-widest text-main sm:text-xs dark:text-zinc-300">
              {info.short}
            </span>
            <span className="truncate text-[10px] font-bold uppercase leading-none text-muted sm:text-xs">
              {info.name}
            </span>
          </span>
        </div>

        <span className="flex items-center gap-1.5 text-right">
          <CircleHelp aria-hidden="true" size={14} className={active ? 'text-primary' : 'text-muted'} />
          <span className="text-xl font-black leading-none text-main drop-shadow-sm sm:text-2xl dark:text-white dark:drop-shadow-md">
            {levelProgress.level}
          </span>
        </span>
      </div>

      <span className="block space-y-1.5">
        <span className="flex items-end justify-between gap-2 text-[10px] font-bold uppercase text-muted sm:text-xs">
          <span>Progresso</span>
          <span className="tabular-nums">{Math.floor(Math.max(0, Number(data.xp) || 0)).toLocaleString('pt-BR')} XP</span>
        </span>
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-black/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] sm:h-2 dark:bg-black/60 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
          <span
            className={`block h-full transition-all duration-1000 ease-out ${config.bar} ${config.glow}`}
            style={{ width: `${levelProgress.progress}%` }}
          />
        </span>
      </span>
    </button>
  );
};

const CharacterSheet = ({ rpgData }) => {
  const detailsId = useId();
  const [pinnedKey, setPinnedKey] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const activeKey = previewKey || pinnedKey;
  const safeData = rpgData || {
    STR: { xp: 0, level: 1, label: 'FORÇA' },
    DEX: { xp: 0, level: 1, label: 'TÉCNICA' },
    VIT: { xp: 0, level: 1, label: 'RESISTÊNCIA' },
    CHA: { xp: 0, level: 1, label: 'ESTÉTICA' },
  };
  const attributeKeys = ['STR', 'DEX', 'VIT', 'CHA'];

  const togglePinned = (key) => {
    const closing = pinnedKey === key;
    setPinnedKey(closing ? null : key);
    if (closing) setPreviewKey(null);
  };

  const activeData = activeKey ? (safeData[activeKey] || { xp: 0 }) : null;
  const activeLevelProgress = activeData ? getRpgLevelProgress(activeData.xp) : null;

  return (
    <section
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        setPinnedKey(null);
        setPreviewKey(null);
      }}
      className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xl backdrop-blur-sm sm:p-5 dark:border-zinc-800/50 dark:bg-zinc-950/80"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 hidden h-40 w-40 rounded-full bg-purple-500/10 blur-[60px] dark:block" />

      <div className="relative z-10 mb-4 sm:mb-5">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-muted sm:text-sm dark:text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
          </span>
          Atributos de combate
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted">Passe o mouse, use Tab ou toque em um atributo para ver o cálculo e como ganhar XP.</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4">
        {attributeKeys.map((key) => (
          <StatCard
            key={key}
            statKey={key}
            data={safeData[key] || { xp: 0, level: 1, label: key }}
            active={activeKey === key}
            detailsId={detailsId}
            onPreview={() => setPreviewKey(key)}
            onPreviewEnd={() => setPreviewKey((current) => current === key ? null : current)}
            onToggle={() => togglePinned(key)}
          />
        ))}
      </div>

      {activeKey && (
        <div className="relative z-10 mt-4" aria-live="polite">
          <ProgressionDetails
            id={detailsId}
            info={RPG_ATTRIBUTE_INFO[activeKey]}
            levelProgress={activeLevelProgress}
            valueLabel={`${Math.floor(Math.max(0, Number(activeData.xp) || 0)).toLocaleString('pt-BR')} XP`}
          />
        </div>
      )}
    </section>
  );
};

export default CharacterSheet;
