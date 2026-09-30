# Segurança da Edge Function de importação

O cliente invoca a Edge Function `parse-workout`, mas o código-fonte dessa função
não está versionado neste repositório. Portanto, esta base não permite confirmar
autenticação, rate limiting ou controle de custo no servidor.

Antes de considerar a função protegida, verifique no projeto Supabase:

- se a função exige e valida um JWT de usuário autenticado;
- se identifica o usuário pelo token validado, nunca por um identificador enviado
  livremente no corpo;
- se limita chamadas por usuário em uma janela de tempo usando armazenamento
  persistente e compartilhado entre instâncias;
- se responde com HTTP `429` e informa um tempo de nova tentativa;
- se mantém o limite de tamanho do texto e do PDF também no servidor;
- se impõe timeout e teto de custo para o provedor de IA;
- se os logs não registram tokens nem conteúdo sensível desnecessário.

O cache e as validações existentes no cliente melhoram a experiência, mas podem
ser contornados e não constituem proteção contra abuso. Um contador em memória
também é insuficiente porque reinicia em cold starts e não é compartilhado entre
instâncias.
