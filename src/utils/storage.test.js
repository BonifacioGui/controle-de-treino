import { describe, expect, it } from 'vitest';
import {
  getSoloBackup,
  getUserStorageKey,
  migrateLegacyStorage,
  readUserStoredJSON,
  STORAGE_KEYS,
  writeUserStoredJSON,
} from './storage';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

describe('armazenamento privado por usuário', () => {
  it('isola dados de contas diferentes no mesmo dispositivo', () => {
    const storage = new MemoryStorage();
    writeUserStoredJSON('user-a', STORAGE_KEYS.history, [{ id: 'a' }], storage);
    writeUserStoredJSON('user-b', STORAGE_KEYS.history, [{ id: 'b' }], storage);

    expect(readUserStoredJSON('user-a', STORAGE_KEYS.history, [], storage)).toEqual([{ id: 'a' }]);
    expect(readUserStoredJSON('user-b', STORAGE_KEYS.history, [], storage)).toEqual([{ id: 'b' }]);
    expect(getUserStorageKey('user-a', STORAGE_KEYS.history)).toBe('solo:user:user-a:history');
  });

  it('migra chaves legadas para o usuário autenticado e preserva outros projetos', () => {
    const storage = new MemoryStorage();
    storage.setItem('workout_plan', JSON.stringify({ A: { exercises: [] } }));
    storage.setItem('outro-projeto:preferencias', 'não remover');

    migrateLegacyStorage('user-1', storage);

    expect(readUserStoredJSON('user-1', STORAGE_KEYS.workoutPlan, {}, storage)).toEqual({ A: { exercises: [] } });
    expect(storage.getItem('workout_plan')).toBeNull();
    expect(storage.getItem('outro-projeto:preferencias')).toBe('não remover');
    expect(readUserStoredJSON('user-1', STORAGE_KEYS.planSync, {}, storage).dirty).toBe(true);
  });

  it('faz merge, normaliza e deduplica as duas origens antigas de histórico', () => {
    const storage = new MemoryStorage();
    const duplicate = { date: '20/08/2026', dayName: 'A', totalVolume: 1000, duration: 120, exercises: [] };
    storage.setItem('workout_history', JSON.stringify([duplicate, { ...duplicate, date: '19/08/2026' }]));
    storage.setItem('solo_history', JSON.stringify([duplicate, { ...duplicate, date: '18/08/2026' }]));

    migrateLegacyStorage('user-1', storage);

    const migrated = readUserStoredJSON('user-1', STORAGE_KEYS.history, [], storage);
    expect(migrated.map((entry) => entry.dateKey)).toEqual(['2026-08-20', '2026-08-19', '2026-08-18']);
    expect(storage.getItem('workout_history')).toBeNull();
    expect(storage.getItem('solo_history')).toBeNull();
  });

  it('gera backup somente do usuário solicitado, sem sessão de autenticação', () => {
    const storage = new MemoryStorage();
    writeUserStoredJSON('user-a', STORAGE_KEYS.workoutPlan, { A: { exercises: [] } }, storage);
    writeUserStoredJSON('user-b', STORAGE_KEYS.workoutPlan, { B: { exercises: [] } }, storage);
    storage.setItem('sb-token', 'segredo');
    const backup = getSoloBackup('user-a', storage, '2026-08-20T12:00:00.000Z');

    expect(backup.version).toBe(3);
    expect(backup.data.workoutPlan).toEqual({ A: { exercises: [] } });
    expect(JSON.stringify(backup)).not.toContain('segredo');
    expect(JSON.stringify(backup)).not.toContain('"B"');
  });

  it('não apaga nem marca como concluída uma migração com JSON corrompido', () => {
    const storage = new MemoryStorage();
    storage.setItem('solo_history', '{incompleto');

    migrateLegacyStorage('user-1', storage);

    expect(storage.getItem('solo_history')).toBe('{incompleto');
    expect(storage.getItem(getUserStorageKey('user-1', STORAGE_KEYS.migrationVersion))).toBeNull();
  });
});
