import { describe, expect, it } from 'vitest';
import {
  calcDensity,
  createShareCardFieldSelection,
  formatShareDuration,
  getShareCardLevelProgress,
  getShareCardGridClass,
  normalizeShareCardVariant,
  parseDurationSeconds,
  resolveShareCardHighlight,
  toggleShareCardField,
} from './ShareCardUtils';
import { getRpgLevelProgress } from '../../utils/rpgProgressionModel';

describe('controles de dados do Share Card', () => {
  it('calcula densidade corretamente com duração textual ou em relógio', () => {
    expect(calcDensity('6.420 kg', '48 min')).toBe('133.8');
    expect(calcDensity('6.420 kg', '48:00')).toBe('133.8');
    expect(calcDensity('6.420 kg', '47:30')).toBe('135.2');
    expect(calcDensity('6.420 kg', '1:12:00')).toBe('89.2');
    expect(calcDensity('6.420 kg', 'sem duração')).toBeNull();
  });

  it('interpreta e apresenta durações sem misturar relógio e unidade', () => {
    expect(parseDurationSeconds('45:32')).toBe(2732);
    expect(parseDurationSeconds('1:12:00')).toBe(4320);
    expect(formatShareDuration(2732)).toBe('45:32');
    expect(formatShareDuration(2700)).toBe('45 MIN');
    expect(formatShareDuration(4320)).toBe('1H 12MIN');
  });

  it('habilita por padrão todos os dados disponíveis', () => {
    expect(createShareCardFieldSelection({ hasPr: true, hasBoss: true })).toEqual({
      volume: true,
      duration: true,
      xp: true,
      streak: true,
      prs: true,
      boss: true,
    });
  });

  it('não exibe blocos vazios de PR ou Boss quando os dados não existem', () => {
    expect(createShareCardFieldSelection({ hasPr: false, hasBoss: false })).toEqual(
      expect.objectContaining({ prs: false, boss: false }),
    );
  });

  it('preserva escolhas de privacidade e alterna apenas campos conhecidos', () => {
    const selected = createShareCardFieldSelection({
      selection: { volume: false, xp: false },
      hasPr: true,
      hasBoss: true,
    });

    expect(selected.volume).toBe(false);
    expect(selected.xp).toBe(false);
    expect(toggleShareCardField(selected, 'duration', { hasPr: true, hasBoss: true }).duration).toBe(false);
    expect(toggleShareCardField(selected, 'unknown', { hasPr: true, hasBoss: true })).toBe(selected);
  });

  it('omite campos indisponíveis em vez de criar fallbacks', () => {
    expect(createShareCardFieldSelection({ hasXp: false, hasStreak: false })).toEqual(
      expect.objectContaining({ xp: false, streak: false }),
    );
  });

  it('usa exatamente a progressão oficial do RPG', () => {
    expect(getShareCardLevelProgress(13_894)).toEqual(getRpgLevelProgress(13_894));
    expect(getShareCardLevelProgress(null)).toBeNull();
  });

  it('normaliza nomes antigos e prioriza um único destaque especial', () => {
    expect(normalizeShareCardVariant('rpg')).toBe('solo');
    expect(normalizeShareCardVariant('data')).toBe('performance');
    expect(resolveShareCardHighlight({
      levelUp: true,
      levelProgress: getRpgLevelProgress(13_894),
      newBadges: [{ title: 'Máquina quente' }],
      prs: 2,
      bossEncounter: { defeated: true, bossName: 'Titã' },
      fields: {},
    })).toMatchObject({ type: 'level', title: 'Nível 12' });
  });

  it('fornece grades estáveis inclusive quando todos os indicadores são ocultados', () => {
    expect(getShareCardGridClass(0)).toBe('grid-cols-1');
    expect(getShareCardGridClass(1)).toBe('grid-cols-1');
    expect(getShareCardGridClass(2)).toBe('grid-cols-2');
    expect(getShareCardGridClass(5)).toBe('grid-cols-3');
  });
});
