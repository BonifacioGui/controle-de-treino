# SOLO — Controle de Treino

Aplicativo de treino com acompanhamento de séries, cargas, descanso, histórico, biometria, estatísticas e progressão gamificada. A interface é responsiva, pode ser instalada como PWA e sincroniza os dados com Supabase.

## Recursos

- criação e importação de rotinas;
- registro de séries, repetições, carga e tempo de treino;
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
npm run build
```

O build de produção é gerado em `dist/`.

## Tecnologias

React 19, Vite 7, Tailwind CSS, Supabase, Recharts, Lucide e Vite PWA.
