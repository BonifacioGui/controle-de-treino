import { describe, expect, it } from 'vitest';
import { getEmailConfirmationRedirectUrl, getPublicAppUrl, OFFICIAL_PUBLIC_APP_URL } from './appConfig';

describe('configuração central da URL pública', () => {
  it('usa localhost e o base path no desenvolvimento', () => {
    expect(getPublicAppUrl({ configuredUrl: '', baseUrl: '/controle-de-treino/', origin: 'http://localhost:5173' }))
      .toBe('http://localhost:5173/controle-de-treino/');
  });

  it('prioriza a URL pública configurada em produção', () => {
    expect(getPublicAppUrl({ configuredUrl: 'https://bonifaciogui.github.io/controle-de-treino', baseUrl: '/', origin: 'http://localhost:5173' }))
      .toBe('https://bonifaciogui.github.io/controle-de-treino/');
  });

  it('gera um único destino de confirmação reconhecível pelo aplicativo', () => {
    expect(getEmailConfirmationRedirectUrl({ configuredUrl: 'https://bonifaciogui.github.io/controle-de-treino/' }))
      .toBe('https://bonifaciogui.github.io/controle-de-treino/?auth=confirmed');
  });

  it('nunca aceita localhost como destino de um build de produção', () => {
    expect(getPublicAppUrl({
      configuredUrl: 'http://localhost:5173/',
      baseUrl: '/controle-de-treino/',
      origin: 'http://localhost:5173',
      isProduction: true,
    })).toBe(OFFICIAL_PUBLIC_APP_URL);
    expect(getPublicAppUrl({
      configuredUrl: '',
      baseUrl: '/',
      origin: '',
      isProduction: true,
      productionFallbackUrl: 'http://127.0.0.1:5173/',
    })).toBe(OFFICIAL_PUBLIC_APP_URL);
  });

  it('deriva uma URL absoluta do host publicado quando a variável não existe', () => {
    expect(getEmailConfirmationRedirectUrl({
      configuredUrl: '',
      baseUrl: '/controle-de-treino/',
      origin: 'https://bonifaciogui.github.io',
      isProduction: true,
    })).toBe('https://bonifaciogui.github.io/controle-de-treino/?auth=confirmed');
  });

  it('ignora configuração inválida e mantém o fallback local no desenvolvimento', () => {
    expect(getPublicAppUrl({
      configuredUrl: '/caminho-relativo',
      baseUrl: '/controle-de-treino/',
      origin: 'http://localhost:4173',
      isProduction: false,
    })).toBe('http://localhost:4173/controle-de-treino/');
  });

  it('usa a URL oficial completa em produção sem window disponível', () => {
    expect(getPublicAppUrl({
      configuredUrl: '',
      baseUrl: '/',
      origin: '',
      isProduction: true,
    })).toBe(OFFICIAL_PUBLIC_APP_URL);
  });

  it('remove query e hash acidentais da URL base configurada', () => {
    expect(getPublicAppUrl({
      configuredUrl: 'https://bonifaciogui.github.io/controle-de-treino?preview=old#section',
      isProduction: true,
    })).toBe(OFFICIAL_PUBLIC_APP_URL);
  });
});
