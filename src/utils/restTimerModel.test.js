import { describe, expect, it } from 'vitest';
import {
  adjustRestTimerEndTime,
  createRestTimerState,
  finishRestTimerState,
  getRestSecondsRemaining,
  restoreRestTimerState,
  shouldStartRestTimer,
} from './restTimerModel';

describe('temporizador de descanso', () => {
  it('altera o endTime real e não faz o tempo removido reaparecer', () => {
    const now = 1_000_000;
    const originalEnd = now + 90_000;
    const adjusted = adjustRestTimerEndTime(originalEnd, -30, now);
    expect(adjusted).toBe(now + 60_000);
    expect(getRestSecondsRemaining(adjusted, now + 10_000)).toBe(50);
  });

  it('não inicia descanso depois da última pendência da sessão', () => {
    expect(shouldStartRestTimer({ setCompleted: true, completion: { incompleteSets: 0 } })).toBe(false);
    expect(shouldStartRestTimer({ setCompleted: true, completion: { incompleteSets: 2 } })).toBe(true);
    expect(shouldStartRestTimer({ setCompleted: false, completion: { incompleteSets: 2 } })).toBe(false);
  });

  it('produz a transição REST_FINISHED uma única vez', () => {
    const active = createRestTimerState(30, 1_000);
    expect(finishRestTimerState(active, 30_999).didFinish).toBe(false);
    const finished = finishRestTimerState(active, 31_000);
    expect(finished).toMatchObject({ didFinish: true, state: { active: false, status: 'finished', finishedAt: 31_000 } });
    expect(finishRestTimerState(finished.state, 32_000).didFinish).toBe(false);
  });

  it('preserva o fim agendado quando uma aba congelada processa o timer com atraso', () => {
    const active = createRestTimerState(30, 1_000);
    expect(finishRestTimerState(active, 100_000)).toMatchObject({
      didFinish: true,
      state: { finishedAt: 31_000 },
    });
  });

  it('não reabre nem refaz o alerta de um timer expirado após reload', () => {
    const active = createRestTimerState(30, 1_000);
    expect(restoreRestTimerState(active, 31_000)).toMatchObject({ active: false, status: 'idle' });
    expect(restoreRestTimerState(active, 30_000)).toMatchObject({ active: true, status: 'active', timerId: active.timerId });
  });
});
