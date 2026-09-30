import { describe, expect, it } from 'vitest';
import {
  getSemanticHallOfFame,
  getSemanticLoadSeries,
  getTrackableExerciseNames,
} from './statsPerformanceModel';

const completed = (weight, reps, loadMode) => ({ weight, reps, loadMode, completed: true });
const history = [
  {
    dateKey: '2026-08-20',
    exercises: [
      { name: 'Supino Reto (Halter)', loadMode: 'per_hand', sets: [completed(25, 8, 'per_hand')] },
      { name: 'Prancha', loadMode: 'duration', sets: [{ duration: 60, completed: true }] },
      { name: 'Barra fixa assistida', loadMode: 'assisted', sets: [completed(20, 8, 'assisted')] },
    ],
  },
  {
    dateKey: '2026-08-10',
    exercises: [
      { name: 'supino reto halteres', loadMode: 'per_hand', sets: [completed(22, 10, 'per_hand')] },
      { name: 'Supino reto', loadMode: 'total', sets: [completed(80, 6, 'total')] },
    ],
  },
];
const plan = { A: { exercises: [{ name: 'Supino Reto (Halter)', loadMode: 'per_hand' }] } };

describe('estatísticas semânticas de carga', () => {
  it('lista somente exercícios com carga comparável', () => {
    expect(getTrackableExerciseNames(history, plan)).toEqual(['Supino Reto', 'Supino Reto Halteres']);
  });

  it('preserva unidade informada e total canônico no hall de recordes', () => {
    expect(getSemanticHallOfFame(history, plan)).toContainEqual(expect.objectContaining({
      name: 'Supino Reto Halteres',
      canonicalLoad: 50,
      primary: '25 kg por halter',
      secondary: 'Total canônico: 50 kg',
    }));
  });

  it('une aliases, mas não mistura modos de carga na série temporal', () => {
    expect(getSemanticLoadSeries(history, 'Supino Reto Halteres', plan))
      .toEqual([
        expect.objectContaining({ dateKey: '2026-08-20', canonicalLoad: 50 }),
        expect.objectContaining({ dateKey: '2026-08-10', canonicalLoad: 44 }),
      ]);
  });
});
