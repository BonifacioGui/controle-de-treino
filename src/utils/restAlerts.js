export const REST_SOUND_TYPES = Object.freeze({
  double: 'double',
  chime: 'chime',
  single: 'single',
});

const SOUND_PATTERNS = Object.freeze({
  [REST_SOUND_TYPES.double]: [[0, 880, 0.16], [0.22, 1040, 0.2]],
  [REST_SOUND_TYPES.chime]: [[0, 660, 0.22], [0.18, 880, 0.26], [0.38, 1100, 0.3]],
  [REST_SOUND_TYPES.single]: [[0, 920, 0.32]],
});

let sharedAudioContext = null;

export const getRestAlertCapabilities = ({
  windowObject = typeof window === 'undefined' ? null : window,
  notificationObject = typeof Notification === 'undefined' ? null : Notification,
} = {}) => ({
  secureContext: windowObject?.isSecureContext !== false,
  soundSupported: Boolean(windowObject?.AudioContext || windowObject?.webkitAudioContext),
  notificationSupported: Boolean(notificationObject),
  notificationPermission: notificationObject?.permission || 'unsupported',
});

export const playRestCompletionSound = async ({
  enabled = true,
  volume = 0.65,
  type = REST_SOUND_TYPES.double,
  windowObject = typeof window === 'undefined' ? null : window,
} = {}) => {
  if (!enabled) return { played: false, reason: 'disabled' };
  const AudioContextCtor = windowObject?.AudioContext || windowObject?.webkitAudioContext;
  if (!AudioContextCtor) return { played: false, reason: 'unsupported' };

  try {
    sharedAudioContext ||= new AudioContextCtor();
    if (sharedAudioContext.state === 'suspended') await sharedAudioContext.resume();
    const safeVolume = Math.min(1, Math.max(0, Number(volume) || 0));
    const pattern = SOUND_PATTERNS[type] || SOUND_PATTERNS[REST_SOUND_TYPES.double];
    pattern.forEach(([offset, frequency, duration]) => {
      const oscillator = sharedAudioContext.createOscillator();
      const gain = sharedAudioContext.createGain();
      const start = sharedAudioContext.currentTime + offset;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, safeVolume * 0.16), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(sharedAudioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
    return { played: true, reason: 'played' };
  } catch {
    return { played: false, reason: 'blocked' };
  }
};

export const requestRestNotificationPermission = async (
  notificationObject = typeof Notification === 'undefined' ? null : Notification,
) => {
  if (!notificationObject || typeof notificationObject.requestPermission !== 'function') {
    return { enabled: false, permission: 'unsupported' };
  }
  if (notificationObject.permission === 'granted') return { enabled: true, permission: 'granted' };
  try {
    const permission = await notificationObject.requestPermission();
    return { enabled: permission === 'granted', permission };
  } catch {
    return { enabled: false, permission: 'error' };
  }
};

export const showRestSystemNotification = async ({
  enabled = true,
  timerId,
  documentObject = typeof document === 'undefined' ? null : document,
  navigatorObject = typeof navigator === 'undefined' ? null : navigator,
  notificationObject = typeof Notification === 'undefined' ? null : Notification,
} = {}) => {
  if (!enabled) return { shown: false, reason: 'disabled' };
  if (documentObject?.visibilityState !== 'hidden') return { shown: false, reason: 'visible' };
  if (!notificationObject) return { shown: false, reason: 'unsupported' };
  if (notificationObject.permission !== 'granted') return { shown: false, reason: 'permission' };

  const options = {
    body: 'O descanso terminou. Hora da próxima série.',
    icon: `${import.meta.env.BASE_URL}logo-solo192px.png`,
    badge: `${import.meta.env.BASE_URL}logo-solo192px.png`,
    tag: timerId ? `solo-rest-${timerId}` : 'solo-rest-complete',
    renotify: false,
  };

  try {
    const registration = await navigatorObject?.serviceWorker?.ready;
    if (registration?.showNotification) {
      await registration.showNotification('Descanso concluído', options);
      return { shown: true, reason: 'service-worker' };
    }
    new notificationObject('Descanso concluído', options);
    return { shown: true, reason: 'page' };
  } catch {
    return { shown: false, reason: 'error' };
  }
};
