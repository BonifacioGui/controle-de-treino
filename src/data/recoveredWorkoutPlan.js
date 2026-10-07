import { LOAD_MODES } from '../utils/loadModel';

export const RECOVERED_PLAN_EVIDENCE = Object.freeze({
  source: 'Histórico sincronizado do usuário e ficha confirmada na solicitação',
  recoveredAt: '2026-10-02',
  note: 'Metas recuperadas são valores iniciais editáveis.',
});

export const RECOVERED_WORKOUT_PLAN = Object.freeze({
  A: {
    title: 'TREINO A',
    focus: 'PEITO, OMBROS E TRÍCEPS',
    exercises: [
      { name: 'Supino Reto', sets: '3x10-12', alternatives: [], loadMode: LOAD_MODES.total },
      { name: 'Supino Inclinado com Barra', sets: '3x12-15', alternatives: ['Supino Inclinado com Halteres', 'Supino Inclinado (máquina)'], loadMode: LOAD_MODES.total },
      { name: 'Crossover na Polia Alta', sets: '3x10-12', alternatives: ['Peck Deck'], loadMode: LOAD_MODES.machine },
      { name: 'Tríceps Pulley com Corda', sets: '3x12-15', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Tríceps Testa Unilateral', sets: '3x12-15', alternatives: ['Tríceps Francês'], loadMode: LOAD_MODES.perHand },
      { name: 'Elevação Lateral', sets: '3x10-12', alternatives: [], loadMode: LOAD_MODES.perHand },
      { name: 'Desenvolvimento', sets: '3x12', alternatives: [], loadMode: LOAD_MODES.perHand },
    ],
  },
  B: {
    title: 'TREINO B',
    focus: 'COSTAS E BÍCEPS',
    exercises: [
      { name: 'Puxada Alta com Barra H', sets: '3x10-12', alternatives: ['Puxada Alta'], loadMode: LOAD_MODES.machine },
      { name: 'Remada Baixa Sentado', sets: '3x10-12', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Remada Unilateral com Halter (Serrote)', sets: '3x10-12', alternatives: [], loadMode: LOAD_MODES.perHand },
      { name: 'Rosca Direta com Halteres', sets: '3x10-12', alternatives: ['Rosca Direta com Barra'], loadMode: LOAD_MODES.perHand },
      { name: 'Rosca Martelo', sets: '4x12-15', alternatives: ['Rosca 45°'], loadMode: LOAD_MODES.perHand },
      { name: 'Face Pull', sets: '4x10-15', alternatives: [], loadMode: LOAD_MODES.machine },
    ],
  },
  C: {
    title: 'TREINO C',
    focus: 'PERNAS',
    exercises: [
      { name: 'Agachamento Hack', sets: '3x8-12', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Leg Press Horizontal', sets: '3x8-12', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Cadeira Flexora', sets: '3x10-15', alternatives: ['Mesa Flexora'], loadMode: LOAD_MODES.machine },
      { name: 'Cadeira Extensora', sets: '2x10-15', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Cadeira Abdutora', sets: '2x12-20', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Cadeira Adutora', sets: '2x12-20', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Panturrilha Sentada', sets: '3x12-15', alternatives: [], loadMode: LOAD_MODES.machine },
      { name: 'Prancha', sets: '3x30-60 s', alternatives: [], loadMode: LOAD_MODES.bodyweight },
      { name: 'Cardio Leve/Moderado', sets: '1x15-20 min', alternatives: [], loadMode: LOAD_MODES.duration },
    ],
  },
});

export const createRecoveredWorkoutPlan = () => JSON.parse(JSON.stringify(RECOVERED_WORKOUT_PLAN));
