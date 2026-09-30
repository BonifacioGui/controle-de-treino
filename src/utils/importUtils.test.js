import { describe, expect, it } from 'vitest';
import { getImportConflicts, mergeImportedWorkoutPlan } from './importUtils';

describe('conflitos de importação', () => {
  const existing = { A: { title: 'Atual' } };
  const imported = { A: { title: 'Importado' }, B: { title: 'Novo' } };

  it('exige uma decisão explícita quando um identificador já existe', () => {
    expect(getImportConflicts(existing, imported)).toEqual(['A']);
    expect(() => mergeImportedWorkoutPlan(existing, imported)).toThrow(/Escolha/);
  });

  it('mantém ambos com identificador único sem alterar o plano existente', () => {
    const result = mergeImportedWorkoutPlan(existing, imported, 'keep');
    expect(result.plan.A.title).toBe('Atual');
    expect(result.plan['A (importado)'].title).toBe('Importado');
    expect(result.plan.B.title).toBe('Novo');
  });

  it('substitui somente após escolha explícita', () => {
    const result = mergeImportedWorkoutPlan(existing, imported, 'replace');
    expect(result.plan.A.title).toBe('Importado');
  });
});
