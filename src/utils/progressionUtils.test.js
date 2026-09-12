import { describe, expect, it } from 'vitest';
import { normalizeHistory } from './historyModel';
import { countLoadPrs, getMaxCompletedLoad, getMaxCompletedLoadRecord } from './progressionUtils';

describe('recordes de carga', () => {
  it('considera somente cargas de séries confirmadas', () => {
    const exercises = [{ name: 'Supino', sets: [
      { weight: '60', completed: true },
      { weight: '200', completed: false },
    ] }];
    expect(getMaxCompletedLoad(exercises, 'Supino')).toBe(60);
  });

  it('conta PR apenas quando supera uma marca anterior real', () => {
    const history = [{ workoutName: 'A', exercises: [{ name: 'Supino', sets: [{ weight: '60', completed: true }] }] }];
    const current = [{ name: 'Supino', sets: [{ weight: '62,5', completed: true }] }];
    expect(countLoadPrs(current, history, 'A')).toBe(1);
    expect(countLoadPrs([{ name: 'Supino', sets: [{ weight: '100', completed: false }] }], history, 'A')).toBe(0);
  });

  it('usa a identidade canônica para aliases do mesmo exercício', () => {
    const history = [{ workoutName: 'A', exercises: [{ name: 'Supino Reto (Barra)', sets: [{ weight: '60', completed: true }] }] }];
    expect(getMaxCompletedLoad(history[0].exercises, 'Supino Reto')).toBe(60);
    expect(countLoadPrs([{ name: 'Supino Reto', sets: [{ weight: '62,5', completed: true }] }], history)).toBe(1);
  });

  it('mantém PR de um histórico legado válido anterior ao loadMode', () => {
    const [legacy] = normalizeHistory([{ workout_date: '2026-08-20', workout_name: 'A', exercises: [
      { name: 'Leg Press', sets: [{ weight: '160', reps: '8' }] },
    ] }]);
    expect(getMaxCompletedLoad(legacy.exercises, 'Leg press')).toBe(160);
  });

  it('preserva a carga digitada junto do total canônico no recorde', () => {
    const record = getMaxCompletedLoadRecord([{ name: 'Rosca alternada', loadMode: 'per_hand', sets: [
      { weight: '24', reps: '8', completed: true, loadMode: 'per_hand' },
    ] }], 'Rosca Alternada', 'per_hand');
    expect(record).toMatchObject({ canonicalLoad: 48, mode: 'per_hand', set: { weight: '24' } });
  });
});
