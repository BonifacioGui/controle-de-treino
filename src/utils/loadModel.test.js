import { describe, expect, it } from 'vitest';
import {
  calculateSetCanonicalVolume,
  formatEnteredLoad,
  getCanonicalLoad,
  LOAD_MODES,
} from './loadModel';

describe('modelo canônico de carga', () => {
  it('calcula peso total usando barra e carga por lado', () => {
    const exercise = { loadMode: LOAD_MODES.perSide, barWeight: 20 };
    const set = { weight: '20,0', reps: '10' };
    expect(getCanonicalLoad(set, exercise)).toBe(60);
    expect(calculateSetCanonicalVolume(set, exercise)).toBe(600);
    expect(formatEnteredLoad(set, exercise)).toBe('20 kg por lado + barra de 20 kg');
  });

  it('registra halter por unidade e calcula o par sem ambiguidade', () => {
    const exercise = { loadMode: LOAD_MODES.perHand };
    const set = { weight: '24', reps: '8' };
    expect(getCanonicalLoad(set, exercise)).toBe(48);
    expect(calculateSetCanonicalVolume(set, exercise)).toBe(384);
    expect(formatEnteredLoad(set, exercise)).toBe('24 kg por halter');
  });

  it('não inventa volume em kg para tempo, distância ou assistência', () => {
    expect(getCanonicalLoad({ weight: 50 }, { loadMode: LOAD_MODES.assisted })).toBeNull();
    expect(calculateSetCanonicalVolume({ weight: 50, reps: 10 }, { loadMode: LOAD_MODES.duration })).toBe(0);
  });
});

