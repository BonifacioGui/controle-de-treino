export const AUTH_SESSION_TIMEOUT_MS = 10_000;

export const withTimeout = (promise, timeoutMs = AUTH_SESSION_TIMEOUT_MS) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('AUTH_SESSION_TIMEOUT')), timeoutMs);
  Promise.resolve(promise).then(
    (value) => {
      clearTimeout(timeout);
      resolve(value);
    },
    (error) => {
      clearTimeout(timeout);
      reject(error);
    },
  );
});

export const getAuthCallbackNotice = (urlValue) => {
  const url = new URL(urlValue, 'http://localhost');
  const authState = url.searchParams.get('auth');
  const errorDescription = url.searchParams.get('error_description')
    || new URLSearchParams(url.hash.replace(/^#/, '')).get('error_description');

  if (errorDescription) return { type: 'error', message: errorDescription };
  if (authState === 'confirmed') {
    return { type: 'success', message: 'E-mail confirmado com sucesso. Sua conta SOLO está ativa.' };
  }
  return null;
};

export const getCleanAuthCallbackUrl = (urlValue) => {
  const url = new URL(urlValue, 'http://localhost');
  ['auth', 'error', 'error_code', 'error_description'].forEach((key) => url.searchParams.delete(key));
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  [
    'access_token',
    'expires_at',
    'expires_in',
    'provider_token',
    'refresh_token',
    'token_type',
    'type',
    'error',
    'error_code',
    'error_description',
  ].forEach((key) => hashParams.delete(key));
  url.hash = hashParams.toString() ? `#${hashParams.toString()}` : '';
  return `${url.pathname}${url.search}${url.hash}`;
};
