import { describe, expect, it, vi } from 'vitest';
import {
  claimHapticAttempt,
  getHapticCapability,
  getHapticCapabilityMessage,
  getHapticDelivery,
  getHapticTestMessage,
  HAPTIC_DELIVERY,
  HAPTIC_RETRY_WINDOW_MS,
  HAPTIC_TYPES,
  isHapticRetryFresh,
  triggerHaptic,
} from './haptics';

const visibleDocument = { visibilityState: 'visible' };

describe('feedback háptico', () => {
  it('envia padrões perceptíveis diferentes para série e descanso', () => {
    const vibrate = vi.fn(() => true);
    const navigatorObject = { vibrate, userActivation: { hasBeenActive: true } };
    triggerHaptic(HAPTIC_TYPES.setComplete, { navigatorObject, documentObject: visibleDocument });
    triggerHaptic(HAPTIC_TYPES.restComplete, { navigatorObject, documentObject: visibleDocument });
    expect(vibrate.mock.calls).toEqual([[100], [[200, 90, 200]]]);
  });

  it('não vibra quando desabilitado, sem suporte ou com tipo desconhecido', () => {
    const vibrate = vi.fn(() => true);
    expect(triggerHaptic(HAPTIC_TYPES.setComplete, { enabled: false, navigatorObject: { vibrate } })).toMatchObject({ reason: 'disabled', triggered: false });
    expect(triggerHaptic(HAPTIC_TYPES.setComplete, { navigatorObject: {} })).toMatchObject({ reason: 'unsupported', supported: false, triggered: false });
    expect(triggerHaptic('unknown', { navigatorObject: { vibrate } })).toMatchObject({ reason: 'unknown-type', triggered: false });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('aguarda página visível e ativação antes de consumir a tentativa', () => {
    const vibrate = vi.fn(() => true);
    const baseNavigator = { vibrate, userActivation: { hasBeenActive: true } };
    expect(triggerHaptic(HAPTIC_TYPES.restComplete, {
      navigatorObject: baseNavigator,
      documentObject: { visibilityState: 'hidden' },
    })).toMatchObject({ reason: 'hidden', retryable: true });
    expect(triggerHaptic(HAPTIC_TYPES.restComplete, {
      navigatorObject: { ...baseNavigator, userActivation: { hasBeenActive: false } },
      documentObject: visibleDocument,
    })).toMatchObject({ reason: 'activation-required', retryable: true });
    expect(vibrate).not.toHaveBeenCalled();

    expect(triggerHaptic(HAPTIC_TYPES.restComplete, {
      navigatorObject: baseNavigator,
      documentObject: visibleDocument,
    })).toMatchObject({ reason: 'accepted', triggered: true, retryable: false });
    expect(vibrate).toHaveBeenCalledOnce();
  });

  it('trata recusa e exceção sem propagar erro', () => {
    expect(triggerHaptic(HAPTIC_TYPES.setComplete, {
      navigatorObject: { vibrate: () => false, userActivation: { hasBeenActive: true } },
      documentObject: visibleDocument,
    })).toMatchObject({ reason: 'rejected', triggered: false, retryable: false });
    expect(() => triggerHaptic(HAPTIC_TYPES.setComplete, {
      navigatorObject: { vibrate: () => { throw new Error('indisponível'); }, userActivation: { hasBeenActive: true } },
      documentObject: visibleDocument,
    })).not.toThrow();
  });

  it('detecta iPhone, iPad em modo desktop, Android e computador', () => {
    expect(getHapticCapability({ userAgent: 'Mozilla/5.0 (iPhone)' })).toMatchObject({ platform: 'ios', supported: false });
    expect(getHapticCapability({ userAgent: 'Mozilla/5.0', platform: 'MacIntel', maxTouchPoints: 5 })).toMatchObject({ platform: 'ios' });
    expect(getHapticCapability({ userAgent: 'Mozilla/5.0 (Linux; Android 15)', vibrate: vi.fn() })).toMatchObject({ platform: 'android', supported: true });
    expect(getHapticCapability({ userAgent: 'Mozilla/5.0', platform: 'Android', vibrate: vi.fn() })).toMatchObject({ platform: 'android', supported: true });
    expect(getHapticCapability({ userAgent: 'Mozilla/5.0 (Windows NT 10.0)', vibrate: vi.fn() })).toMatchObject({ platform: 'desktop', supported: true });
  });

  it('explica limitações sem alegar que a vibração física foi confirmada', () => {
    expect(getHapticCapabilityMessage({ platform: 'ios', supported: false })).toContain('não liberam vibração');
    expect(getHapticCapabilityMessage({ platform: 'desktop', supported: true })).toContain('não confirma');
    expect(getHapticTestMessage({ platform: 'android', supported: true, triggered: true, reason: 'accepted' })).toContain('não consegue confirmar');
  });

  it('decide entrega por preferência, visibilidade e ativação, nessa ordem', () => {
    expect(getHapticDelivery({ enabled: false, visibilityState: 'hidden', hasBeenActive: false })).toBe(HAPTIC_DELIVERY.skip);
    expect(getHapticDelivery({ enabled: true, visibilityState: 'hidden', hasBeenActive: false })).toBe(HAPTIC_DELIVERY.whenVisible);
    expect(getHapticDelivery({ enabled: true, visibilityState: 'visible', hasBeenActive: false })).toBe(HAPTIC_DELIVERY.whenActivated);
    expect(getHapticDelivery({ enabled: true, visibilityState: 'visible', hasBeenActive: true })).toBe(HAPTIC_DELIVERY.now);
  });

  it('deduplica tentativas pelo identificador do timer', () => {
    const attempted = new Set();
    expect(claimHapticAttempt(attempted, 'timer-1')).toBe(true);
    expect(claimHapticAttempt(attempted, 'timer-1')).toBe(false);
    expect(claimHapticAttempt(attempted, null)).toBe(false);
  });

  it('mantém o retry apenas na janela curta do descanso concluído', () => {
    const pending = { timerId: 'timer-1', finishedAt: 1_000 };
    expect(isHapticRetryFresh(pending, 1_000)).toBe(true);
    expect(isHapticRetryFresh(pending, 1_000 + HAPTIC_RETRY_WINDOW_MS)).toBe(true);
    expect(isHapticRetryFresh(pending, 1_001 + HAPTIC_RETRY_WINDOW_MS)).toBe(false);
    expect(isHapticRetryFresh(null, 1_000)).toBe(false);
    expect(isHapticRetryFresh({ timerId: 'timer-2' }, 1_000)).toBe(false);
  });
});
