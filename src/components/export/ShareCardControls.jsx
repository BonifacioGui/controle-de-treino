import React, { useId, useState } from 'react';
import {
  createShareCardMetricSelection,
  getAvailableShareCardHighlights,
  getSelectedShareCardMetricKeys,
  SHARE_CARD_MAX_METRICS,
  SHARE_CARD_PHOTO_MAX_METRICS,
  toggleShareCardMetric,
} from './ShareCardUtils';

const FIELD_OPTIONS = Object.freeze([
  { key: 'duration', label: 'Duração', requires: 'hasDuration' },
  { key: 'xp', label: 'XP', requires: 'hasXp' },
  { key: 'streak', label: 'Sequência', requires: 'hasStreak' },
  { key: 'sets', label: 'Séries', requires: 'hasSets' },
  { key: 'density', label: 'Densidade', requires: 'hasDensity' },
]);

const HIGHLIGHT_LABELS = Object.freeze({
  auto: 'Automático',
  level: 'Level up',
  badge: 'Conquista',
  pr: 'Recorde',
  boss: 'Boss',
  none: 'Nenhum',
});

const PHOTO_POSITION_OPTIONS = Object.freeze([
  { key: 'top', label: 'Superior' },
  { key: 'center', label: 'Centro' },
  { key: 'bottom', label: 'Inferior' },
]);

const ShareCardControls = ({
  metricSelection,
  onMetricChange,
  highlightSelection = 'auto',
  onHighlightChange,
  hasDuration = true,
  hasXp = true,
  hasStreak = true,
  hasSets = false,
  hasDensity = false,
  levelUp = false,
  levelProgress = null,
  newBadges = [],
  prs = 0,
  bossEncounter = null,
  embedded = false,
  photoMode = false,
  photoPosition = 'center',
  onPhotoPositionChange,
}) => {
  const descriptionId = useId();
  const limitId = useId();
  const [limitReached, setLimitReached] = useState(false);
  const availability = { hasDuration, hasXp, hasStreak, hasSets, hasDensity };
  const options = FIELD_OPTIONS.filter((option) => !option.requires || availability[option.requires]);
  const highlightOptions = getAvailableShareCardHighlights({ levelUp, levelProgress, newBadges, prs, bossEncounter });
  const maxMetrics = photoMode ? SHARE_CARD_PHOTO_MAX_METRICS : SHARE_CARD_MAX_METRICS;
  const normalizedSelection = createShareCardMetricSelection({
    selection: metricSelection,
    ...availability,
    maxMetrics,
  });
  const selectedCount = getSelectedShareCardMetricKeys(normalizedSelection, maxMetrics).length;

  const toggleMetric = (metric) => {
    const result = toggleShareCardMetric(normalizedSelection, metric, availability, maxMetrics);
    setLimitReached(result.limitReached);
    if (!result.limitReached) onMetricChange(result.selection);
  };

  return (
    <div className={embedded ? 'space-y-5' : 'space-y-5 rounded-xl border border-border bg-input/45 p-3'}>
      {photoMode && (
        <fieldset>
          <legend className="px-1 text-xs font-black uppercase tracking-[0.14em] text-main">Enquadramento</legend>
          <p className="mb-3 text-xs leading-relaxed text-muted">Ajuste verticalmente a foto na prévia e no arquivo final.</p>
          <div className="grid grid-cols-3 gap-2">
            {PHOTO_POSITION_OPTIONS.map((option) => (
              <label key={option.key} className="cursor-pointer">
                <input
                  type="radio"
                  name={`share-photo-position-${descriptionId}`}
                  value={option.key}
                  className="peer sr-only"
                  checked={photoPosition === option.key}
                  onChange={() => onPhotoPositionChange?.(option.key)}
                />
                <span className="flex min-h-10 items-center justify-center rounded-lg border border-border px-2 text-xs font-bold text-muted transition-colors peer-checked:border-primary/70 peer-checked:bg-primary/15 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset aria-describedby={`${descriptionId} ${limitId}`}>
        <legend className="px-1 text-xs font-black uppercase tracking-[0.14em] text-main">Métricas</legend>
        <div className="mb-3 flex items-start justify-between gap-3">
          <p id={descriptionId} className="text-xs leading-relaxed text-muted">
            {photoMode
              ? 'Escolha até 2 dados secundários. Com o volume, o sticker terá no máximo 3 números.'
              : 'Escolha até 3 dados secundários. O volume é sempre o resultado principal.'}
          </p>
          <span className="shrink-0 text-[11px] font-bold text-muted">{selectedCount}/{maxMetrics}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <label key={option.key} className="cursor-pointer">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={Boolean(normalizedSelection[option.key])}
                onChange={() => toggleMetric(option.key)}
              />
              <span className="flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-bold text-muted transition-colors peer-checked:border-primary/70 peer-checked:bg-primary/15 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <div id={limitId} role="status" aria-live="polite">
          {limitReached && <p className="mt-2 text-xs font-bold text-warning">Você pode escolher até {maxMetrics} métricas.</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend className="px-1 text-xs font-black uppercase tracking-[0.14em] text-main">Destaque</legend>
        <p className="mb-3 text-xs leading-relaxed text-muted">{photoMode ? 'Adicione um destaque discreto ao resumo da foto.' : 'Mostre no máximo um momento especial da sessão.'}</p>
        <div className="flex flex-wrap gap-2">
          {highlightOptions.map((key) => (
            <label key={key} className="cursor-pointer">
              <input
                type="radio"
                name={`share-highlight-${descriptionId}`}
                className="peer sr-only"
                checked={highlightSelection === key}
                onChange={() => onHighlightChange(key)}
              />
              <span className="flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-bold text-muted transition-colors peer-checked:border-accent/70 peer-checked:bg-accent/15 peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card">
                {HIGHLIGHT_LABELS[key]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
};

export default ShareCardControls;
