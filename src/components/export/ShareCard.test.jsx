import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ShareCard from './ShareCard';

const baseProps = {
  stats: { volume: 10447, duration: 3600, sets: 18, prs: 1 },
  workoutTitle: 'Treino C',
  metricSelection: ['duration', 'sets'],
};

describe('ShareCard', () => {
  it('mantém o volume movimentado como resultado principal', () => {
    const html = renderToStaticMarkup(<ShareCard {...baseProps} />);
    expect(html).toContain('Volume movimentado');
    expect(html).toContain('10.447');
    expect(html).toContain('justify-center gap-14 pt-16');
  });

  it('reserva a metade superior para a foto e concentra dados abaixo', () => {
    const html = renderToStaticMarkup(<ShareCard {...baseProps} selfieUrl="data:image/jpeg;base64,photo" />);
    expect(html).toContain('h-[55%]');
    expect(html).toContain('object-[center_30%]');
    expect(html).toContain('top-[48%]');
    expect(html).toContain('justify-end gap-10 pt-[700px]');
    expect(html).not.toContain('absolute inset-0 bg-gradient-to-b from-black/40');
  });
});
