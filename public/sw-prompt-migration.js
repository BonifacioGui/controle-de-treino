// Este cache não usa o prefixo do Workbox para sobreviver ao cleanupOutdatedCaches.
const SOLO_MIGRATION_CACHE = 'solo-pwa-migrations';
const PROMPT_MIGRATION_MARKER = new Request(
  new URL('__prompt-update-enabled-v1__', self.registration.scope).href,
);

const getMigrationCache = () => caches.open(SOLO_MIGRATION_CACHE);

const hasCompletedPromptMigration = async () => {
  try {
    const cache = await getMigrationCache();
    return Boolean(await cache.match(PROMPT_MIGRATION_MARKER));
  } catch {
    // Falha de CacheStorage não pode impedir a saída do service worker legado.
    return false;
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // O SW antigo usava autoUpdate e seus clientes não conseguem liberar um SW em espera.
    // Apenas a primeira versão com este script avança automaticamente.
    if (!(await hasCompletedPromptMigration())) await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await getMigrationCache();
      await cache.put(PROMPT_MIGRATION_MARKER, new Response('completed', {
        headers: { 'Content-Type': 'text/plain' },
      }));
    } catch {
      // O app continua utilizável mesmo quando o navegador bloqueia CacheStorage.
    }
  })());
});
