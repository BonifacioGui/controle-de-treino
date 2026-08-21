import { describe, expect, it } from 'vitest';
import { calculateStats } from './rpgSystem';

describe('XP', () => {
  it('ignora séries não confirmadas e nunca reduz o XP acumulado', () => {
    const completed = { dateKey: '2026-08-20', exercises: [{ name: 'Supino reto', sets: [
      { weight: '10', reps: '10', completed: true },
      { weight: '999', reps: '999', completed: false },
    ] }] };
    const first = calculateStats([completed]);
    const afterAnotherSession = calculateStats([completed, {
      dateKey: '2026-08-21',
      exercises: [{ name: 'Supino reto', sets: [{ weight: '5', reps: '5', completed: true }] }],
    }]);
    expect(first.xp).toBe(5);
    expect(afterAnotherSession.xp).toBeGreaterThanOrEqual(first.xp);
  });
});
