import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ExercisePerformanceSummary from './ExercisePerformanceSummary';

describe('ExercisePerformanceSummary', () => {
  it('separa Referência e PR em blocos compreensíveis', () => {
    const html = renderToStaticMarkup(<ExercisePerformanceSummary performance={{
      lastSummary: '45 kg total × 10',
      lastBestIsPr: false,
      pr: { primary: '50 kg total', secondary: null },
    }} />);

    expect(html).toContain('Referência');
    expect(html).toContain('O que significa Referência?');
    expect(html).toContain('45 kg total × 10');
    expect(html).toContain('PR 50 kg total');
    expect(html).toContain('text-gold');
  });

  it('marca a referência como PR sem repetir o mesmo valor', () => {
    const html = renderToStaticMarkup(<ExercisePerformanceSummary performance={{
      lastSummary: '50 kg total × 8',
      lastBestIsPr: true,
      pr: { primary: '50 kg total', secondary: null },
    }} />);

    expect(html).toContain('50 kg total × 8');
    expect(html).toContain('aria-label="Esta referência também é o recorde histórico"');
    expect(html.match(/50 kg total/g)).toHaveLength(1);
  });

  it('usa um vazio discreto quando não há histórico', () => {
    const html = renderToStaticMarkup(<ExercisePerformanceSummary performance={{}} />);
    expect(html).toContain('Sem referência anterior');
    expect(html).not.toContain('Referência</span>');
  });
});
