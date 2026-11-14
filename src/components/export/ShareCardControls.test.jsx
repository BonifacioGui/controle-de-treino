import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ShareCardControls from './ShareCardControls';

const selection = { duration: true, xp: true, streak: true };

describe('ShareCardControls', () => {
  it('apresenta enquadramento e limite de duas métricas no modo foto', () => {
    const html = renderToStaticMarkup(
      <ShareCardControls
        metricSelection={selection}
        onMetricChange={() => {}}
        onHighlightChange={() => {}}
        photoMode
        photoPosition="bottom"
      />,
    );

    expect(html).toContain('Enquadramento');
    expect(html).toContain('Superior');
    expect(html).toContain('Centro');
    expect(html).toContain('Inferior');
    expect(html).toContain('2/2');
    expect(html).toContain('até 2 dados secundários');
    expect(html).toContain('value="bottom"');
  });

  it('preserva o limite de três métricas no modo data-first', () => {
    const html = renderToStaticMarkup(
      <ShareCardControls
        metricSelection={selection}
        onMetricChange={() => {}}
        onHighlightChange={() => {}}
      />,
    );

    expect(html).toContain('3/3');
    expect(html).toContain('até 3 dados secundários');
    expect(html).not.toContain('Enquadramento');
  });
});
