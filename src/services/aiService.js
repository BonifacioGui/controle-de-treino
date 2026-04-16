import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY não configurada");
}

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `Você é um robô extrator de dados. Converta o treino abaixo ESTRITAMENTE para um objeto JSON.

NÃO use blocos de código. NÃO explique nada. Retorne apenas JSON válido.

Formato obrigatório:
{
  "A": {
    "title": "TREINO A",
    "focus": "Foco do dia",
    "exercises": [
      { "name": "Nome", "sets": "3x10", "note": "Notas" }
    ]
  }
}
`;

// 🔧 Converte arquivo → formato Gemini
async function fileToGenerativePart(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64,
      mimeType: file.type,
    },
  };
}

// 🧠 Validação forte do JSON
function validateWorkoutJson(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Resposta não é um objeto JSON");
  }

  for (const key of Object.keys(data)) {
    const treino = data[key];

    if (!treino.title || !treino.exercises) {
      throw new Error("Formato inválido: faltando campos");
    }

    if (!Array.isArray(treino.exercises)) {
      throw new Error("Exercises deve ser um array");
    }

    treino.exercises.forEach((ex, i) => {
      if (!ex.name || !ex.sets) {
        throw new Error(`Exercício inválido na posição ${i}`);
      }
    });
  }

  return data;
}

// 🔁 Fallback (caso IA retorne lixo)
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    // tentativa de recuperação
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.substring(start, end + 1));
    }

    throw new Error("Não foi possível extrair JSON");
  }
}

// 🚀 Função principal
export const parseWorkoutWithAI = async (rawText, file = null) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // mais determinístico
      },
    });

    const parts = [SYSTEM_PROMPT];

    if (rawText) {
      parts.push(`\n[TREINO]:\n${rawText}`);
    }

    if (file) {
      parts.push(await fileToGenerativePart(file));
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    const parsed = safeJsonParse(text);

    return validateWorkoutJson(parsed);

  } catch (error) {
    console.error("Erro na IA:", error);

    throw new Error(
      "Falha ao processar treino. Verifique o formato ou tente novamente."
    );
  }
};