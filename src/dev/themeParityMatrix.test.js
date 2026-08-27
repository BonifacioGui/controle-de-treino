import { describe, expect, it } from 'vitest';
import {
  THEME_PARITY_EXPERIENCES,
  THEME_PARITY_MATRIX,
  THEME_PARITY_THEMES,
  THEME_PARITY_VIEWPORTS,
  UI_PREVIEW_SCREENS,
  buildThemeParityCases,
} from './themeParityMatrix';

const REQUIRED_FEATURES = ['Boss', 'ExerciseCard', 'RestTimer', 'PR', 'Level Up', 'charts', 'modais', 'states', 'inputs'];

describe('contrato de paridade visual entre temas', () => {
  it('mantém todos os componentes críticos na matriz', () => {
    expect(THEME_PARITY_MATRIX.map(({ feature }) => feature)).toEqual(REQUIRED_FEATURES);
  });

  it('gera um cenário DARK e LIGHT válido para cada fixture da matriz', () => {
    const cases = buildThemeParityCases();

    THEME_PARITY_MATRIX.forEach(({ feature, previews }) => {
      previews.forEach((preview) => {
        expect(UI_PREVIEW_SCREENS).toContain(preview);
        expect(cases.filter((item) => item.feature === feature && item.preview === preview).map(({ theme }) => theme)).toEqual(THEME_PARITY_THEMES);
      });
    });
  });

  it('preserva temas, intensidades e larguras obrigatórias de validação', () => {
    expect(THEME_PARITY_THEMES).toEqual(['dark', 'light']);
    expect(THEME_PARITY_EXPERIENCES).toEqual(['immersive', 'balanced', 'discreet']);
    expect(THEME_PARITY_VIEWPORTS).toEqual([320, 390, 768, 1280]);
  });
});
