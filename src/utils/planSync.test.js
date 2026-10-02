import { describe, expect, it } from 'vitest';
import {
  PLAN_SYNC_STATUS,
  canAutoSyncPlan,
  markPlanAsLegacy,
  markPlanDirty,
  markPlanSynced,
  reconcileWorkoutPlan,
  resolvePlanConflict,
} from './planSync';

const local = { A: { focus: 'PEITO', exercises: [] } };
const remotePlan = { A: { focus: 'COSTAS', exercises: [] } };
const remote = {
  planData: remotePlan,
  versionId: 'remote-v2',
  revision: 2,
  updatedAt: '2026-10-02T12:00:00.000Z',
};

describe('sincronização segura do plano de treino', () => {
  it('marca uma edição offline como pendente e preserva a versão-base', () => {
    expect(markPlanDirty({ dirty: false, revision: 3, baseVersionId: 'remote-v1' })).toMatchObject({
      dirty: true,
      revision: 4,
      status: PLAN_SYNC_STATUS.PENDING,
      baseVersionId: 'remote-v1',
      pendingSource: 'user-edit',
    });
  });

  it('só limpa a fila se nenhuma edição mais nova ocorreu durante o envio', () => {
    expect(markPlanSynced({ dirty: true, revision: 4 }, 4, remote)).toMatchObject({
      dirty: false,
      revision: 4,
      status: PLAN_SYNC_STATUS.CLEAN,
      baseVersionId: 'remote-v2',
    });
    expect(markPlanSynced({ dirty: true, revision: 5 }, 4, remote)).toMatchObject({
      dirty: true,
      revision: 5,
    });
  });

  it('aceita o plano remoto quando o local limpo está desatualizado', () => {
    const result = reconcileWorkoutPlan({ localPlan: local, syncState: {}, remote });
    expect(result.action).toBe('remote');
    expect(result.plan).toEqual(remotePlan);
    expect(result.sync.baseVersionId).toBe('remote-v2');
  });

  it('permite upload offline quando a versão remota continua sendo a versão-base', () => {
    const result = reconcileWorkoutPlan({
      localPlan: local,
      syncState: markPlanDirty({ baseVersionId: 'remote-v2' }),
      remote,
    });
    expect(result.action).toBe('upload');
    expect(canAutoSyncPlan(result.sync)).toBe(true);
  });

  it('preserva as duas versões quando outro dispositivo alterou o remoto', () => {
    const result = reconcileWorkoutPlan({
      localPlan: local,
      syncState: markPlanDirty({ baseVersionId: 'remote-v1' }),
      remote,
    });
    expect(result.action).toBe('conflict');
    expect(result.sync.status).toBe(PLAN_SYNC_STATUS.CONFLICT);
    expect(result.sync.conflict.localPlan).toEqual(local);
    expect(result.sync.conflict.remotePlan).toEqual(remotePlan);
    expect(canAutoSyncPlan(result.sync)).toBe(false);
  });

  it('nunca publica automaticamente plano recuperado de storage legado', () => {
    const result = reconcileWorkoutPlan({
      localPlan: local,
      syncState: markPlanAsLegacy({ revision: 1 }),
      remote,
    });
    expect(result.action).toBe('conflict');
    expect(result.sync.conflict.reason).toBe('legacy-local-plan');
  });

  it('exige escolha explícita no conflito e usa CAS ao manter a cópia local', () => {
    const conflicted = reconcileWorkoutPlan({
      localPlan: local,
      syncState: markPlanDirty({ baseVersionId: 'remote-v1' }),
      remote,
    }).sync;

    const keepRemote = resolvePlanConflict(conflicted, 'remote');
    expect(keepRemote.plan).toEqual(remotePlan);
    expect(keepRemote.sync.status).toBe(PLAN_SYNC_STATUS.CLEAN);

    const keepLocal = resolvePlanConflict(conflicted, 'local');
    expect(keepLocal.plan).toEqual(local);
    expect(keepLocal.sync.status).toBe(PLAN_SYNC_STATUS.PENDING);
    expect(keepLocal.sync.baseVersionId).toBe('remote-v2');
  });

  it('bloqueia qualquer envio até a migration de versionamento existir', () => {
    const result = reconcileWorkoutPlan({
      localPlan: local,
      syncState: markPlanDirty({ baseVersionId: 'remote-v2' }),
      remote,
      schemaReady: false,
    });
    expect(result.action).toBe('blocked');
    expect(result.sync.status).toBe(PLAN_SYNC_STATUS.SCHEMA_REQUIRED);
    expect(canAutoSyncPlan(result.sync)).toBe(false);
  });
});
