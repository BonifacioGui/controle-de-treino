export const toggleExpandedExerciseId = (expandedId, selectedId) => (
  expandedId === selectedId ? null : selectedId
);

export const getNextExpandedExerciseId = ({ expandedId, previousCurrentId, nextCurrentId }) => {
  if (!nextCurrentId) return expandedId;
  if (!expandedId || expandedId === previousCurrentId) return nextCurrentId;
  return expandedId;
};
