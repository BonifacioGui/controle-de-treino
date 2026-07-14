import { supabase } from "./supabaseClient";

class AIError extends Error {
  constructor(message, type = "UNKNOWN") {
    super(message);
    this.name = "AIError";
    this.type = type;
  }
}

const cache = new Map();

function createCacheKey(rawText, file, autoFix) {
  const fileSignature = file
    ? `${file.name}:${file.size}:${file.lastModified}`
    : "sem-arquivo";

  return JSON.stringify({
    rawText,
    fileSignature,
    autoFix,
  });
}

function validateWorkoutData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AIError(
      "A inteligência artificial retornou um formato inválido.",
      "INVALID_FORMAT",
    );
  }

  const workoutDays = Object.values(data);

  if (workoutDays.length === 0) {
    throw new AIError(
      "Nenhum treino foi identificado no conteúdo enviado.",
      "EMPTY_RESULT",
    );
  }

  const hasInvalidDay = workoutDays.some(
    (day) =>
      !day ||
      typeof day !== "object" ||
      !Array.isArray(day.exercises),
  );

  if (hasInvalidDay) {
    throw new AIError(
      "A ficha retornada pela inteligência artificial está incompleta.",
      "INVALID_FORMAT",
    );
  }

  return data;
}

async function getFunctionErrorMessage(error) {
  try {
    if (error?.context && typeof error.context.json === "function") {
      const responseBody = await error.context.json();

      return (
        responseBody?.error ||
        responseBody?.message ||
        "A função de inteligência artificial retornou um erro."
      );
    }
  } catch {
    // Usa a mensagem padrão abaixo caso a resposta não seja um JSON válido.
  }

  return (
    error?.message ||
    "Não foi possível conectar ao serviço de inteligência artificial."
  );
}

export const parseWorkoutWithAI = async (
  rawText = "",
  file = null,
  autoFix = true,
) => {
  const normalizedText = rawText.trim();

  if (!normalizedText && !file) {
    throw new AIError(
      "Informe o treino em texto ou selecione um arquivo PDF.",
      "EMPTY_INPUT",
    );
  }

  if (file && file.type !== "application/pdf") {
    throw new AIError(
      "Apenas arquivos PDF são permitidos.",
      "INVALID_FILE",
    );
  }

  if (file && file.size > 5 * 1024 * 1024) {
    throw new AIError(
      "O arquivo PDF deve possuir no máximo 5 MB.",
      "FILE_TOO_LARGE",
    );
  }

  const cacheKey = createCacheKey(
    normalizedText,
    file,
    autoFix,
  );

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const formData = new FormData();

    formData.append("rawText", normalizedText);
    formData.append("autoFix", String(autoFix));

    if (file) {
      formData.append("file", file, file.name);
    }

    const { data, error } = await supabase.functions.invoke(
      "parse-workout",
      {
        body: formData,
      },
    );

    if (error) {
      const message = await getFunctionErrorMessage(error);
      throw new AIError(message, "API_ERROR");
    }

    const validatedData = validateWorkoutData(data);

    cache.set(cacheKey, validatedData);

    return validatedData;
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }

    throw new AIError(
      error?.message || "Erro inesperado ao processar o treino.",
      "UNKNOWN",
    );
  }
};