import { describe, expect, it } from 'vitest';
import {
  getVisibleHistory,
  HISTORY_SYNC_STATUS,
  mergeCloudAndLocalHistory,
} from './historySync';

const base = {
  dateKey: '2026-08-20',
  workoutName: 'A',
  totalVolume: 1000,
  duration: 120,
  exercises: [],
};

describe('fila local de histórico', () => {
  it('mantém edição pendente no lugar da versão antiga da nuvem', () => {
    const merged = mergeCloudAndLocalHistory(
      [{ ...base, id: 'remote-1', note: 'antiga' }],
      [{ ...base, id: 'remote-1', localId: 'local-1', note: 'nova', syncStatus: HISTORY_SYNC_STATUS.update }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ note: 'nova', syncStatus: HISTORY_SYNC_STATUS.update });
  });

  it('mantém tombstone pendente sem exibi-lo ao usuário', () => {
    const merged = mergeCloudAndLocalHistory(
      [{ ...base, id: 'remote-1' }],
      [{ ...base, id: 'remote-1', localId: 'local-1', syncStatus: HISTORY_SYNC_STATUS.delete }],
    );

    expect(merged).toHaveLength(1);
    expect(getVisibleHistory(merged)).toEqual([]);
  });

  it('deduplica criação que já chegou à nuvem antes da confirmação local', () => {
    const merged = mergeCloudAndLocalHistory(
      [{ ...base, id: 'remote-1' }],
      [{ ...base, localId: 'local-1', syncStatus: HISTORY_SYNC_STATUS.create }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 'remote-1', syncStatus: HISTORY_SYNC_STATUS.synced });
  });

  it('não deixa uma exclusão sem id reaparecer durante a recuperação da nuvem', () => {
    const merged = mergeCloudAndLocalHistory(
      [{ ...base, id: 'remote-1' }],
      [{ ...base, localId: 'local-1', syncStatus: HISTORY_SYNC_STATUS.delete }],
    );

    expect(getVisibleHistory(merged)).toEqual([]);
    expect(merged).toHaveLength(1);
    expect(merged[0].syncStatus).toBe(HISTORY_SYNC_STATUS.delete);
  });
});
