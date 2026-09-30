import { describe, expect, it } from 'vitest';
import { calculateSessionXp } from './xpModel';

describe('XP oficial da sessão', () => {
  it('aplica sobrecarga e bônus uma única vez', () => {
    expect(calculateSessionXp({ totalVolume: 10_000, bonusXp: 40, overloadStatus: 'OVERLOAD' })).toBe(640);
  });

  it('prioriza o XP persistido sobre qualquer recálculo', () => {
    expect(calculateSessionXp({ earnedXp: 777, totalVolume: 1, overloadStatus: 'NORMAL' })).toBe(777);
  });

  it.each(['MANUTENÇÃO', 'REDUÇÃO', 'NORMAL'])('não aplica multiplicador de overload para %s', (overloadStatus) => {
    expect(calculateSessionXp({ totalVolume: 10_000, bonusXp: 40, overloadStatus })).toBe(540);
  });

  it('calcula o volume pelas séries concluídas quando o total não existe', () => {
    expect(calculateSessionXp({ exercises: [{ sets: [
      { weight: 100, reps: 10, completed: true },
      { weight: 999, reps: 10, completed: false },
    ] }] })).toBe(50);
  });
});
