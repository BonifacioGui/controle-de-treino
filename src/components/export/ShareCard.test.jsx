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
    expect(html).toContain('data-share-card-mode="data-first"');
    expect(html).toContain('Volume movimentado');
    expect(html).toContain('10.447');
    expect(html).toContain('justify-center gap-14');
    expect(html).toContain('pt-16');
  });

  it('transforma a foto em plano principal com somente um resumo compacto', () => {
    const html = renderToStaticMarkup(<ShareCard {...baseProps} selfieUrl="data:image/jpeg;base64,photo" />);
    expect(html).toContain('data-share-card-mode="photo-first"');
    expect(html).toContain('absolute inset-0 h-full w-full object-cover');
    expect(html).toContain('data-photo-summary="true"');
    expect(html).toContain('Resumo do treino');
    expect(html).toContain('bg-[#05070d]/70');
    expect(html).not.toContain('Volume movimentado');
    expect(html).not.toContain('text-[142px]');
    expect(html).not.toContain('XP para o próximo nível');
  });
});
