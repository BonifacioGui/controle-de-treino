import { describe, expect, it, vi } from 'vitest';
import { HAPTIC_TYPES, triggerHaptic } from './haptics';

describe('feedback háptico centralizado', () => {
  it('diferencia confirmação de série e fim de descanso', () => {
    const vibrate = vi.fn(() => true);
    const navigatorObject = { vibrate };
    triggerHaptic(HAPTIC_TYPES.setComplete, { navigatorObject });
    triggerHaptic(HAPTIC_TYPES.restComplete, { navigatorObject });
    expect(vibrate.mock.calls).toEqual([[50], [[180, 80, 180]]]);
  });

  it('não vibra quando desabilitado ou sem suporte', () => {
    const vibrate = vi.fn(() => true);
    expect(triggerHaptic(HAPTIC_TYPES.setComplete, { enabled: false, navigatorObject: { vibrate } })).toMatchObject({ triggered: false });
    expect(triggerHaptic(HAPTIC_TYPES.setComplete, { navigatorObject: {} })).toEqual({ supported: false, triggered: false });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('nunca propaga falha da API para o salvamento da série', () => {
    expect(() => triggerHaptic(HAPTIC_TYPES.setComplete, {
      navigatorObject: { vibrate: () => { throw new Error('indisponível'); } },
    })).not.toThrow();
  });
});
