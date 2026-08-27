# Paridade visual DARK/LIGHT

Toda funcionalidade visual nova ou alterada deve ser validada em **DARK** e **LIGHT** antes de ser considerada concluída. Nenhum dos temas é uma adaptação futura do outro: ambos fazem parte do mesmo critério de aceite.

## Matriz obrigatória

| Área crítica | Fixtures de validação |
| --- | --- |
| Boss | `active`, `complete` |
| ExerciseCard | `active` |
| RestTimer | `rest` |
| PR | `complete` |
| Level Up | `level` |
| Charts | `stats` |
| Modais | `complete`, `level` |
| States | `login`, `active`, `rest`, `complete` |
| Inputs | `login`, `active`, `manage`, `importer` |

A fonte executável desta tabela está em `src/dev/themeParityMatrix.js`. O teste correspondente impede que uma área crítica seja removida da cobertura ou aponte para uma fixture inexistente.

## Critério de aceite

Para cada fixture afetada:

1. abrir a fixture uma vez com `theme=dark` e outra com `theme=light`;
2. conferir texto, ícones, bordas, superfícies, foco, hover, estados desabilitado/erro/sucesso e hierarquia visual;
3. validar pelo menos as larguras `320`, `390`, `768` e `1280` quando houver alteração de layout;
4. conferir `immersive`, `balanced` e `discreet` quando a intensidade visual for afetada;
5. confirmar ausência de rolagem horizontal e de erros ou avisos novos no console;
6. executar `npm run test:theme-parity`, `npm run lint`, `npm test` e `npm run build`.

Exemplo local:

```text
http://localhost:5173/controle-de-treino/?ui-preview=active&theme=dark&experience=balanced
http://localhost:5173/controle-de-treino/?ui-preview=active&theme=light&experience=balanced
```

Paridade significa que ambos os temas são legíveis, funcionais, responsivos e coerentes com sua direção visual. Ela não exige que DARK e LIGHT tenham exatamente as mesmas cores ou efeitos.
