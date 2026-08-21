import { describe, expect, it } from 'vitest';
import { countLoadPrs, getMaxCompletedLoad } from './progressionUtils';

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
});
