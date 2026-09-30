# Configuração de autenticação do Supabase

O código já envia `emailRedirectTo` para uma URL centralizada. O painel do Supabase também precisa autorizar esse destino; caso contrário, o serviço usa a `Site URL` configurada no projeto — que era `localhost` quando o redirecionamento incorreto foi observado.

## Produção

No painel do projeto, abra **Authentication → URL Configuration** e configure:

- **Site URL:** `https://bonifaciogui.github.io/controle-de-treino/`
- **Redirect URLs:** adicione `https://bonifaciogui.github.io/controle-de-treino/**`

Também é possível autorizar apenas o callback exato usado pelo aplicativo:

```text
https://bonifaciogui.github.io/controle-de-treino/?auth=confirmed
```

No GitHub Actions, o workflow define:

```env
VITE_PUBLIC_APP_URL=https://bonifaciogui.github.io/controle-de-treino/
```

Os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` continuam necessários no repositório.

## Desenvolvimento local

Adicione também uma URL local permitida no painel:

```text
http://localhost:5173/**
```

E use em `.env.local`:

```env
VITE_PUBLIC_APP_URL=http://localhost:5173/controle-de-treino/
```

Se o Vite iniciar em outra porta, autorize exatamente a URL daquela porta e ajuste a variável local. Não coloque a URL local no secret de produção.

## SMTP e remetente do e-mail

Confira **Authentication → SMTP Settings**. O serviço de e-mail padrão do Supabase é apropriado para testes, mas pode ter limites de envio e disponibilidade mais restritos. Para produção, avalie um provedor SMTP próprio configurado diretamente no painel.

Não coloque usuário ou senha SMTP no frontend, no `.env.local` do Vite ou no repositório. O aplicativo permite solicitar um novo e-mail com intervalo de 60 segundos e trata limites de envio sem revelar se o endereço já possui conta.

## Comportamento seguro do cadastro

Uma solicitação aceita por `signUp()` não é usada para afirmar que uma conta é nova. A tela sempre apresenta uma resposta neutra, pois o Supabase pode ofuscar tentativas com e-mails já existentes para reduzir enumeração de usuários. O frontend não consulta `auth.users`, não usa `service_role` e não cria uma tabela paralela de usuários.

## Banco de dados

Não há migração SQL para estes ajustes. `goals`, `goal`, `class` e `gender` são gravados em `auth.users.raw_user_meta_data` por `signUp`/`updateUser`. O array `goals` aceita até dois identificadores; `goal` replica o primeiro para manter contas e versões antigas compatíveis.
