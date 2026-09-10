export const HAPTIC_TYPES = Object.freeze({
  setComplete: 'setComplete',
  restComplete: 'restComplete',
});

export const HAPTIC_PATTERNS = Object.freeze({
  [HAPTIC_TYPES.setComplete]: 50,
  [HAPTIC_TYPES.restComplete]: [180, 80, 180],
});

export const HAPTIC_DELIVERY = Object.freeze({
  skip: 'skip',
  now: 'now',
  whenVisible: 'whenVisible',
});

export const getHapticDelivery = ({ enabled = true, visibilityState = 'visible' } = {}) => {
  if (!enabled) return HAPTIC_DELIVERY.skip;
  return visibilityState === 'visible' ? HAPTIC_DELIVERY.now : HAPTIC_DELIVERY.whenVisible;
};

export const claimHapticAttempt = (attemptedIds, eventId) => {
  if (!eventId || attemptedIds.has(eventId)) return false;
  attemptedIds.add(eventId);
  return true;
};

export const triggerHaptic = (
  type,
  { enabled = true, navigatorObject = typeof navigator === 'undefined' ? null : navigator } = {},
) => {
  const pattern = HAPTIC_PATTERNS[type];
  const supported = Boolean(navigatorObject && typeof navigatorObject.vibrate === 'function');
  if (!enabled || !supported || pattern === undefined) return { supported, triggered: false };
  try {
    return { supported: true, triggered: navigatorObject.vibrate(pattern) !== false };
  } catch {
    return { supported: true, triggered: false };
  }
};

export const getHapticTestMessage = ({ supported, triggered }) => {
  if (!supported) {
    return 'Vibração não disponível neste navegador ou dispositivo. Teste em um celular Android com navegador compatível.';
  }
  if (!triggered) {
    return 'O navegador recusou a vibração. Toque novamente e confira as configurações de vibração do aparelho.';
  }
  return 'Comando de vibração enviado. Se não sentiu o pulso, confira a vibração do aparelho e os modos Silencioso ou Não Perturbe.';
};
