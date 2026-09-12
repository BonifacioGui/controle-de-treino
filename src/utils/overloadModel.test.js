import { describe, expect, it } from 'vitest';
import {
  classifyVolumeProgress,
  findPreviousComparableVolume,
  getComparableSessionVolume,
  isOverloadStatus,
  normalizeOverloadStatus,
  OVERLOAD_STATUS,
} from './overloadModel';

describe('classificação da progressão de volume', () => {
  it.each([
    [12_001, 12_000, OVERLOAD_STATUS.overload],
    [12_000, 12_000, OVERLOAD_STATUS.maintenance],
    [11_999, 12_000, OVERLOAD_STATUS.reduction],
    [0, 12_000, OVERLOAD_STATUS.reduction],
  ])('classifica %s kg atuais contra %s kg anteriores como %s', (currentVolume, previousVolume, expected) => {
    expect(classifyVolumeProgress({ currentVolume, previousVolume })).toBe(expected);
  });

  it.each([undefined, null, '', 0, '0', Number.NaN])(
    'mantém a primeira sessão ou referência inválida como NORMAL (%s)',
    (previousVolume) => {
      expect(classifyVolumeProgress({ currentVolume: 10_000, previousVolume }))
        .toBe(OVERLOAD_STATUS.baseline);
    },
  );

  it('aceita volumes persistidos como texto com vírgula', () => {
    expect(classifyVolumeProgress({ currentVolume: '100,5', previousVolume: '100' }))
      .toBe(OVERLOAD_STATUS.overload);
  });

  it('trata diferenças residuais de ponto flutuante como manutenção', () => {
    expect(classifyVolumeProgress({ currentVolume: 100.1 + 0.2, previousVolume: 100.3 }))
      .toBe(OVERLOAD_STATUS.maintenance);
  });

  it('encontra a sessão comparável mais recente e ignora entradas sem volume em kg', () => {
    expect(findPreviousComparableVolume([
      { totalVolume: 0, exercises: [] },
      { total_volume: '950,5' },
      { totalVolume: 800 },
    ])).toBe(950.5);
  });

  it('reconstrói o volume de uma sessão legada a partir das séries concluídas', () => {
    expect(getComparableSessionVolume({
      exercises: [{ sets: [
        { weight: 50, reps: 10, completed: true },
        { weight: 50, reps: 10, completed: false },
      ] }],
    })).toBe(500);
  });
});

describe('compatibilidade dos status do histórico', () => {
  it('normaliza grafias legadas sem acento', () => {
    expect(normalizeOverloadStatus('manutencao')).toBe(OVERLOAD_STATUS.maintenance);
    expect(normalizeOverloadStatus('reducao')).toBe(OVERLOAD_STATUS.reduction);
  });

  it('trata somente OVERLOAD como sobrecarga', () => {
    expect(isOverloadStatus('overload')).toBe(true);
    expect(isOverloadStatus(OVERLOAD_STATUS.maintenance)).toBe(false);
    expect(isOverloadStatus(OVERLOAD_STATUS.reduction)).toBe(false);
    expect(isOverloadStatus(undefined)).toBe(false);
  });
});
