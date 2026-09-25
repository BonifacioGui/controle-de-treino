import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import PasswordRecoveryRequest, { PASSWORD_RECOVERY_SENT_MESSAGE } from './PasswordRecoveryRequest';
import PasswordResetPanel from './PasswordResetPanel';

describe('recuperação segura de senha', () => {
  it('solicita somente o e-mail e mantém a confirmação neutra', () => {
    const html = renderToStaticMarkup(
      <PasswordRecoveryRequest initialEmail="usuario@example.com" onBack={() => {}} />,
    );

    expect(html).toContain('Redefinir senha');
    expect(html).toContain('usuario@example.com');
    expect(html).toContain('Enviar instruções');
    expect(PASSWORD_RECOVERY_SENT_MESSAGE).toContain('Se existir uma conta associada');
    expect(PASSWORD_RECOVERY_SENT_MESSAGE).not.toContain('conta existe');
  });

  it('exige confirmação e pelo menos oito caracteres para a nova senha', () => {
    const html = renderToStaticMarkup(<PasswordResetPanel onComplete={() => {}} />);

    expect(html).toContain('Criar nova senha');
    expect(html).toContain('Nova senha');
    expect(html).toContain('Confirmar nova senha');
    expect(html).toContain('minLength="8"');
    expect(html).not.toContain('localStorage');
  });
});
