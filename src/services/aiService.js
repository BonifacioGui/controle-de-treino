import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY não configurada");
}

const genAI = new GoogleGenerativeAI(apiKey);

class AIError extends Error {
  constructor(message, type = "UNKNOWN") {
    super(message);
    this.type = type;
  }
}

const cache = new Map();

const SYSTEM_PROMPT_SMART = `Você é um especialista em musculação e um decodificador de treinos.

Corrija e melhore o treino:
- Normalize nomes
- Complete séries (ex: 3x10, TEMPO, etc)
- Defina o foco muscular da sessão (ex: Peito, Costas, Perna, etc)
- EXTRAÇÃO DE VARIÁVEL: Se o usuário colocar um "ou", barra (/) ou especificar uma segunda opção entre parênteses para um exercício, remova isso do nome principal e adicione no array "alternatives".

Retorne JSON válido e EXATAMENTE no formato abaixo:
{
  "A": {
    "title": "TREINO A",
    "focus": "Grupo muscular",
    "exercises": [
      { 
        "name": "Supino Reto (Barra)", 
        "sets": "3x10", 
        "note": "",
        "alternatives": ["Supino Reto (Halter)"]
      }
    ]
  }
}`;

const SYSTEM_PROMPT_RAW = `Converta exatamente o texto para JSON sem modificar conteúdo.`;

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new AIError("Erro ao interpretar resposta da IA", "INVALID_JSON");
  }
}

function validate(data) {
  if (!data || typeof data !== "object") {
    throw new AIError("Formato inválido", "INVALID_FORMAT");
  }
  return data;
}

async function retry(fn, times = 2) {
  let last;
  for (let i = 0; i <= times; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export const parseWorkoutWithAI = async (rawText, file, autoFix = true) => {
  const key = JSON.stringify({ rawText, autoFix });

  if (cache.has(key)) return cache.get(key);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const prompt = autoFix ? SYSTEM_PROMPT_SMART : SYSTEM_PROMPT_RAW;

    const run = async () => {
      const result = await model.generateContent([
        prompt,
        `TREINO:\n${rawText}`,
      ]);

      const text = result.response.text();
      const parsed = safeJsonParse(text);

      return validate(parsed);
    };

    const final = await retry(run, 2);

    cache.set(key, final);
    return final;

  } catch (err) {
    if (err instanceof AIError) throw err;

    if (err.message.includes("fetch")) {
      throw new AIError("Erro de conexão com IA", "API_ERROR");
    }

    throw new AIError("Erro inesperado", "UNKNOWN");
  }
};