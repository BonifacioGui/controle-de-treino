import { describe, expect, it } from 'vitest';
import {
  calculateBmi,
  calculateWaistHipRatio,
  formatBiometricValue,
} from './biometricsModel';

describe('métricas corporais informativas', () => {
  it('calcula IMC numericamente sem classificar o resultado', () => {
    expect(calculateBmi('75', '176')).toBeCloseTo(24.21, 2);
    expect(formatBiometricValue(calculateBmi('75', '176'), 1)).toBe('24,2');
  });

  it('calcula RCQ numericamente e aceita vírgula decimal', () => {
    expect(calculateWaistHipRatio('87', '100')).toBeCloseTo(0.87, 2);
    expect(formatBiometricValue(calculateWaistHipRatio('87', '100'), 2)).toBe('0,87');
  });

  it('não produz indicadores a partir de medidas ausentes ou inválidas', () => {
    expect(calculateBmi('', 176)).toBeNull();
    expect(calculateBmi(75, 0)).toBeNull();
    expect(calculateWaistHipRatio(87, 'inválido')).toBeNull();
    expect(formatBiometricValue(null, 1)).toBe('--');
  });
});
