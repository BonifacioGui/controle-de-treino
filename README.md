# SOLO — Controle de Treino

Aplicativo de treino com acompanhamento de séries, cargas, descanso, histórico, biometria, estatísticas e progressão gamificada. A interface é responsiva, pode ser instalada como PWA e sincroniza os dados com Supabase.

## Recursos

- criação e importação de rotinas;
- registro de séries, repetições, carga e tempo de treino;
- modos explícitos de carga (total, por lado, por halter, máquina, peso corporal, assistido, duração e distância);
- temporizador de descanso com alerta e vibração;
- histórico, recordes pessoais e gráficos de evolução;
- perfil biométrico e metas corporais;
- missões, conquistas, XP, níveis e sequência de treinos;
- cartão compartilhável ao concluir uma sessão;
- modo claro/escuro persistente e suporte offline via PWA.

## Executar localmente

Requisitos: Node.js 20 ou superior e uma instância Supabase configurada.

```bash
npm ci
npm run dev
```

Crie um arquivo `.env.local` com as variáveis usadas em `src/services/supabaseClient.js`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

## Qualidade

```bash
npm run lint
npm test
npm run test:theme-parity
npm run build
```

O build de produção é gerado em `dist/`.

Mudanças visuais só são concluídas após validação em DARK e LIGHT. A matriz de componentes, fixtures e critérios está em [`docs/THEME_PARITY.md`](docs/THEME_PARITY.md).

## Migrações do Supabase

Antes de publicar uma versão que altere o modelo de dados, execute no SQL Editor do projeto Supabase os arquivos de `supabase/migrations`, em ordem.

- `202608220001_history_integrity.sql`: adiciona e preenche o estado de treino parcial e o XP oficial de cada sessão.
- `202608260001_session_integrity.sql`: adiciona identidade única da sessão, título/foco imutáveis, encontro de Boss e snapshot do relatório; também cria a proteção contra sessões duplicadas.

O cliente mantém fallback para o esquema anterior, mas os novos snapshots e a deduplicação no banco só ficam completos após a segunda migração.

## Tecnologias

React 19, Vite 7, Tailwind CSS, Supabase, Recharts, Lucide e Vite PWA.
