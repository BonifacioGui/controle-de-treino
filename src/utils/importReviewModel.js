import { inferLegacyLoadMode } from './loadModel';

const normalizeForComparison = (value) => String(value || '')
  .toLocaleLowerCase('pt-BR')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const annotateImportedWorkout = (data, sourceText = '', { sourceKind = 'text' } = {}) => {
  const normalizedSource = normalizeForComparison(sourceText);
  const sourceNeedsManualReview = sourceKind === 'pdf' && !normalizedSource;

  return Object.fromEntries(Object.entries(data).map(([key, day]) => [key, {
    ...day,
    exercises: (day.exercises || []).map((exercise) => {
      const normalizedName = normalizeForComparison(exercise?.name);
      const absentFromText = Boolean(
        normalizedSource
        && normalizedName
        && !normalizedSource.includes(normalizedName),
      );
      const missingRequiredField = !exercise?.name?.trim?.()
        || !String(exercise?.sets || '').trim();
      const uncertain = exercise?.uncertain === true
        || sourceNeedsManualReview
        || absentFromText
        || missingRequiredField;
      return {
        ...exercise,
        loadMode: exercise?.loadMode || inferLegacyLoadMode(exercise),
        uncertain,
        reviewReason: exercise?.reviewReason
          || (sourceNeedsManualReview ? 'Confirme este item comparando com o PDF original.' : '')
          || (absentFromText ? 'Nome não localizado literalmente na ficha original.' : '')
          || (missingRequiredField ? 'Nome ou séries não foram identificados.' : ''),
      };
    }),
  }]));
};

