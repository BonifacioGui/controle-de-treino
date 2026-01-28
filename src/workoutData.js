// src/workoutData.js
export const initialWorkoutData = {
  SEG: {
    title: "Push Day",
    focus: "Peito, Ombro e Tríceps",
    exercises: [
      { name: "Supino Reto (Barra)", sets: "3x10", target: "19kg", note: "Foco no Pectus" },
      { name: "Supino Inclinado (Halter)", sets: "3x10", target: "18kg", note: "Controlar descida" },
      { name: "Crossover Polia Alta", sets: "3x12", target: "Máximo", note: "Escápulas fixas" },
      { name: "Elevação Lateral", sets: "3x12", target: "8kg", note: "Braços à frente" },
      { name: "Desenvolvimento Neutro", sets: "3x10", target: "8kg", note: "Pegada estável" },
      { name: "Tríceps Francês (Corda)", sets: "3x10", target: "26kg", note: "Volume" },
      { name: "Tríceps na Polia (Corda)", sets: "3x12", target: "28kg", note: "Extensão total" },
    ]
  },
  TER: {
    title: "Legs 1 (The Foundation)",
    focus: "Quadríceps e Core",
    exercises: [
      { name: "Agachamento Isométrico", sets: "2x30s", target: "Corpo", note: "Pausa total" },
      { name: "Leg Press 45 (Pés Afastados)", sets: "3x12", target: "Pés Afastados", note: "Quadril colado" },
      { name: "Agachamento Hack", sets: "3x10", target: "20kg/lado", note: "Explosão" },
      { name: "Cadeira Extensora", sets: "3x15", target: "Esmagar", note: "Pico 1s" },
      { name: "Elevação de Quadril", sets: "3x12", target: "Controle", note: "Foco Glúteo" },
      { name: "Prancha Isométrica", sets: "3x45s", target: "Estático", note: "Abdômen contraído" },
      { name: "Stomach Vacuum", sets: "4x30s", target: "98cm", note: "Vácuo total" },
    ]
  },
  QUA: {
    title: "PULL (Anti-Cifose Patch)",
    focus: "Costas, Posterior de Ombro e Bíceps",
    exercises: [
      { name: "Crucifixo Inverso (Halter)", sets: "3x12", target: "Halter", note: "Substituto da bosta" },
      { name: "Puxada Neutra (Barra W)", sets: "3x10", target: "Barra W", note: "Cotovelos fechados" },
      { name: "Remada Baixa (Neutra)", sets: "3x10", target: "50kg", note: "Meta batida" },
      { name: "Remada Unilateral (Serrote)", sets: "3x10", target: "Halter", note: "Tronco paralelo" },
      { name: "Face Pull", sets: "3x15", target: "Corda", note: "Foco deltoide post." },
      { name: "Rosca Direta (Barra W)", sets: "3x10", target: "Barra W", note: "Sem balanço" },
      { name: "Rosca Martelo Isométrica", sets: "3x10", target: "Halter", note: "Sustentar 2s no topo" },
    ]
  },
  QUI: {
    title: "Arm & Shoulder (Estética)",
    focus: "Deltoides e Braços",
    exercises: [
      { name: "Elevação Lateral", sets: "4x15", target: "Halter", note: "Foco em ombros largos" },
      { name: "Crucifixo Inverso (Halter)", sets: "3x12", target: "Postural", note: "Combate a Cifose" },
      { name: "Rosca Incline (Banco 45º)", sets: "3x10", target: "Banco 45º", note: "Alonga cabeça longa" },
      { name: "Tríceps Testa (Halter/Barra)", sets: "3x10", target: "Volume", note: "Volume lateral do braço" },
      { name: "Rosca Alternada", sets: "3x10", target: "Giro Punho", note: "Pico do bíceps" },
      { name: "Tríceps Pulley (Barra Reta)", sets: "3x12", target: "Contração", note: "Foco em contração total" },
    ]
  },
  SEX: {
    title: "Legs 2 (Posterior & Glúteo)",
    focus: "Posterior, Glúteo e Panturrilha",
    exercises: [
      { name: "Mesa Flexora Unilateral", sets: "3x10", target: "Controle", note: "Foco na descida lenta" },
      { name: "Stiff com Halteres", sets: "3x10", target: "Halter", note: "Coluna reta / Alongar posterior" },
      { name: "Elevação de Quadril", sets: "3x10", target: "Carga Máxima", note: "O Rei do Glúteo" },
      { name: "Abdução de Quadril (Máq)", sets: "3x12", target: "Máquina", note: "Estabilização da bacia" },
      { name: "Panturrilha Sentado", sets: "4x15", target: "Lento", note: "Movimento completo" },
      { name: "Prancha Lateral Baixa", sets: "3x45s", target: "45 segundos", note: "Foco nos oblíquos" },
      { name: "Stomach Vacuum", sets: "4x30s", target: "Linha de Cintura", note: "Patch diário anti-dilatação" },
    ]
  },
  SAB: {
    title: "Cardio & Core",
    focus: "Resistência",
    exercises: [
      { name: "Caminhada Inclinada", sets: "40 min", target: "Velo 5.5", note: "FC 130bpm" },
      { name: "Prancha Abdominal", sets: "3x60s", target: "Estático", note: "Core rígido" },
      { name: "Abdominal Infra", sets: "3x20", target: "Lento", note: "Controlar descida" },
    ]
  }
};