import { describe, expect, it } from 'vitest';
import { getEmailConfirmationRedirectUrl, getPublicAppUrl } from './appConfig';

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
});
