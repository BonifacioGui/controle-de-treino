import { describe, expect, it } from 'vitest';
import { getAuthCallbackNotice, getCleanAuthCallbackUrl, withTimeout } from './authFlow';

describe('fluxo de autenticação', () => {
  it('reconhece uma confirmação de e-mail', () => {
    expect(getAuthCallbackNotice('https://solo.test/controle-de-treino/?auth=confirmed')).toEqual({
      type: 'success',
      message: 'E-mail confirmado com sucesso. Sua conta SOLO está ativa.',
    });
  });

  it('remove somente os parâmetros técnicos do callback', () => {
    expect(getCleanAuthCallbackUrl('https://solo.test/controle-de-treino/?auth=confirmed&preview=abc'))
      .toBe('/controle-de-treino/?preview=abc');
  });

  it('remove tokens e erros técnicos do fragmento sem apagar âncoras comuns', () => {
    expect(getCleanAuthCallbackUrl('https://solo.test/controle-de-treino/?preview=abc#access_token=secret&token_type=bearer&section=profile'))
      .toBe('/controle-de-treino/?preview=abc#section=profile');
  });

  it('encerra uma leitura de sessão que nunca responde', async () => {
    await expect(withTimeout(new Promise(() => {}), 5)).rejects.toThrow('AUTH_SESSION_TIMEOUT');
  });
});
