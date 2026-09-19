import { describe, expect, it } from 'vitest';
import {
  calcDensity,
  createShareCardMetricSelection,
  formatShareDuration,
  getAvailableShareCardHighlights,
  getSelectedShareCardMetricKeys,
  getShareCardLevelProgress,
  parseDurationSeconds,
  resolveShareCardHighlight,
  toggleShareCardMetric,
} from './ShareCardUtils';
import { getRpgLevelProgress } from '../../utils/rpgProgressionModel';

describe('personalização do Share Card oficial', () => {
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

  it('seleciona duração, XP e sequência por padrão sem tratar volume como opção', () => {
    expect(createShareCardMetricSelection({ hasSets: true, hasDensity: true })).toEqual({
      duration: true,
      xp: true,
      streak: true,
      sets: false,
      density: false,
    });
  });

  it('omite métricas indisponíveis sem inventar valores', () => {
    expect(createShareCardMetricSelection({ hasXp: false, hasStreak: false, hasSets: true })).toEqual({
      duration: true,
      xp: false,
      streak: false,
      sets: false,
      density: false,
    });
  });

  it('limita a seleção a três métricas e informa a tentativa da quarta', () => {
    const selected = createShareCardMetricSelection({ hasSets: true, hasDensity: true });
    const blocked = toggleShareCardMetric(selected, 'sets', { hasSets: true, hasDensity: true });
    expect(blocked.limitReached).toBe(true);
    expect(getSelectedShareCardMetricKeys(blocked.selection)).toHaveLength(3);

    const withoutStreak = toggleShareCardMetric(selected, 'streak', { hasSets: true, hasDensity: true }).selection;
    const withSets = toggleShareCardMetric(withoutStreak, 'sets', { hasSets: true, hasDensity: true });
    expect(withSets.limitReached).toBe(false);
    expect(withSets.selection).toMatchObject({ streak: false, sets: true });
  });

  it('usa exatamente a progressão oficial do RPG', () => {
    expect(getShareCardLevelProgress(13_894)).toEqual(getRpgLevelProgress(13_894));
    expect(getShareCardLevelProgress(null)).toBeNull();
  });

  it('prioriza um único destaque automático e respeita a escolha manual', () => {
    const context = {
      levelUp: true,
      levelProgress: getRpgLevelProgress(13_894),
      newBadges: [{ title: 'Máquina quente' }],
      prs: 2,
      bossEncounter: { defeated: true, bossName: 'Titã' },
    };
    expect(resolveShareCardHighlight(context)).toMatchObject({ type: 'level', title: 'Nível 12' });
    expect(resolveShareCardHighlight({ ...context, selection: 'pr' })).toMatchObject({ type: 'pr' });
    expect(resolveShareCardHighlight({ ...context, selection: 'none' })).toBeNull();
    expect(getAvailableShareCardHighlights(context)).toEqual(['auto', 'level', 'badge', 'pr', 'boss', 'none']);
  });
});
