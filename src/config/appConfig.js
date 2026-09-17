const ensureTrailingSlash = (value) => value.endsWith('/') ? value : `${value}/`;

export const getPublicAppUrl = ({
  configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL,
  baseUrl = import.meta.env.BASE_URL,
  origin = typeof window === 'undefined' ? 'http://localhost:5173' : window.location.origin,
} = {}) => {
  const configured = String(configuredUrl || '').trim();
  if (configured) return ensureTrailingSlash(new URL(configured).toString());
  return ensureTrailingSlash(new URL(baseUrl || '/', origin).toString());
};

export const getEmailConfirmationRedirectUrl = (options) => {
  const redirect = new URL(getPublicAppUrl(options));
  redirect.searchParams.set('auth', 'confirmed');
  return redirect.toString();
};
