# Alertas do descanso

O descanso usa um horário absoluto (`endTime`) e recalcula o tempo restante com `Date.now()`. Isso evita acumular atraso quando o navegador reduz a frequência dos intervalos em segundo plano.

Ao concluir, o SOLO tenta usar quatro canais independentes:

1. vibração, quando a Vibration API existe, a origem é segura, houve interação e a página está visível;
2. som gerado pela Web Audio API, quando habilitado;
3. alerta visual dentro do aplicativo;
4. notificação do sistema, quando habilitada, autorizada e o documento está oculto.

## Limitações da plataforma

- iPhone e iPad não disponibilizam a Vibration API para sites ou PWAs. Nesses aparelhos, o SOLO usa som, aviso visual e notificação permitida como alternativas.
- Android: Chrome, Edge e Samsung Internet normalmente oferecem a API, mas o retorno `true` confirma apenas que o navegador aceitou o pedido. Modo silencioso, Não Perturbe, economia de bateria ou política do fabricante ainda podem impedir a vibração física.
- Computadores geralmente não possuem motor háptico, mesmo quando alguma API é exposta.
- Navegadores podem suspender JavaScript em segundo plano. A notificação local é uma tentativa de melhor esforço; entrega garantida com o app totalmente encerrado exigiria push e infraestrutura de servidor, que não fazem parte desta central interna.

Os testes automatizados cobrem detecção, padrões, deduplicação, retorno booleano, relógio absoluto e alternativas. A confirmação física precisa ser feita em aparelho real pelo botão **Testar vibração** nas configurações.
