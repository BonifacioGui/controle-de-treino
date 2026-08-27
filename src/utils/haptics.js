export const HAPTIC_TYPES = Object.freeze({
  setComplete: 'setComplete',
  restComplete: 'restComplete',
});

export const HAPTIC_PATTERNS = Object.freeze({
  [HAPTIC_TYPES.setComplete]: 50,
  [HAPTIC_TYPES.restComplete]: [180, 80, 180],
});

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
