const ensureTrailingSlash = (value) => value.endsWith('/') ? value : `${value}/`;

export const OFFICIAL_PUBLIC_APP_URL = 'https://bonifaciogui.github.io/controle-de-treino/';

const parseAbsoluteHttpUrl = (value) => {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
};

const normalizeAppBaseUrl = (value) => {
  const url = value instanceof URL ? new URL(value.toString()) : parseAbsoluteHttpUrl(value);
  if (!url) return null;
  url.search = '';
  url.hash = '';
  url.pathname = ensureTrailingSlash(url.pathname);
  return url.toString();
};

const isLocalHostname = (hostname) => ['localhost', '127.0.0.1', '::1'].includes(hostname);

export const getPublicAppUrl = ({
  configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL,
  baseUrl = import.meta.env.BASE_URL,
  origin = typeof window === 'undefined' ? '' : window.location.origin,
  isProduction = import.meta.env.PROD,
  productionFallbackUrl = OFFICIAL_PUBLIC_APP_URL,
} = {}) => {
  const configured = parseAbsoluteHttpUrl(configuredUrl);
  if (configured && !(isProduction && isLocalHostname(configured.hostname))) {
    return normalizeAppBaseUrl(configured);
  }

  const requestedProductionFallback = parseAbsoluteHttpUrl(productionFallbackUrl);
  const productionFallback = requestedProductionFallback && !isLocalHostname(requestedProductionFallback.hostname)
    ? requestedProductionFallback
    : parseAbsoluteHttpUrl(OFFICIAL_PUBLIC_APP_URL);
  const runtimeOrigin = parseAbsoluteHttpUrl(origin);
  if (isProduction && !runtimeOrigin) return normalizeAppBaseUrl(productionFallback);

  const resolvedOrigin = runtimeOrigin || parseAbsoluteHttpUrl('http://localhost:5173/');
  const derived = new URL(baseUrl || '/', resolvedOrigin);
  if (isProduction && isLocalHostname(derived.hostname)) return normalizeAppBaseUrl(productionFallback);
  return normalizeAppBaseUrl(derived);
};

export const getEmailConfirmationRedirectUrl = (options) => {
  const redirect = new URL(getPublicAppUrl(options));
  redirect.searchParams.set('auth', 'confirmed');
  return redirect.toString();
};
