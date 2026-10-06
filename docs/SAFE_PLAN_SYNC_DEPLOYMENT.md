# Implantação segura do versionamento da ficha

Esta atualização exige coordenação entre o banco e o cliente. Não execute a
migration como parte automática do deploy do GitHub Pages.

## Compatibilidade

- O cliente atualmente publicado lê `workout_plans` e grava por `upsert` direto.
- A migration mantém leitura liberada, cria uma versão-base de cada ficha e
  revoga apenas `insert/update/delete` diretos.
- Um cliente antigo que tentar salvar depois da migration receberá erro. A
  alteração continua no armazenamento local porque o estado pendente só é
  limpo após sucesso remoto.
- O cliente novo grava exclusivamente pela RPC `save_workout_plan`, comparando
  `expected_version_id`. Alterações antigas sem versão-base viram conflito
  explícito e as duas cópias são preservadas.
- Histórico, sessões, medidas e gamificação não dependem dessa RPC.

## Ordem obrigatória

1. Pausar mudanças de ficha durante a janela e criar um backup de
   `workout_plans` no Supabase.
2. Validar o build novo e manter o deploy ainda sem publicar.
3. Executar, como uma única transação, a migration
   `202610020001_workout_plan_versioning.sql`.
4. Confirmar que a tabela continua legível, que `workout_plan_versions` recebeu
   os snapshots `migration-baseline` e que um `upsert` direto autenticado é
   recusado.
5. Publicar imediatamente o novo cliente no GitHub Pages.
6. Confirmar no app novo: leitura da ficha, edição, chamada da RPC e conflito
   entre duas versões. Não force nem limpe o cache dos participantes.
7. Orientar usuários da PWA a aceitar “Nova versão disponível”. Enquanto não
   atualizam, versões antigas continuam podendo treinar e manter alterações
   locais, mas não conseguem sobrescrever a ficha remota.
8. Acompanhar erros `PLAN_CONFLICT`, resolver pela interface e somente depois
   encerrar a janela de implantação.

## Recuperação pessoal A/B/C

A recuperação fica desabilitada para todos quando
`VITE_PERSONAL_PLAN_RECOVERY_USER_ID` não está definida. Para uma implantação
temporária, configure o secret do GitHub
`SOLO_PERSONAL_PLAN_RECOVERY_USER_ID` com o UUID exato da conta autorizada.
O cliente ainda compara esse UUID com o usuário autenticado antes de exibir ou
executar a operação. Remova o secret e publique novamente após a recuperação.

## Critérios para abortar

- A migration não concluiu integralmente.
- A versão-base não foi criada para todas as linhas existentes.
- O cliente novo não consegue ler `version_id/revision`.
- A RPC aceita uma versão esperada incorreta.
- Uma alteração pendente desaparece do armazenamento local após erro remoto.

Em qualquer um desses casos, não publique o cliente e não tente corrigir dados
manualmente sem comparar o backup, a versão remota e a cópia local.
