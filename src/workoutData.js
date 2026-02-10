// src/workoutData.js
export const initialWorkoutData = {
  SEG: {
    title: "Push Day",
    focus: "Peito, Ombro e Tríceps",
    exercises: [
      { name: "Supino Reto", sets: "3x10", target: "19kg", note: "Controle total" },
      { name: "Supino Inclinado", sets: "3x10", target: "18kg", note: "Controlar descida" },
      { name: "Crossover", sets: "3x12", target: "Máximo", note: "Escápulas fixas" },
      { name: "Elevação Lateral", sets: "3x12", target: "8kg", note: "Braços à frente" },
      { name: "Desenvolvimento", sets: "3x10", target: "8kg", note: "Pegada estável" },
      { name: "Tríceps Francês", sets: "3x10", target: "26kg", note: "Volume" },
      { name: "Tríceps Corda", sets: "3x12", target: "28kg", note: "Extensão total" },
    ]
  },
  TER: {
    title: "PULL",
    focus: "Costas, Posterior de Ombro e Bíceps",
    exercises: [
      { name: "Crucifixo Inverso", sets: "3x12", target: "Postural", note: "Controle" },
      { name: "Puxada Neutra", sets: "3x10", target: "Barra W", note: "Cotovelos fechados" },
      { name: "Remada Baixa", sets: "3x10", target: "50kg", note: "Trazer no umbigo" },
      { name: "Serrote", sets: "3x10", target: "Halter", note: "Tronco paralelo" },
      { name: "Face Pull", sets: "3x15", target: "Corda", note: "Foco deltoide post." },
      { name: "Rosca Direta", sets: "3x10", target: "Barra W", note: "Sem balanço" },
      { name: "Rosca Martelo", sets: "3x10", target: "Halter", note: "Sustentar 2s no topo" },
    ]
  },
  QUA: {
    title: "Legs 1",
    focus: "Quadríceps e Core",
    exercises: [
      { name: "Agachamento Isométrico", sets: "2x30s", target: "Corpo", note: "Pausa total" },
      { name: "Leg Press", sets: "3x12", target: "Pés Afastados", note: "Quadril colado" },
      { name: "Agachamento Hack", sets: "3x10", target: "20kg/lado", note: "Explosão" },
      { name: "Cadeira Extensora", sets: "3x15", target: "Esmagar", note: "Pico 1s" },
      { name: "Elevação Pélvica", sets: "3x12", target: "Controle", note: "Contração máxima" },
      { name: "Prancha", sets: "3x45s", target: "Estático", note: "Abdômen contraído" },
      { name: "Vacuum", sets: "4x30s", target: "98cm", note: "Vácuo total" },
    ]
  },
  QUI: {
    title: "Arm & Shoulder",
    focus: "Deltoides e Braços",
    exercises: [
      { name: "Elevação Lateral", sets: "4x15", target: "Halter", note: "Foco em ombros largos" },
      { name: "Crucifixo Inverso", sets: "3x12", target: "Postural", note: "Controle" },
      { name: "Rosca 45º", sets: "3x10", target: "Banco 45º", note: "Alonga cabeça longa" },
      { name: "Tríceps Testa", sets: "3x10", target: "Volume", note: "Volume lateral do braço" },
      { name: "Rosca Alternada", sets: "3x10", target: "Giro Punho", note: "Pico do bíceps" },
      { name: "Tríceps Pulley", sets: "3x12", target: "Contração", note: "Foco em contração total" },
    ]
  },
  SEX: {
    title: "Legs 2",
    focus: "Posterior e Panturrilha",
    exercises: [
      { name: "Mesa Flexora", sets: "3x10", target: "Controle", note: "Foco na descida lenta" },
      { name: "Stiff", sets: "3x10", target: "Halter", note: "Coluna reta / Alongar posterior" },
      { name: "Elevação Pélvica", sets: "3x10", target: "Carga Máxima", note: "Contração de pico" },
      { name: "Cadeira Abdutora", sets: "3x12", target: "Máquina", note: "Estabilização" },
      { name: "Panturrilha", sets: "4x15", target: "Lento", note: "Movimento completo" },
      { name: "Prancha Lateral", sets: "3x45s", target: "45 segundos", note: "Foco nos oblíquos" },
      { name: "Vacuum", sets: "4x30s", target: "Linha de Cintura", note: "Prática diária" },
    ]
  },
  SAB: {
    title: "Cardio & Core",
    focus: "Resistência",
    exercises: [
      { name: "Caminhada", sets: "40 min", target: "Velo 5.5", note: "FC 130bpm" },
      { name: "Prancha", sets: "3x60s", target: "Estático", note: "Core rígido" },
      { name: "Abdominal Infra", sets: "3x20", target: "Lento", note: "Controlar descida" },
    ]
  }
};