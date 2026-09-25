import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CharacterSheet from './CharacterSheet';
import ProgressionDetails from './ProgressionDetails';
import { getRpgLevelProgress, RPG_ATTRIBUTE_INFO } from '../../utils/rpgProgressionModel';

const rpgData = {
  STR: { xp: 8_538 },
  DEX: { xp: 1_200 },
  VIT: { xp: 450 },
  CHA: { xp: 90 },
};

describe('painel compacto de atributos', () => {
  it('prioriza nomes públicos, nível, barra e XP restante sem descrições abertas', () => {
    const html = renderToStaticMarkup(<CharacterSheet rpgData={rpgData} history={[]} stats={{ streak: 3 }} />);

    expect(html).toContain('Força');
    expect(html).toContain('Técnica');
    expect(html).toContain('Resistência');
    expect(html).toContain('Estética');
    expect(html).toContain('Faltam');
    expect(html).toContain('Foco 6');
    expect(html).toContain('Disciplina 1');
    expect(html).not.toContain(RPG_ATTRIBUTE_INFO.STR.summary);
    expect(html).not.toMatch(/>STR<|>DEX<|>VIT<|>CHA</);
  });

  it('mantém explicações e progresso completos no conteúdo reutilizado pelos dialogs', () => {
    const html = renderToStaticMarkup(
      <ProgressionDetails
        info={RPG_ATTRIBUTE_INFO.STR}
        levelProgress={getRpgLevelProgress(8_538)}
        valueLabel="Nível 10"
        progressValueLabel="8.538 XP"
      />,
    );

    expect(html).toContain(RPG_ATTRIBUTE_INFO.STR.summary);
    expect(html).toContain(RPG_ATTRIBUTE_INFO.STR.howToEarn);
    expect(html).toContain(RPG_ATTRIBUTE_INFO.STR.calculation);
    expect(html).toContain('8.538 XP');
    expect(html).toContain('Faltam');
  });
});
