import { describe, expect, it } from 'vitest';
import {
  getAuthCallbackNotice,
  getCleanAuthCallbackUrl,
  getLoginErrorMessage,
  getPasswordRecoveryRequestErrorMessage,
  getPasswordUpdateErrorMessage,
  getResendErrorMessage,
  getSignUpErrorMessage,
  isEmailNotConfirmedError,
  logAuthDiagnostic,
  withTimeout,
} from './authFlow';

describe('fluxo de autenticação', () => {
  it('reconhece uma confirmação de e-mail', () => {
    expect(getAuthCallbackNotice('https://solo.test/controle-de-treino/?auth=confirmed')).toEqual({
      type: 'success',
      message: 'E-mail confirmado. Seu acesso ao SOLO foi liberado.',
    });
  });

  it('não expõe a descrição técnica de um callback com token expirado', () => {
    const notice = getAuthCallbackNotice('https://solo.test/?error_code=otp_expired&error_description=Database%20secret%20detail');
    expect(notice).toEqual({
      type: 'error',
      message: 'Este link de confirmação expirou ou já foi utilizado. Solicite um novo e-mail.',
    });
    expect(notice.message).not.toContain('Database');
  });

  it('distingue um link expirado de recuperação sem expor detalhes técnicos', () => {
    const notice = getAuthCallbackNotice('https://solo.test/?auth=recovery&error_code=otp_expired&error_description=Sensitive%20detail');
    expect(notice).toEqual({
      type: 'error',
      message: 'Este link de redefinição de senha expirou ou já foi utilizado. Solicite um novo e-mail.',
    });
    expect(notice.message).not.toContain('Sensitive');
  });

  it('remove somente os parâmetros técnicos do callback', () => {
    expect(getCleanAuthCallbackUrl('https://solo.test/controle-de-treino/?auth=confirmed&preview=abc'))
      .toBe('/controle-de-treino/?preview=abc');
  });

  it('remove tokens e erros técnicos do fragmento sem apagar âncoras comuns', () => {
    expect(getCleanAuthCallbackUrl('https://solo.test/controle-de-treino/?preview=abc#access_token=secret&token_type=bearer&section=profile'))
      .toBe('/controle-de-treino/?preview=abc#section=profile');
  });

  it('remove também o código PKCE da query após consumir o callback', () => {
    expect(getCleanAuthCallbackUrl('https://solo.test/controle-de-treino/?auth=confirmed&code=temporary&preview=abc'))
      .toBe('/controle-de-treino/?preview=abc');
  });

  it('distingue conta não confirmada, credenciais, limite e rede sem mensagem crua', () => {
    const unconfirmed = { code: 'email_not_confirmed', message: 'Email not confirmed', status: 400 };
    expect(isEmailNotConfirmedError(unconfirmed)).toBe(true);
    expect(getLoginErrorMessage(unconfirmed)).toBe('Confirme seu e-mail antes de entrar.');
    expect(getLoginErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' }))
      .toBe('E-mail ou senha incorretos.');
    expect(getLoginErrorMessage({ status: 429, message: 'Too many requests' }))
      .toBe('Muitas tentativas. Aguarde um pouco e tente novamente.');
    expect(getLoginErrorMessage(new TypeError('Failed to fetch')))
      .toBe('Não foi possível conectar ao serviço de autenticação.');
  });

  it('mantém cadastro e reenvio neutros para não enumerar usuários', () => {
    expect(getSignUpErrorMessage({ message: 'User already registered' }))
      .toBe('Não foi possível solicitar o cadastro agora. Confira os dados e tente novamente.');
    expect(getResendErrorMessage({ status: 429, message: 'rate limit' }))
      .toBe('Aguarde um pouco antes de solicitar outro e-mail.');
  });

  it('mantém erros de recuperação seguros e sem confirmação de existência da conta', () => {
    expect(getPasswordRecoveryRequestErrorMessage({ message: 'User not found' }))
      .toBe('Não foi possível solicitar a redefinição agora. Tente novamente em instantes.');
    expect(getPasswordRecoveryRequestErrorMessage(new TypeError('Failed to fetch')))
      .toBe('Não foi possível conectar ao serviço de autenticação.');
    expect(getPasswordUpdateErrorMessage({ status: 429, message: 'rate limit' }))
      .toBe('Muitas tentativas. Aguarde um pouco e tente novamente.');
  });

  it('registra diagnóstico técnico somente em desenvolvimento', () => {
    const calls = [];
    const logger = (...args) => calls.push(args);
    logAuthDiagnostic('Falha:', { code: 'invalid_credentials', status: 400, message: 'detail' }, { isDevelopment: false, logger });
    expect(calls).toHaveLength(0);
    logAuthDiagnostic('Falha:', { code: 'invalid_credentials', status: 400, message: 'detail' }, { isDevelopment: true, logger });
    expect(calls).toEqual([['Falha:', { code: 'invalid_credentials', status: 400, message: 'detail' }]]);
  });

  it('encerra uma leitura de sessão que nunca responde', async () => {
    await expect(withTimeout(new Promise(() => {}), 5)).rejects.toThrow('AUTH_SESSION_TIMEOUT');
  });
});
