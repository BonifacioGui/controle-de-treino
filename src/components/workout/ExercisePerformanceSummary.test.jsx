import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ExercisePerformanceSummary from './ExercisePerformanceSummary';

describe('ExercisePerformanceSummary', () => {
  it('separa Melhor da última e PR em grupos flexíveis', () => {
    const html = renderToStaticMarkup(<ExercisePerformanceSummary performance={{
      lastSummary: '45 kg total × 10',
      lastBestIsPr: false,
      pr: { primary: '50 kg total', secondary: null },
    }} />);

    expect(html).toContain('flex-wrap');
    expect(html).toContain('gap-x-3');
    expect(html).toContain('Melhor da última:');
    expect(html).toContain('45 kg total × 10');
    expect(html).toContain('PR: 50 kg total');
    expect(html).toContain('text-gold');
  });

  it('mantém o troféu separado quando a melhor da última também é o PR', () => {
    const html = renderToStaticMarkup(<ExercisePerformanceSummary performance={{
      lastSummary: '50 kg total × 8',
      lastBestIsPr: true,
      pr: { primary: '50 kg total', secondary: null },
    }} />);

    expect(html).toContain('50 kg total × 8');
    expect(html).toContain('aria-label="Recorde histórico"');
    expect(html).not.toContain('PR: 50 kg total');
  });
});
