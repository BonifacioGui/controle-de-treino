import { describe, expect, it } from 'vitest';
import { getSoloBackup, migrateLegacyStorage, STORAGE_KEYS } from './storage';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

describe('migração do armazenamento', () => {
  it('migra chaves legadas do SOLO e preserva dados de outros projetos', () => {
    const storage = new MemoryStorage();
    storage.setItem('workout_plan', JSON.stringify({ A: { exercises: [] } }));
    storage.setItem('outro-projeto:preferencias', 'não remover');

    migrateLegacyStorage(storage);

    expect(JSON.parse(storage.getItem(STORAGE_KEYS.workoutPlan))).toEqual({ A: { exercises: [] } });
    expect(storage.getItem('workout_plan')).toBeNull();
    expect(storage.getItem('outro-projeto:preferencias')).toBe('não remover');
  });

  it('gera backup versionado sem sessão ou credenciais', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.workoutPlan, JSON.stringify({ A: { exercises: [] } }));
    storage.setItem('sb-token', 'segredo');
    const backup = getSoloBackup(storage, '2026-08-20T12:00:00.000Z');

    expect(backup.version).toBe(1);
    expect(backup.data.workoutPlan).toEqual({ A: { exercises: [] } });
    expect(JSON.stringify(backup)).not.toContain('segredo');
  });
});
