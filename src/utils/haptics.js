export const HAPTIC_TYPES = Object.freeze({
  setComplete: 'setComplete',
  restComplete: 'restComplete',
});

export const HAPTIC_PATTERNS = Object.freeze({
  [HAPTIC_TYPES.setComplete]: 100,
  [HAPTIC_TYPES.restComplete]: [200, 90, 200],
});

export const HAPTIC_RETRY_WINDOW_MS = 30_000;

export const HAPTIC_DELIVERY = Object.freeze({
  skip: 'skip',
  now: 'now',
  whenVisible: 'whenVisible',
  whenActivated: 'whenActivated',
});

export const HAPTIC_PLATFORMS = Object.freeze({
  android: 'android',
  ios: 'ios',
  mobile: 'mobile',
  desktop: 'desktop',
  unknown: 'unknown',
});

const detectHapticPlatform = (navigatorObject) => {
  if (!navigatorObject) return HAPTIC_PLATFORMS.unknown;
  const userAgent = String(navigatorObject.userAgent || '');
  const platform = String(navigatorObject.userAgentData?.platform || navigatorObject.platform || '');
  const maxTouchPoints = Number(navigatorObject.maxTouchPoints) || 0;

  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Mac/i.test(platform) && maxTouchPoints > 1)) {
    return HAPTIC_PLATFORMS.ios;
  }
  if (/Android/i.test(`${userAgent} ${platform}`)) return HAPTIC_PLATFORMS.android;
  if (navigatorObject.userAgentData?.mobile === true || /Mobi/i.test(userAgent)) return HAPTIC_PLATFORMS.mobile;
  return HAPTIC_PLATFORMS.desktop;
};

export const getHapticCapability = (
  navigatorObject = typeof navigator === 'undefined' ? null : navigator,
) => ({
  platform: detectHapticPlatform(navigatorObject),
  supported: Boolean(navigatorObject && typeof navigatorObject.vibrate === 'function'),
  hasBeenActive: navigatorObject?.userActivation?.hasBeenActive ?? null,
});

export const getHapticDelivery = ({
  enabled = true,
  visibilityState = 'visible',
  hasBeenActive = true,
} = {}) => {
  if (!enabled) return HAPTIC_DELIVERY.skip;
  if (visibilityState !== 'visible') return HAPTIC_DELIVERY.whenVisible;
  if (hasBeenActive === false) return HAPTIC_DELIVERY.whenActivated;
  return HAPTIC_DELIVERY.now;
};

export const claimHapticAttempt = (attemptedIds, eventId) => {
  if (!eventId || attemptedIds.has(eventId)) return false;
  attemptedIds.add(eventId);
  return true;
};

export const isHapticRetryFresh = (
  pending,
  now = Date.now(),
  retryWindowMs = HAPTIC_RETRY_WINDOW_MS,
) => {
  const finishedAt = Number(pending?.finishedAt);
  const elapsed = Number(now) - finishedAt;
  return Boolean(
    pending?.timerId
    && Number.isFinite(finishedAt)
    && Number.isFinite(elapsed)
    && elapsed >= 0
    && elapsed <= Math.max(0, Number(retryWindowMs) || 0)
  );
};

const createHapticResult = (capability, updates) => ({
  ...capability,
  triggered: false,
  retryable: false,
  ...updates,
});

export const triggerHaptic = (
  type,
  {
    enabled = true,
    navigatorObject = typeof navigator === 'undefined' ? null : navigator,
    documentObject = typeof document === 'undefined' ? null : document,
  } = {},
) => {
  const capability = getHapticCapability(navigatorObject);
  const pattern = HAPTIC_PATTERNS[type];

  if (!enabled) return createHapticResult(capability, { reason: 'disabled' });
  if (pattern === undefined) return createHapticResult(capability, { reason: 'unknown-type' });
  if (!capability.supported) return createHapticResult(capability, { reason: 'unsupported' });
  if (documentObject?.visibilityState && documentObject.visibilityState !== 'visible') {
    return createHapticResult(capability, { reason: 'hidden', retryable: true });
  }
  if (capability.hasBeenActive === false) {
    return createHapticResult(capability, { reason: 'activation-required', retryable: true });
  }

  try {
    const accepted = navigatorObject.vibrate(pattern) === true;
    return createHapticResult(capability, {
      triggered: accepted,
      reason: accepted ? 'accepted' : 'rejected',
    });
  } catch {
    return createHapticResult(capability, { reason: 'error' });
  }
};

export const getHapticCapabilityMessage = ({ platform, supported }) => {
  if (platform === HAPTIC_PLATFORMS.ios) {
    return 'iPhone e iPad não liberam vibração para sites ou apps instalados da Web. O aviso visual do descanso continua disponível.';
  }
  if (platform === HAPTIC_PLATFORMS.android && supported) {
    return 'Compatível em princípio: requer um toque prévio, o app visível e a vibração ativada no aparelho.';
  }
  if (platform === HAPTIC_PLATFORMS.android) {
    return 'Este navegador no Android não oferece vibração. Abra o app no Chrome, Edge ou Samsung Internet.';
  }
  if (platform === HAPTIC_PLATFORMS.desktop) {
    return 'Computadores normalmente não têm motor de vibração. Mesmo quando a API aparece, ela não confirma que existe hardware háptico.';
  }
  if (!supported) return 'Vibração não disponível neste navegador ou dispositivo.';
  return 'A vibração depende do navegador, do hardware e das configurações do aparelho.';
};

export const getHapticTestMessage = (result) => {
  if (!result?.supported || result.platform === HAPTIC_PLATFORMS.ios) {
    return getHapticCapabilityMessage(result || {});
  }
  if (result.reason === 'hidden') return 'Mantenha o app visível e teste novamente.';
  if (result.reason === 'activation-required') return 'Toque novamente para liberar o teste de vibração.';
  if (result.reason === 'rejected') return 'O navegador recusou o pedido. Confira a vibração do aparelho e tente novamente.';
  if (result.reason === 'error') return 'O navegador encontrou um erro ao pedir a vibração.';
  if (result.triggered) {
    return 'Pedido aceito pelo navegador. A Web não consegue confirmar a vibração física; se não sentiu, confira o aparelho e os modos Silencioso ou Não Perturbe.';
  }
  return getHapticCapabilityMessage(result);
};
