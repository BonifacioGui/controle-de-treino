import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { ALL_EXERCISES, filterExerciseCatalog, normalizeExerciseSearch } from '../../data/exerciseCatalog';

const ExerciseSearchModal = ({ exercises = ALL_EXERCISES, onSelect, onClose, allowCustom = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredExercises = filterExerciseCatalog(searchTerm, exercises);
  const normalizedTerm = normalizeExerciseSearch(searchTerm);
  const exactMatch = exercises.some((exercise) => normalizeExerciseSearch(exercise) === normalizedTerm);
  const selectExercise = (exercise) => {
    onSelect(exercise);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-search-title"
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-input/50 p-4">
          <div><h3 id="exercise-search-title" className="text-sm font-black text-main">Buscar exercício</h3><p className="mt-1 text-xs text-muted">Catálogo SOLO e exercício personalizado</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar busca" className="touch-target flex items-center justify-center rounded-xl text-muted hover:text-main">
            <X size={20} />
          </button>
        </div>

        <div className="relative p-3">
          <Search className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="search"
            aria-label="Buscar no catálogo de exercícios"
            placeholder="Ex.: Remada Baixa"
            className="h-12 w-full rounded-xl border border-border bg-input pl-11 pr-3 text-sm font-bold text-main outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {allowCustom && normalizedTerm && !exactMatch && (
            <button type="button" onClick={() => selectExercise(searchTerm.trim())} className="mb-2 min-h-12 w-full rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 text-left text-sm font-black text-primary">
              Usar “{searchTerm.trim()}”
            </button>
          )}
          {filteredExercises.map((exercise) => (
            <button
              type="button"
              key={exercise}
              onClick={() => selectExercise(exercise)}
              className="min-h-12 w-full rounded-xl px-4 text-left text-sm font-bold text-main transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {exercise}
            </button>
          ))}
          {filteredExercises.length === 0 && !normalizedTerm && (
            <p className="p-5 text-center text-sm text-muted">Digite para buscar no catálogo.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseSearchModal;
