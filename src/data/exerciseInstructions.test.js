import { describe, expect, it } from 'vitest';
import { ALL_EXERCISES } from './exerciseCatalog';
import { EXERCISE_INSTRUCTIONS, getExerciseInstructions } from './exerciseInstructions';

const REQUIRED_TEXT_FIELDS = ['position', 'execution', 'breathing'];

describe('guias de execução dos exercícios', () => {
  it('cobre explicitamente todos os exercícios do catálogo', () => {
    expect(Object.keys(EXERCISE_INSTRUCTIONS)).toHaveLength(ALL_EXERCISES.length);

    ALL_EXERCISES.forEach((exerciseName) => {
      const guide = EXERCISE_INSTRUCTIONS[exerciseName];
      expect(guide, `guia ausente para ${exerciseName}`).toBeDefined();
      expect(guide.exerciseName).toBe(exerciseName);
      expect(guide.source).toBe('catalog');
      REQUIRED_TEXT_FIELDS.forEach((field) => expect(guide[field].length).toBeGreaterThan(30));
      expect(guide.errors).toHaveLength(3);
      expect(guide.muscles.length).toBeGreaterThan(0);
      expect(guide.cues).toHaveLength(3);
    });
  });

  it('resolve nomes do catálogo ignorando acentos, caixa e espaços externos', () => {
    const guide = getExerciseInstructions('  ELEVACAO PELVICA  ');
    expect(guide.exerciseName).toBe('Elevação Pélvica');
    expect(guide.muscles).toContain('Glúteo máximo');
  });

  it('reconhece variações comuns sem confundi-las com uma entrada oficial', () => {
    const guide = getExerciseInstructions('Supino reto com pausa');
    expect(guide.source).toBe('variation');
    expect(guide.category).toBe('Variação reconhecida');
    expect(guide.muscles).toContain('Peitoral maior');
    expect(getExerciseInstructions('Roda abdominal ajoelhado').cues).toContain('Corpo avança em bloco');
  });

  it('mantém distintos movimentos que têm nomes parecidos', () => {
    expect(getExerciseInstructions('Pull-down').cues).not.toEqual(
      getExerciseInstructions('Puxada Frontal (Pulley)').cues,
    );
    expect(getExerciseInstructions('Abdominal Infra').position).not.toBe(
      getExerciseInstructions('Abdominal Infra na Barra').position,
    );
    expect(getExerciseInstructions('Cadeira Abdutora').muscles).not.toEqual(
      getExerciseInstructions('Cadeira Adutora').muscles,
    );
  });

  it('entrega instruções seguras para um exercício personalizado desconhecido', () => {
    const guide = getExerciseInstructions('Meu exercício novo');
    expect(guide.source).toBe('fallback');
    expect(guide.exerciseName).toBe('Meu exercício novo');
    expect(guide.cues).toEqual([
      'Prepare a postura',
      'Execute com controle',
      'Pare antes de perder a técnica',
    ]);
  });

  it('também aceita nome vazio sem quebrar a interface', () => {
    expect(getExerciseInstructions(null)).toMatchObject({
      exerciseName: 'Exercício personalizado',
      source: 'fallback',
    });
  });
});
