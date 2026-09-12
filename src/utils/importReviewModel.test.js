import { describe, expect, it } from 'vitest';
import { annotateImportedWorkout } from './importReviewModel';

const plan = {
  A: {
    title: 'Peito',
    exercises: [{ name: 'Supino reto', sets: '3x10' }],
  },
};

describe('revisão obrigatória da importação', () => {
  it('aceita um item encontrado literalmente no texto e define o modo de carga', () => {
    const result = annotateImportedWorkout(plan, 'Treino A: Supino reto 3x10');
    expect(result.A.exercises[0]).toMatchObject({ uncertain: false, loadMode: 'total' });
  });

  it('marca um nome não localizado para confirmação manual', () => {
    const result = annotateImportedWorkout(plan, 'Treino A: Crucifixo 3x10');
    expect(result.A.exercises[0]).toMatchObject({
      uncertain: true,
      reviewReason: 'Nome não localizado literalmente na ficha original.',
    });
  });

  it('exige confirmação de itens extraídos de PDF quando o texto-fonte não está disponível', () => {
    const result = annotateImportedWorkout(plan, '', { sourceKind: 'pdf' });
    expect(result.A.exercises[0]).toMatchObject({
      uncertain: true,
      reviewReason: 'Confirme este item comparando com o PDF original.',
    });
  });
});

