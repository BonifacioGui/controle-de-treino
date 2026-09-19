import React, { useId } from 'react';
import { toggleShareCardField } from './ShareCardUtils';

const FIELD_OPTIONS = Object.freeze([
  { key: 'volume', label: 'Volume', requires: 'hasVolume' },
  { key: 'duration', label: 'Duração', requires: 'hasDuration' },
  { key: 'xp', label: 'XP', requires: 'hasXp' },
  { key: 'streak', label: 'Sequência', requires: 'hasStreak' },
  { key: 'prs', label: 'Recordes', requires: 'hasPr' },
  { key: 'boss', label: 'Boss', requires: 'hasBoss' },
]);

const ShareCardControls = ({
  value,
  onChange,
  hasVolume = true,
  hasDuration = true,
  hasXp = true,
  hasStreak = true,
  hasPr = false,
  hasBoss = false,
  embedded = false,
}) => {
  const descriptionId = useId();
  const availability = { hasVolume, hasDuration, hasXp, hasStreak, hasPr, hasBoss };
  const options = FIELD_OPTIONS.filter((option) => !option.requires || availability[option.requires]);

  return (
    <fieldset aria-describedby={descriptionId} className={embedded ? 'p-0' : 'rounded-xl border border-border bg-input/45 p-3'}>
      <legend className="px-1 text-xs font-black uppercase tracking-[0.14em] text-main">{embedded ? 'Mostrar no card' : 'Dados do card'}</legend>
      <p id={descriptionId} className={`text-xs leading-relaxed text-muted ${embedded ? 'mb-2' : 'mb-3'}`}>{embedded ? 'Desmarque o que não quiser compartilhar.' : 'Escolha o que aparece na prévia e na imagem final.'}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.key} className="cursor-pointer">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={Boolean(value?.[option.key])}
              onChange={() => onChange(toggleShareCardField(value, option.key, availability))}
            />
            <span className="flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-bold text-muted transition-colors peer-checked:border-primary/70 peer-checked:bg-primary/15 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default ShareCardControls;
