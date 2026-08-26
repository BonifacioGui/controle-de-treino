import { describe, expect, it } from 'vitest';
import {
  adjustRestTimerEndTime,
  getRestSecondsRemaining,
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
});

