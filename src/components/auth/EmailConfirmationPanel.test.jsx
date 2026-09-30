import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/supabaseClient', () => ({
  supabase: { auth: { resend: vi.fn() } },
}));

import EmailConfirmationPanel from './EmailConfirmationPanel';

describe('painel seguro de confirmação de e-mail', () => {
  it('mostra o endereço, spam, reenvio e retorno sem afirmar que uma conta foi criada', () => {
    const html = renderToStaticMarkup(
      <EmailConfirmationPanel email="usuario@example.com" onBack={() => {}} />,
    );

    expect(html).toContain('Verifique seu e-mail');
    expect(html).toContain('usuario@example.com');
    expect(html).toContain('pasta de spam');
    expect(html).toContain('Reenviar e-mail');
    expect(html).toContain('Retornar ao login');
    expect(html).not.toContain('Conta criada');
    expect(html).not.toContain('Sua conta já foi criada');
  });
});
