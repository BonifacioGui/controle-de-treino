# Segurança e isolamento no Supabase

Este documento separa as proteções implementadas pelo cliente das garantias que
dependem da configuração do projeto Supabase.

## O que o aplicativo garante

- Dados privados no `localStorage` usam chaves com o `userId` autenticado.
- Respostas assíncronas de uma conta anterior são ignoradas após a troca de usuário.
- Leituras e alterações em `workout_history`, `workout_plans` e `body_stats` enviam
  ou filtram o `user_id` atual.
- Sessões em andamento, alterações do plano e a fila do histórico permanecem no
  dispositivo até serem sincronizadas.
- Exclusões do histórico usam um marcador local até a confirmação da nuvem, para
  que um registro pendente não reapareça durante a reconciliação.

Esses filtros evitam erros acidentais no cliente, mas **não são uma fronteira de
segurança**. Um usuário pode fazer requisições fora da interface. O isolamento real
entre contas deve ser aplicado pelo banco com Row Level Security (RLS).

## Operações que exigem políticas RLS

As três tabelas acessadas pelo cliente precisam ter RLS habilitado e políticas para
o papel `authenticated` com a condição `auth.uid() = user_id`:

| Tabela | Operações usadas pelo cliente | Garantia necessária |
| --- | --- | --- |
| `workout_history` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `USING` nas leituras/alterações e `WITH CHECK` nas inserções/atualizações |
| `workout_plans` | `SELECT`, `INSERT`/`UPDATE` por `UPSERT` | `USING` e `WITH CHECK`; `user_id` também precisa ser único para o `UPSERT` |
| `body_stats` | `SELECT`, `INSERT`/`UPDATE` por `UPSERT`, `DELETE` | `USING` e `WITH CHECK`; deve existir uma restrição `UNIQUE (user_id, date)` |

Uma política de `SELECT` baseada apenas em `authenticated` não é suficiente: ela
não pode permitir que uma conta leia linhas de outro `user_id`. Da mesma forma,
`WITH CHECK` é necessário para impedir que uma conta grave uma linha em nome de
outra.

Também é necessário remover ou restringir políticas antigas permissivas, como
`USING (true)`: no PostgreSQL, políticas permissivas aplicáveis à mesma operação
são combinadas por `OR`, então adicionar uma política correta não neutraliza outra
que continue liberando todas as linhas.

## Bucket de avatares

O cliente usa o bucket `avatars`, com arquivos nomeados pelo prefixo do usuário
(`{userId}-{timestamp}.{ext}`). Upload e remoção devem ser permitidos apenas quando
o objeto pertence ao `auth.uid()` atual. A leitura pública pode permanecer somente
se avatares públicos forem uma decisão intencional do produto.

## Limite desta revisão

As migrations versionadas neste repositório alteram apenas o modelo de
`workout_history`; elas não descrevem as políticas já configuradas no painel, todos
os tipos/constraints das tabelas nem as políticas de `storage.objects`. Por isso,
esta revisão não adiciona ou substitui políticas automaticamente. Antes de criar
uma migration de RLS, exporte o schema e as políticas atuais do projeto para evitar
nomes duplicados, bloqueio involuntário do aplicativo ou preservação de uma política
antiga excessivamente permissiva.

O armazenamento offline durável cobre sessão em andamento, plano e histórico.
Medições de `body_stats` ainda são salvas e excluídas diretamente no Supabase,
sem fila offline ou tombstone próprio; ampliar essa garantia exige uma evolução
separada do modelo de sincronização.

Além das políticas, a instância precisa aceitar em `overload_status` os valores
`NORMAL`, `OVERLOAD`, `MANUTENÇÃO` e `REDUÇÃO`. A migration
`202608260001_session_integrity.sql` também deve estar aplicada para que
`session_id` forneça a deduplicação robusta descrita pelo cliente.
