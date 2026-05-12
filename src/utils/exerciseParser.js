// src/utils/exerciseParser.js

export const getCanonicalName = (rawName) => {
  if (!rawName) return "";

  // Lê a string inteira para não perder detalhes da pegada (ex: Barra H)
  const lower = rawName.toLowerCase()
                     .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                     .trim();

  // Ferramentas de busca
  const has = (word) => lower.includes(word);
  const hasExact = (word) => new RegExp(`\\b${word}\\b`).test(lower);

  // ==========================================
  // 🏆 MOTOR DE REGRAS DO MVP (RULE ENGINE)
  // ==========================================
  // Ordem de prioridade: do mais específico para o mais geral.
  const rules = [
    // --- COSTAS ---
    { check: () => has("puxada") && (has("triangulo") || hasExact("v")), name: "Puxada Triângulo" },
    { check: () => has("puxada") && (has("barra h") || hasExact("h") || has("romana")), name: "Puxada Barra H" },
    { check: () => has("puxada") && (has("supinada") || has("inversa")), name: "Puxada Supinada" },
    { check: () => has("puxada") && (has("articulada") || has("maquina")), name: "Puxada Máquina" },
    { check: () => has("puxada") || has("pulldown"), name: "Puxada Frontal" },

    { check: () => has("remada") && (has("baixa") || has("polia") || has("cabo")), name: "Remada Baixa" },
    { check: () => has("remada") && has("curvada") && has("supinada"), name: "Remada Curvada Supinada" },
    { check: () => has("remada") && has("curvada"), name: "Remada Curvada" },
    { check: () => has("remada") && (has("cavalo") || hasExact("t")), name: "Remada Cavalinho" },
    { check: () => has("remada") && (has("maquina") || has("articulada")), name: "Remada Máquina" },
    { check: () => hasExact("unilateral") || has("serrote"), name: "Serrote" },

    // --- PEITO ---
    { check: () => has("supino") && has("inclinado") && has("halter"), name: "Supino Inclinado Halteres" },
    { check: () => has("supino") && has("inclinado"), name: "Supino Inclinado" },
    { check: () => has("supino") && has("declinado"), name: "Supino Declinado" },
    { check: () => has("supino") && (has("maquina") || has("articulado")), name: "Supino Máquina" },
    { check: () => has("supino") && has("reto") && has("halter"), name: "Supino Reto Halteres" },
    { check: () => has("supino"), name: "Supino Reto" },

    { check: () => has("crucifixo") && has("inverso"), name: "Crucifixo Inverso" },
    { check: () => has("crucifixo") && has("inclinado"), name: "Crucifixo Inclinado" },
    { check: () => has("peck") || has("voador") || (has("crucifixo") && has("maquina")), name: "Peck Deck" },
    { check: () => has("crucifixo"), name: "Crucifixo Reto" },
    { check: () => has("crossover") || (has("cross") && has("over")), name: "Crossover" },

    // --- OMBROS ---
    { check: () => (has("elevacao") || hasExact("elev")) && hasExact("lateral") && (has("cabo") || has("polia")), name: "Elevação Lateral Polia" },
    { check: () => (has("elevacao") || hasExact("elev")) && hasExact("lateral"), name: "Elevação Lateral" },
    { check: () => (has("elevacao") || hasExact("elev")) && hasExact("frontal"), name: "Elevação Frontal" },
    
    { check: () => has("desenvolvimento") && (has("maquina") || has("articulado")), name: "Desenvolvimento Máquina" },
    { check: () => has("desenvolvimento") && has("halter"), name: "Desenvolvimento Halteres" },
    { check: () => has("desenvolvimento"), name: "Desenvolvimento" },
    { check: () => has("face") && has("pull"), name: "Face Pull" },

    // --- TRÍCEPS ---
    { check: () => has("triceps") && has("testa") && (has("polia") || has("cabo")), name: "Tríceps Testa Polia" },
    { check: () => has("triceps") && has("testa"), name: "Tríceps Testa" },
    { check: () => has("triceps") && has("frances") && (has("polia") || has("cabo")), name: "Tríceps Francês Polia" },
    { check: () => has("triceps") && has("frances"), name: "Tríceps Francês" },
    { check: () => has("triceps") && has("corda"), name: "Tríceps Corda" },
    { check: () => has("triceps") && has("coice"), name: "Tríceps Coice" },
    { check: () => has("triceps") && (has("pulley") || has("polia") || has("barra")), name: "Tríceps Pulley" },

    // --- BÍCEPS ---
    { check: () => has("rosca") && has("martelo") && (has("polia") || has("cabo")), name: "Rosca Martelo Polia" },
    { check: () => has("rosca") && has("martelo"), name: "Rosca Martelo" },
    { check: () => has("rosca") && has("scott"), name: "Rosca Scott" },
    { check: () => has("rosca") && (has("45") || has("inclinada")), name: "Rosca 45º" },
    { check: () => has("rosca") && (has("inversa") || has("pronada")), name: "Rosca Inversa" },
    { check: () => has("rosca") && has("alternada"), name: "Rosca Alternada" },
    { check: () => has("rosca") && has("direta") && (has("polia") || has("cabo")), name: "Rosca Direta Polia" },
    { check: () => has("rosca") && has("direta"), name: "Rosca Direta" },

    // --- PERNAS & GLÚTEOS ---
    { check: () => has("leg") && has("45"), name: "Leg Press 45º" },
    { check: () => has("leg") && hasExact("unilateral"), name: "Leg Press Unilateral" },
    { check: () => has("leg"), name: "Leg Press" },
    
    { check: () => hasExact("hack") && has("reverso"), name: "Agachamento Hack Reverso" },
    { check: () => hasExact("hack"), name: "Agachamento Hack" },
    
    { check: () => has("extensora") && hasExact("unilateral"), name: "Cadeira Extensora Unilateral" },
    { check: () => has("extensora"), name: "Cadeira Extensora" },
    
    { check: () => has("flexora") && (has("mesa") || has("deitada")), name: "Mesa Flexora" },
    { check: () => has("flexora") && (has("cadeira") || has("sentada")), name: "Cadeira Flexora" },
    { check: () => has("flexora"), name: "Flexora" },
    
    { check: () => has("abdu"), name: "Cadeira Abdutora" },
    { check: () => has("adu"), name: "Cadeira Adutora" },
    { check: () => has("elevacao") && has("pelvica"), name: "Elevação Pélvica" },
    
    { check: () => (has("panturrilha") || has("gemeos")) && (has("sentado") || has("banco")), name: "Panturrilha Sentado" },
    { check: () => (has("panturrilha") || has("gemeos")) && (has("pe") || has("em pe")), name: "Panturrilha em Pé" },
    { check: () => has("panturrilha") || has("gemeos"), name: "Panturrilha" },

    { check: () => has("agachamento") && has("bulgaro"), name: "Agachamento Búlgaro" },
    { check: () => has("agachamento") && has("smith"), name: "Agachamento Smith" },
    { check: () => has("agachamento") && has("sumo"), name: "Agachamento Sumô" },
    { check: () => has("agachamento"), name: "Agachamento Livre" },
    
    { check: () => (has("terra") || has("deadlift")) && has("sumo"), name: "Levantamento Terra Sumô" },
    { check: () => has("terra") || has("deadlift"), name: "Levantamento Terra" },
    { check: () => has("stiff"), name: "Stiff" }
  ];

  // Executa o motor: a primeira regra que der "match" vence.
  for (const rule of rules) {
    if (rule.check()) {
      return rule.name;
    }
  }

  // ==========================================
  // 🚀 FALLBACK INTELIGENTE (Tratamento de Exceções)
  // ==========================================
  // Se for algo muito diferente que não está nas regras, limpamos 
  // anotações extras e capitalizamos as palavras para a UI não quebrar.
  let cleanFallback = rawName.split('(')[0].split('-')[0].trim();
  
  return cleanFallback
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Função para agrupar exercícios no mapa de calor
export const getMuscleGroup = (n) => {
  const c = n.toLowerCase();
  if (/supino|crucifixo|peck|deck|cross/i.test(c)) return 'PEITO';
  if (/remada|puxada|serrote|pull|terra/i.test(c)) return 'COSTAS';
  if (/leg|agacha|exten|flexo|stiff|pelvi|pantu|abdu|adut/i.test(c)) return 'PERNAS';
  if (/rosca|trice/i.test(c)) return 'BRAÇOS';
  if (/desenv|lateral|frontal|face|encolhi/i.test(c)) return 'OMBROS';
  return /abdom|prancha|vacuum|core/i.test(c) ? 'CORE' : 'OUTROS';
};