import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * O sistema tenta os modelos na ordem definida.
 * Dê preferência a versões estáveis, evitando modelos preview.
 */
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
];

/**
 * Tempo máximo permitido para cada modelo responder.
 * Se o primeiro exceder o tempo, o próximo será testado.
 */
const MODEL_TIMEOUT_MS = 40_000;

/**
 * Impede que todas as tentativas mantenham a Edge Function
 * em execução por tempo excessivo.
 */
const TOTAL_TIMEOUT_MS = 90_000;

const RETRYABLE_STATUS_CODES = new Set([
  408,
  429,
  500,
  502,
  503,
  504,
]);

const SYSTEM_PROMPT = `
Você é um organizador de fichas de treino de musculação.

Analise o conteúdo enviado e retorne SOMENTE um JSON válido.

Regras:
- Identifique os dias de treino, como A, B, C ou nomes equivalentes;
- Normalize os nomes dos exercícios;
- Identifique séries e repetições;
- Defina o foco muscular de cada sessão;
- Preserve observações relevantes;
- Não invente cargas ou exercícios;
- Quando houver exercícios alternativos indicados por "ou", barra ou
  parênteses, coloque-os no array "alternatives".

Retorne exatamente no seguinte formato:

{
  "A": {
    "title": "TREINO A",
    "focus": "Grupo muscular",
    "exercises": [
      {
        "name": "Nome do exercício",
        "sets": "3x10",
        "note": "",
        "alternatives": []
      }
    ]
  }
}
`;

type GeminiCallResult = {
  data: unknown;
  model: string;
};

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function arrayBufferToBase64(
  buffer: ArrayBuffer,
): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";

  for (
    let index = 0;
    index < bytes.length;
    index += chunkSize
  ) {
    const chunk = bytes.subarray(
      index,
      Math.min(index + chunkSize, bytes.length),
    );

    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function extractText(response: any): string {
  if (typeof response?.output_text === "string") {
    return response.output_text;
  }

  const steps = Array.isArray(response?.steps)
    ? response.steps
    : [];

  for (
    let index = steps.length - 1;
    index >= 0;
    index--
  ) {
    const content = steps[index]?.content;

    if (!Array.isArray(content)) {
      continue;
    }

    const textPart = content.find(
      (item: any) =>
        item?.type === "text" &&
        typeof item?.text === "string",
    );

    if (textPart) {
      return textPart.text;
    }
  }

  return "";
}

function parseJsonResponse(
  text: string,
): unknown {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (
      start === -1 ||
      end === -1 ||
      end <= start
    ) {
      throw new Error(
        "A IA não retornou um JSON válido.",
      );
    }

    return JSON.parse(
      cleaned.slice(start, end + 1),
    );
  }
}

async function readGeminiResponse(
  response: Response,
): Promise<any> {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      error: {
        message: responseText,
      },
    };
  }
}

function getGeminiErrorMessage(
  data: any,
  model: string,
  status: number,
): string {
  return (
    data?.error?.message ||
    data?.message ||
    `O modelo ${model} retornou o erro HTTP ${status}.`
  );
}

function isModelUnavailable(
  status: number,
  message: string,
): boolean {
  if (![400, 404].includes(status)) {
    return false;
  }

  return /no longer available|not available|model not found|not found|unsupported|deprecated|shut down|unavailable/i
    .test(message);
}

function shouldTryNextModel(
  status: number,
  message: string,
): boolean {
  if (RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  if (isModelUnavailable(status, message)) {
    return true;
  }

  return /high demand|temporarily unavailable|overloaded|capacity|try again later/i
    .test(message);
}

async function callGeminiWithFallback(
  apiKey: string,
  input: Array<Record<string, unknown>>,
): Promise<GeminiCallResult> {
  const startedAt = Date.now();

  let lastErrorMessage =
    "Nenhum modelo de inteligência artificial conseguiu responder.";

  for (const model of GEMINI_MODELS) {
    const elapsedTime = Date.now() - startedAt;
    const remainingTime =
      TOTAL_TIMEOUT_MS - elapsedTime;

    if (remainingTime <= 0) {
      throw new Error(
        "A inteligência artificial demorou demais para responder.",
      );
    }

    const requestTimeout = Math.min(
      MODEL_TIMEOUT_MS,
      remainingTime,
    );

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, requestTimeout);

    console.log(
      `Tentando processar o treino com o modelo ${model}.`,
    );

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            model,
            input,
          }),
          signal: controller.signal,
        },
      );

      const data = await readGeminiResponse(response);

      if (response.ok) {
        console.log(
          `Treino processado com sucesso pelo modelo ${model}.`,
        );

        return {
          data,
          model,
        };
      }

      const errorMessage =
        getGeminiErrorMessage(
          data,
          model,
          response.status,
        );

      lastErrorMessage = errorMessage;

      console.error(
        `Erro retornado pelo modelo ${model}:`,
        JSON.stringify({
          status: response.status,
          message: errorMessage,
        }),
      );

      if (
        shouldTryNextModel(
          response.status,
          errorMessage,
        )
      ) {
        console.warn(
          `O modelo ${model} não pôde responder. Tentando o próximo modelo.`,
        );

        continue;
      }

      /**
       * Erros como chave inválida, requisição incorreta
       * ou falta de permissão não são resolvidos
       * simplesmente trocando de modelo.
       */
      throw new Error(errorMessage);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        lastErrorMessage =
          `O modelo ${model} excedeu o tempo máximo de resposta.`;

        console.warn(lastErrorMessage);

        continue;
      }

      if (
        error instanceof TypeError ||
        (
          error instanceof Error &&
          /fetch|network|connection/i.test(
            error.message,
          )
        )
      ) {
        lastErrorMessage =
          `Não foi possível conectar ao modelo ${model}.`;

        console.warn(
          `${lastErrorMessage} Tentando o próximo modelo.`,
        );

        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(lastErrorMessage);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Método não permitido.",
      },
      405,
    );
  }

  try {
    const authorization =
      request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        {
          error: "Usuário não autenticado.",
        },
        401,
      );
    }

    const apiKey =
      Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY não encontrada.",
      );

      return jsonResponse(
        {
          error:
            "Chave da inteligência artificial não configurada.",
        },
        500,
      );
    }

    const formData =
      await request.formData();

    const rawText = String(
      formData.get("rawText") ?? "",
    ).trim();

    const receivedFile =
      formData.get("file");

    const file =
      receivedFile instanceof File &&
      receivedFile.size > 0
        ? receivedFile
        : null;

    if (!rawText && !file) {
      return jsonResponse(
        {
          error:
            "Informe um texto ou envie um arquivo PDF.",
        },
        400,
      );
    }

    if (
      file &&
      file.type !== "application/pdf"
    ) {
      return jsonResponse(
        {
          error:
            "Apenas arquivos PDF são permitidos.",
        },
        400,
      );
    }

    /**
     * Limite reduzido para evitar consumo
     * excessivo de memória no MVP.
     */
    if (
      file &&
      file.size > 2 * 1024 * 1024
    ) {
      return jsonResponse(
        {
          error:
            "O arquivo PDF deve possuir no máximo 2 MB.",
        },
        413,
      );
    }

    const input: Array<
      Record<string, unknown>
    > = [];

    if (file) {
      const buffer =
        await file.arrayBuffer();

      input.push({
        type: "document",
        data: arrayBufferToBase64(buffer),
        mime_type: "application/pdf",
      });
    }

    input.push({
      type: "text",
      text: rawText
        ? `${SYSTEM_PROMPT}\n\nCONTEÚDO:\n${rawText}`
        : `${SYSTEM_PROMPT}\n\nLeia e organize a ficha do PDF enviado.`,
    });

    console.log(
      `Processando treino. Texto: ${
        rawText.length
      } caracteres. PDF: ${
        file ? file.size : 0
      } bytes.`,
    );

    const {
      data: geminiData,
      model: usedModel,
    } = await callGeminiWithFallback(
      apiKey,
      input,
    );

    console.log(
      `Resposta recebida do modelo ${usedModel}.`,
    );

    /**
     * Registra o consumo de tokens da importação.
     * Usado para estimar o custo comercial da API Gemini.
     */
    const usage =
      (geminiData as any)?.usage;

    console.log(
      "USO_GEMINI",
      JSON.stringify({
        model: usedModel,
        inputTokens:
          usage?.total_input_tokens ?? 0,
        outputTokens:
          usage?.total_output_tokens ?? 0,
        thoughtTokens:
          usage?.total_thought_tokens ?? 0,
        totalTokens:
          usage?.total_tokens ?? 0,
      }),
    );

    const outputText =
      extractText(geminiData);

    if (!outputText) {
      console.error(
        "Resposta sem texto:",
        JSON.stringify(geminiData),
      );

      return jsonResponse(
        {
          error:
            "A IA retornou uma resposta vazia.",
        },
        502,
      );
    }

    const parsedWorkout =
      parseJsonResponse(outputText);

    console.log(
      `Treino estruturado com sucesso usando ${usedModel}.`,
    );

    return jsonResponse(parsedWorkout);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao processar o treino.";

    console.error(
      "Erro na função parse-workout:",
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error),
    );

    if (
      /demorou demais|tempo máximo|excedeu o tempo/i
        .test(errorMessage)
    ) {
      return jsonResponse(
        {
          error:
            "A inteligência artificial demorou demais para responder. Tente novamente.",
        },
        504,
      );
    }

    return jsonResponse(
      {
        error: errorMessage,
      },
      502,
    );
  }
});
