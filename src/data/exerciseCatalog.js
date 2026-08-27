export const EXERCISE_CATALOG = Object.freeze({
  Peito: ['Supino Reto (Barra)', 'Supino Reto (Halter)', 'Supino Inclinado (Barra)', 'Supino Inclinado (Halter)', 'Crucifixo no Crossover', 'Crucifixo (Halter)', 'Voador (Peck Deck)', 'Flexão de Braço', 'Pullover', 'Crossover Polia Alta', 'Crossover Polia Baixa', 'Supino Declinado'],
  Costas: ['Puxada Frontal (Pulley)', 'Puxada Triângulo', 'Remada Curvada', 'Remada Máquina', 'Remada Baixa', 'Remada Unilateral (Serrote)', 'Remada Cavalinho', 'Pull-down', 'Barra Fixa', 'Levantamento Terra'],
  Pernas: ['Agachamento Livre', 'Agachamento Hack', 'Agachamento Búlgaro', 'Leg Press 45º', 'Leg Press Horizontal', 'Cadeira Extensora', 'Mesa Flexora', 'Cadeira Flexora', 'Stiff', 'Levantamento Terra Romeno (RDL)', 'Elevação Pélvica', 'Cadeira Abdutora', 'Cadeira Adutora', 'Panturrilha em Pé', 'Panturrilha Sentado'],
  Ombros: ['Desenvolvimento (Barra)', 'Desenvolvimento (Halter)', 'Desenvolvimento Máquina', 'Elevação Lateral (Halter)', 'Elevação Lateral (Polia)', 'Elevação Frontal', 'Encolhimento', 'Crucifixo Invertido', 'Face Pull'],
  Braços: ['Rosca Direta (Barra)', 'Rosca Alternada (Halter)', 'Rosca Martelo', 'Rosca Scott', 'Rosca na Polia', 'Tríceps Pulley (Barra)', 'Tríceps Pulley (Corda)', 'Tríceps Testa', 'Tríceps Francês', 'Tríceps Coice', 'Mergulho (Paralelas)'],
  Core: ['Prancha Isométrica', 'Abdominal Supra', 'Abdominal Infra', 'Abdominal Infra na Barra', 'Giro Russo (Russian Twist)', 'Abdominal Máquina', 'Roda Abdominal'],
  Cardio: ['Esteira', 'Bicicleta Ergométrica', 'Bicicleta Spinning', 'Elíptico', 'Escada', 'Pular Corda', 'Remo Seco', 'Corrida Livre'],
});

export const ALL_EXERCISES = Object.freeze([...new Set(Object.values(EXERCISE_CATALOG).flat())]);

export const normalizeExerciseSearch = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .trim();

export const filterExerciseCatalog = (query, exercises = ALL_EXERCISES) => {
  const normalized = normalizeExerciseSearch(query);
  return exercises.filter((exercise) => normalizeExerciseSearch(exercise).includes(normalized));
};
