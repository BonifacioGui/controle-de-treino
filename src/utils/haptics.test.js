import { describe, expect, it, vi } from 'vitest';
import {
  claimHapticAttempt,
  getHapticDelivery,
  getHapticTestMessage,
  HAPTIC_DELIVERY,
  HAPTIC_TYPES,
  triggerHaptic,
} from './haptics';

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

  it('não confunde comando aceito com confirmação física da vibração', () => {
    expect(getHapticTestMessage({ supported: false, triggered: false })).toContain('não disponível');
    expect(getHapticTestMessage({ supported: true, triggered: false })).toContain('recusou');
    expect(getHapticTestMessage({ supported: true, triggered: true })).toContain('Se não sentiu');
  });

  it('adia o alerta enquanto a página está oculta e ignora quando a preferência está desligada', () => {
    expect(getHapticDelivery({ enabled: true, visibilityState: 'hidden' })).toBe(HAPTIC_DELIVERY.whenVisible);
    expect(getHapticDelivery({ enabled: true, visibilityState: 'visible' })).toBe(HAPTIC_DELIVERY.now);
    expect(getHapticDelivery({ enabled: false, visibilityState: 'visible' })).toBe(HAPTIC_DELIVERY.skip);
    expect(getHapticDelivery({ enabled: false, visibilityState: 'hidden' })).toBe(HAPTIC_DELIVERY.skip);
  });

  it('permite apenas uma tentativa por término de descanso', () => {
    const attemptedIds = new Set();
    expect(claimHapticAttempt(attemptedIds, 'rest-1')).toBe(true);
    expect(claimHapticAttempt(attemptedIds, 'rest-1')).toBe(false);
    expect(claimHapticAttempt(attemptedIds, 'rest-2')).toBe(true);
  });
});
