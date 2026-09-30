import { describe, expect, it } from 'vitest';
import {
  CHUNK_RECOVERY_WINDOW_MS,
  getChunkFailureMessage,
  getChunkRecoveryDecision,
  isChunkLoadError,
  parseChunkRecoveryAttempt,
} from './chunkRecovery';

describe('recuperação de chunks após deploy', () => {
  it('reconhece falhas de import dinâmico e preload de CSS', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/history.js'))).toBe(true);
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/index.css'))).toBe(true);
    expect(isChunkLoadError(new Error('Falha ao salvar treino'))).toBe(false);
    expect(getChunkFailureMessage({ message: 'mensagem' })).toBe('mensagem');
  });

  it('permite somente uma recarga dentro da janela de recuperação', () => {
    const first = getChunkRecoveryDecision({
      failedResource: '/assets/history-antigo.js',
      now: 1_000,
    });
    const repeated = getChunkRecoveryDecision({
      previousAttempt: first.nextAttempt,
      failedResource: '/assets/outro-chunk-antigo.js',
      now: 2_000,
    });

    expect(first).toEqual({
      shouldReload: true,
      nextAttempt: { attemptedAt: 1_000, failedResource: '/assets/history-antigo.js' },
    });
    expect(repeated.shouldReload).toBe(false);
  });

  it('libera uma nova tentativa após a janela e tolera storage corrompido', () => {
    expect(parseChunkRecoveryAttempt('{inválido')).toBeNull();

    const decision = getChunkRecoveryDecision({
      previousAttempt: JSON.stringify({ attemptedAt: 1_000, failedResource: '/assets/antigo.js' }),
      failedResource: '/assets/novo.js',
      now: 1_000 + CHUNK_RECOVERY_WINDOW_MS,
    });

    expect(decision).toEqual({
      shouldReload: true,
      nextAttempt: {
        attemptedAt: 1_000 + CHUNK_RECOVERY_WINDOW_MS,
        failedResource: '/assets/novo.js',
      },
    });
  });

  it('não cria loop quando o relógio do dispositivo volta no tempo', () => {
    const decision = getChunkRecoveryDecision({
      previousAttempt: { attemptedAt: 10_000, failedResource: '/assets/antigo.js' },
      now: 5_000,
    });

    expect(decision.shouldReload).toBe(false);
    expect(decision.nextAttempt.attemptedAt).toBe(10_000);
  });
});
