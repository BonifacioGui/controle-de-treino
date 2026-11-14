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
    const html = renderToStaticMarkup(
      <ShareCard
        {...baseProps}
        xp={312}
        streak={4}
        totalXp={1200}
        metricSelection={{ duration: true, xp: true, streak: true, sets: true }}
      />,
    );
    expect(html).toContain('data-share-card-mode="data-first"');
    expect(html).toContain('Volume movimentado');
    expect(html).toContain('10.447');
    expect(html.match(/data-share-metric="true"/g)).toHaveLength(3);
    expect(html).toContain('XP para o próximo nível');
    expect(html).toContain('Novo recorde');
    expect(html).toContain('justify-center gap-14');
    expect(html).toContain('pt-16');
  });

  it('limita o sticker da foto a três informações numéricas no total', () => {
    const html = renderToStaticMarkup(
      <ShareCard
        {...baseProps}
        selfieUrl="data:image/jpeg;base64,photo"
        xp={312}
        streak={4}
        metricSelection={{ duration: true, xp: true, streak: true, sets: true }}
      />,
    );
    expect(html).toContain('data-share-card-mode="photo-first"');
    expect(html).toContain('absolute inset-0 h-full w-full object-cover');
    expect(html).toContain('data-photo-summary="true"');
    expect(html.match(/data-photo-stat="true"/g)).toHaveLength(3);
    expect(html).toContain('Resumo do treino');
    expect(html).toContain('max-h-[430px]');
    expect(html).not.toContain('Volume movimentado');
    expect(html).not.toContain('text-[142px]');
    expect(html).not.toContain('XP para o próximo nível');
  });

  it('aplica o enquadramento escolhido à mesma imagem do card', () => {
    const top = renderToStaticMarkup(<ShareCard {...baseProps} selfieUrl="photo" photoPosition="top" />);
    const bottom = renderToStaticMarkup(<ShareCard {...baseProps} selfieUrl="photo" photoPosition="bottom" />);

    expect(top).toContain('data-photo-position="top"');
    expect(top).toContain('object-position:center 20%');
    expect(bottom).toContain('data-photo-position="bottom"');
    expect(bottom).toContain('object-position:center 75%');
    expect(top).not.toBe(bottom);
  });

  it('prioriza o highlight e omite o nível no photo-first', () => {
    const html = renderToStaticMarkup(
      <ShareCard {...baseProps} selfieUrl="photo" totalXp={1200} />,
    );

    expect(html).toContain('Novo recorde');
    expect(html).not.toContain('Nível ');
  });

  it('mostra o nível discretamente quando o photo-first não possui highlight', () => {
    const html = renderToStaticMarkup(
      <ShareCard
        {...baseProps}
        stats={{ ...baseProps.stats, prs: 0 }}
        selfieUrl="photo"
        totalXp={1200}
      />,
    );

    expect(html).not.toContain('Novo recorde');
    expect(html).toContain('Nível ');
  });

  it('retorna ao modo data-first quando a foto é removida', () => {
    const withPhoto = renderToStaticMarkup(<ShareCard {...baseProps} selfieUrl="photo" />);
    const withoutPhoto = renderToStaticMarkup(<ShareCard {...baseProps} selfieUrl={null} />);

    expect(withPhoto).toContain('data-share-card-mode="photo-first"');
    expect(withoutPhoto).toContain('data-share-card-mode="data-first"');
    expect(withoutPhoto).not.toContain('data-photo-summary="true"');
  });
});
