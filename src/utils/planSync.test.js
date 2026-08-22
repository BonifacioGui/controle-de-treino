import { describe, expect, it } from 'vitest';
import { markPlanDirty, markPlanSynced } from './planSync';

describe('fila do plano de treino', () => {
  it('marca uma edição offline como pendente', () => {
    expect(markPlanDirty({ dirty: false, revision: 3 })).toEqual({ dirty: true, revision: 4 });
  });

  it('só limpa o dirty se nenhuma edição mais nova ocorreu durante o envio', () => {
    expect(markPlanSynced({ dirty: true, revision: 4 }, 4)).toEqual({ dirty: false, revision: 4 });
    expect(markPlanSynced({ dirty: true, revision: 5 }, 4)).toEqual({ dirty: true, revision: 5 });
  });
});
