import { describe, expect, it } from 'vitest';
import { normalizeDecimalInput, parseDecimalInput, parsePositiveInteger } from './numberUtils';

describe('entrada numérica', () => {
  it('aceita vírgula e ponto decimal', () => {
    expect(parseDecimalInput('12,5')).toBe(12.5);
    expect(parseDecimalInput('12.5')).toBe(12.5);
    expect(normalizeDecimalInput(' 12,5 ')).toBe('12.5');
  });

  it('não transforma silenciosamente conteúdo inválido em zero', () => {
    expect(parseDecimalInput('doze')).toBeNull();
    expect(parseDecimalInput('')).toBeNull();
    expect(parsePositiveInteger('3,5')).toBeNull();
  });
});
