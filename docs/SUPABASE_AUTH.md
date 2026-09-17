# Configuração de autenticação do Supabase

O código já envia `emailRedirectTo` para uma URL centralizada. O painel do Supabase também precisa autorizar esse destino; caso contrário, o serviço usa a `Site URL` configurada no projeto — que era `localhost` quando o redirecionamento incorreto foi observado.

## Produção

No painel do projeto, abra **Authentication → URL Configuration** e configure:

- **Site URL:** `https://bonifaciogui.github.io/controle-de-treino/`
- **Redirect URLs:** `https://bonifaciogui.github.io/controle-de-treino/?auth=confirmed`

No GitHub Actions, o workflow define:

```env
VITE_PUBLIC_APP_URL=https://bonifaciogui.github.io/controle-de-treino/
```

Os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` continuam necessários no repositório.

## Desenvolvimento local

Adicione também esta URL permitida no painel:

```text
http://localhost:5173/controle-de-treino/?auth=confirmed
```

E use em `.env.local`:

```env
VITE_PUBLIC_APP_URL=http://localhost:5173/controle-de-treino/
```

Se o Vite iniciar em outra porta, autorize exatamente a URL daquela porta e ajuste a variável local. Não coloque a URL local no secret de produção.

## Remetente do e-mail

Enquanto não houver SMTP personalizado em **Project Settings → Authentication → SMTP Settings**, a confirmação pode aparecer com remetente do Supabase. O aplicativo avisa isso e permite reenviar com intervalo de 60 segundos.

## Banco de dados

Não há migração SQL para estes ajustes. `goals`, `goal`, `class` e `gender` são gravados em `auth.users.raw_user_meta_data` por `signUp`/`updateUser`. O array `goals` aceita até dois identificadores; `goal` replica o primeiro para manter contas e versões antigas compatíveis.
