export const AUTH_SESSION_TIMEOUT_MS = 10_000;

const normalizeAuthError = (error) => ({
  code: String(error?.code || '').toLowerCase(),
  message: String(error?.message || '').toLowerCase(),
  status: Number(error?.status) || 0,
});

export const isEmailNotConfirmedError = (error) => {
  const { code, message } = normalizeAuthError(error);
  return code === 'email_not_confirmed' || /email.*not.*confirmed|confirm.*email/.test(message);
};

export const isAuthRateLimitError = (error) => {
  const { code, message, status } = normalizeAuthError(error);
  return status === 429 || /rate|limit|too many|seconds/.test(`${code} ${message}`);
};

export const isAuthNetworkError = (error) => {
  const { message } = normalizeAuthError(error);
  return /failed to fetch|network|fetch failed|load failed/.test(message);
};

export const getLoginErrorMessage = (error) => {
  const { code, message } = normalizeAuthError(error);
  if (isEmailNotConfirmedError(error)) return 'Confirme seu e-mail antes de entrar.';
  if (isAuthRateLimitError(error)) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (isAuthNetworkError(error)) return 'Não foi possível conectar ao serviço de autenticação.';
  if (code === 'invalid_credentials' || /invalid login credentials/.test(message)) return 'E-mail ou senha incorretos.';
  return 'Não foi possível entrar agora. Tente novamente em instantes.';
};

export const getSignUpErrorMessage = (error) => {
  if (isAuthRateLimitError(error)) return 'Muitas solicitações. Aguarde um pouco e tente novamente.';
  if (isAuthNetworkError(error)) return 'Não foi possível conectar ao serviço de autenticação.';
  return 'Não foi possível solicitar o cadastro agora. Confira os dados e tente novamente.';
};

export const getResendErrorMessage = (error) => {
  if (isAuthRateLimitError(error)) return 'Aguarde um pouco antes de solicitar outro e-mail.';
  if (isAuthNetworkError(error)) return 'Não foi possível conectar ao serviço de autenticação.';
  return 'Não foi possível solicitar outro e-mail agora. Tente novamente em instantes.';
};

export const getPasswordRecoveryRequestErrorMessage = (error) => {
  if (isAuthRateLimitError(error)) return 'Muitas solicitações. Aguarde um pouco e tente novamente.';
  if (isAuthNetworkError(error)) return 'Não foi possível conectar ao serviço de autenticação.';
  return 'Não foi possível solicitar a redefinição agora. Tente novamente em instantes.';
};

export const getPasswordUpdateErrorMessage = (error) => {
  if (isAuthRateLimitError(error)) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (isAuthNetworkError(error)) return 'Não foi possível conectar ao serviço de autenticação.';
  return 'Não foi possível atualizar a senha. Solicite um novo link e tente novamente.';
};

export const getSafeAuthDiagnostic = (error) => ({
  code: error?.code || null,
  status: error?.status || null,
  message: error?.message || String(error || 'Erro desconhecido'),
});

export const logAuthDiagnostic = (
  context,
  error,
  { isDevelopment = import.meta.env.DEV, logger = console.error } = {},
) => {
  if (!isDevelopment) return;
  logger(context, getSafeAuthDiagnostic(error));
};

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
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const errorCode = url.searchParams.get('error_code') || hashParams.get('error_code') || '';
  const errorDescription = url.searchParams.get('error_description')
    || hashParams.get('error_description');

  if (errorDescription || errorCode) {
    const normalizedCallbackError = `${errorCode} ${errorDescription}`.toLowerCase();
    const expired = /expired|otp_expired|invalid.*token/.test(normalizedCallbackError);
    const rateLimited = /rate|limit|too many/.test(normalizedCallbackError);
    const callbackName = authState === 'recovery' ? 'redefinição de senha' : 'confirmação';
    return {
      type: 'error',
      message: expired
        ? `Este link de ${callbackName} expirou ou já foi utilizado. Solicite um novo e-mail.`
        : rateLimited
          ? `Muitas tentativas de ${callbackName}. Aguarde um pouco e solicite um novo e-mail.`
          : `Não foi possível validar este link de ${callbackName}. Solicite um novo e-mail.`,
    };
  }
  if (authState === 'confirmed') {
    return { type: 'success', message: 'E-mail confirmado. Seu acesso ao SOLO foi liberado.' };
  }
  return null;
};

export const getCleanAuthCallbackUrl = (urlValue) => {
  const url = new URL(urlValue, 'http://localhost');
  ['auth', 'code', 'token_hash', 'error', 'error_code', 'error_description'].forEach((key) => url.searchParams.delete(key));
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
