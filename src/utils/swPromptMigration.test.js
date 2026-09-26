import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const migrationSource = readFileSync(
  new URL('../../public/sw-prompt-migration.js', import.meta.url),
  'utf8',
);

const createMigrationHarness = ({ migrated = false, cacheUnavailable = false } = {}) => {
  const handlers = {};
  let markerResponse = migrated ? new Response('completed') : null;
  const cache = {
    match: vi.fn(async () => markerResponse),
    put: vi.fn(async (_request, response) => {
      markerResponse = response;
    }),
  };
  const skipWaiting = vi.fn(async () => undefined);
  const serviceWorker = {
    registration: { scope: 'https://example.test/controle-de-treino/' },
    addEventListener: vi.fn((type, handler) => {
      handlers[type] = handler;
    }),
    skipWaiting,
  };
  const cacheStorage = {
    open: vi.fn(async () => {
      if (cacheUnavailable) throw new Error('CacheStorage indisponível');
      return cache;
    }),
  };

  vm.runInNewContext(migrationSource, {
    URL,
    Request,
    Response,
    Boolean,
    caches: cacheStorage,
    self: serviceWorker,
  });

  const dispatchLifecycleEvent = async (type) => {
    let lifecycleWork;
    handlers[type]({
      waitUntil(promise) {
        lifecycleWork = promise;
      },
    });
    await lifecycleWork;
  };

  return {
    cache,
    cacheStorage,
    dispatchLifecycleEvent,
    skipWaiting,
  };
};

describe('migração do service worker para atualização com confirmação', () => {
  it('avança automaticamente uma única vez e grava o marcador somente na ativação', async () => {
    const harness = createMigrationHarness();

    await harness.dispatchLifecycleEvent('install');
    expect(harness.skipWaiting).toHaveBeenCalledOnce();
    expect(harness.cache.put).not.toHaveBeenCalled();

    await harness.dispatchLifecycleEvent('activate');
    expect(harness.cache.put).toHaveBeenCalledOnce();
    expect(harness.cacheStorage.open).toHaveBeenCalledWith('solo-pwa-migrations');
  });

  it('mantém versões futuras em espera quando o marcador já existe', async () => {
    const harness = createMigrationHarness({ migrated: true });

    await harness.dispatchLifecycleEvent('install');

    expect(harness.cache.match).toHaveBeenCalledOnce();
    expect(harness.skipWaiting).not.toHaveBeenCalled();
  });

  it('não deixa o cliente preso no worker antigo quando CacheStorage falha', async () => {
    const harness = createMigrationHarness({ cacheUnavailable: true });

    await expect(harness.dispatchLifecycleEvent('install')).resolves.toBeUndefined();
    expect(harness.skipWaiting).toHaveBeenCalledOnce();
    await expect(harness.dispatchLifecycleEvent('activate')).resolves.toBeUndefined();
  });
});
