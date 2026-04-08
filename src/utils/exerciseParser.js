// Função para padronizar nomes de exercícios e evitar duplicações no banco de dados
export const getCanonicalName = (rawName) => {
  if (!rawName) return "";
  let clean = rawName.split('(')[0].trim();
  const lower = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); 

  if (lower.includes("desenv")) return "Desenvolvimento";
  if (lower.includes("lateral")) return "Elevação Lateral";
  if (lower.includes("frontal")) return "Elevação Frontal";
  if (lower.includes("facepull") || (lower.includes("face") && lower.includes("pull"))) return "Face Pull";

  if (lower.includes("abdu")) return "Cadeira Abdutora";
  if (lower.includes("adut")) return "Cadeira Adutora";
  if (lower.includes("leg") && lower.includes("45")) return "Leg Press 45º";
  if (lower.includes("leg")) return "Leg Press";
  if (lower.includes("hack")) return "Agachamento Hack";
  if (lower.includes("extensora")) return "Cadeira Extensora";
  if (lower.includes("flexora")) return "Mesa Flexora";
  if (lower.includes("panturrilha") || lower.includes("gemeos")) return "Panturrilha";

  if (lower.includes("triceps")) {
      if (lower.includes("testa")) return "Tríceps Testa";
      if (lower.includes("frances")) return "Tríceps Francês";
      return "Tríceps Corda"; 
  }
  if (lower.includes("rosca")) {
      if (lower.includes("martelo")) return "Rosca Martelo";
      if (lower.includes("45") || lower.includes("inclinada")) return "Rosca 45º";
      return "Rosca Direta";
  }

  if (lower.includes("supino")) {
      if (lower.includes("inclinado")) return "Supino Inclinado";
      return "Supino Reto";
  }
  if (lower.includes("crossover") || (lower.includes("cross") && lower.includes("over"))) return "Crossover";

  if (lower.includes("puxada")) return "Puxada Frontal";
  if (lower.includes("remada")) {
      if (lower.includes("baixa") || lower.includes("triangulo")) return "Remada Baixa";
      if (lower.includes("unilateral") || lower.includes("serrote")) return "Serrote";
      return "Remada";
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
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