import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BossSection from './BossSection';

describe('BossSection', () => {
  it('separa Tier, Forma e identifica o placar como dano em HP', () => {
    const html = renderToStaticMarkup(<BossSection encounter={{
      bossName: 'NEON REVENANT',
      bossTier: 2,
      bossAssetKey: 'revenant',
      bossAura: '#00f3ff',
      evolutionStage: 3,
      evolutionLabel: 'Forma III',
      maxHp: 5000,
      damage: 11333,
      baseDamage: 10447,
      criticalBonus: 886,
      criticalHits: 1,
      powerBonus: 0,
      powerHits: 0,
      defeated: true,
    }} />);

    expect(html).toContain('Tier 2');
    expect(html).toContain('Forma III');
    expect(html).toContain('Dano: 11.333 / 5.000 HP');
    expect(html).toContain('bônus +886');
  });

  it('usa Forma I como fallback para encontros antigos', () => {
    const html = renderToStaticMarkup(<BossSection encounter={{
      bossName: 'SCAVENGER UNIT',
      bossTier: 1,
      bossAssetKey: 'scavenger',
      maxHp: 5000,
      damage: 0,
      defeated: false,
    }} />);
    expect(html).toContain('Forma I');
  });
});
