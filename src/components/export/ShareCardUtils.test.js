import { describe, expect, it } from 'vitest';
import {
  calcDensity,
  createShareCardFieldSelection,
  getShareCardGridClass,
  toggleShareCardField,
} from './ShareCardUtils';

describe('controles de dados do Share Card', () => {
  it('calcula densidade corretamente com duração textual ou em relógio', () => {
    expect(calcDensity('6.420 kg', '48 min')).toBe('133.8');
    expect(calcDensity('6.420 kg', '48:00')).toBe('133.8');
    expect(calcDensity('6.420 kg', '47:30')).toBe('135.2');
  });

  it('habilita por padrão todos os dados disponíveis', () => {
    expect(createShareCardFieldSelection({ hasPr: true, hasBoss: true })).toEqual({
      volume: true,
      duration: true,
      xp: true,
      streak: true,
      prs: true,
      boss: true,
    });
  });

  it('não exibe blocos vazios de PR ou Boss quando os dados não existem', () => {
    expect(createShareCardFieldSelection({ hasPr: false, hasBoss: false })).toEqual(
      expect.objectContaining({ prs: false, boss: false }),
    );
  });

  it('preserva escolhas de privacidade e alterna apenas campos conhecidos', () => {
    const selected = createShareCardFieldSelection({
      selection: { volume: false, xp: false },
      hasPr: true,
      hasBoss: true,
    });

    expect(selected.volume).toBe(false);
    expect(selected.xp).toBe(false);
    expect(toggleShareCardField(selected, 'duration', { hasPr: true, hasBoss: true }).duration).toBe(false);
    expect(toggleShareCardField(selected, 'unknown', { hasPr: true, hasBoss: true })).toBe(selected);
  });

  it('fornece grades estáveis inclusive quando todos os indicadores são ocultados', () => {
    expect(getShareCardGridClass(0)).toBe('grid-cols-1');
    expect(getShareCardGridClass(1)).toBe('grid-cols-1');
    expect(getShareCardGridClass(2)).toBe('grid-cols-2');
    expect(getShareCardGridClass(5)).toBe('grid-cols-3');
  });
});
