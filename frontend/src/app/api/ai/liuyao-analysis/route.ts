import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";

const liuyaoAnalysisSchema = z.object({
  prompt: z.string().trim().min(1).max(60000),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(256).max(6000).optional()
});

type AnyRouterStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  error?: string | {
    message?: string;
  };
};

type AnthropicStreamChunk = {
  type?: string;
  delta?: {
    text?: string;
  };
  error?: string | {
    message?: string;
  };
};

type AiAnalysisCacheResponse = {
  responseBody?: {
    content?: unknown;
  };
};

const LIUYAO_ANALYSIS_SOURCE = "liuyao-stream-analysis-v2";
const liuyaoAnalysisInFlightCache = new Map<string, Promise<string>>();

export async function POST(request: Request) {
  const cookieHeader = await getCookieHeader();
  const userId = await getSignedInUserId(cookieHeader);

  if (!userId) {
    return Response.json({ error: "请先登录后再进行 AI 分析" }, { status: 401 });
  }

  let rawInput: unknown;

  try {
    rawInput = await request.json();
  } catch {
    return Response.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = liuyaoAnalysisSchema.safeParse(rawInput);

  if (!parsed.success) {
    return Response.json({ error: "六爻 AI 分析参数无效" }, { status: 400 });
  }

  const model = process.env.ANYROUTER_MODEL ?? process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
  const modelInput = {
    prompt: parsed.data.prompt,
    temperature: parsed.data.temperature ?? 0.35,
    maxTokens: parsed.data.maxTokens ?? 3000,
    model
  };
  const requestHash = hashText(JSON.stringify(modelInput));
  const inFlightKey = `${userId}:${LIUYAO_ANALYSIS_SOURCE}:${requestHash}`;
  const cachedContent = await readPersistentAnalysisCache(cookieHeader, requestHash);

  if (cachedContent) {
    return createStaticTextStreamResponse(cachedContent);
  }

  const inFlight = liuyaoAnalysisInFlightCache.get(inFlightKey);

  if (inFlight) {
    try {
      return createStaticTextStreamResponse(await inFlight);
    } catch {
      liuyaoAnalysisInFlightCache.delete(inFlightKey);
    }
  }

  const anyRouterApiKey = process.env.ANYROUTER_API_KEY;
  const anyRouterBaseUrl = process.env.ANYROUTER_BASE_URL;
  const anthropicApiKey = process.env.ANTHROPIC_AUTH_TOKEN;
  const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL;

  if ((!anyRouterApiKey || !anyRouterBaseUrl) && (!anthropicApiKey || !anthropicBaseUrl)) {
    return Response.json({ error: "大模型环境变量未配置" }, { status: 500 });
  }

  let resolveInFlight: (content: string) => void;
  let rejectInFlight: (error: unknown) => void;
  const inFlightPromise = new Promise<string>((resolve, reject) => {
    resolveInFlight = resolve;
    rejectInFlight = reject;
  });
  void inFlightPromise.catch(() => undefined);
  liuyaoAnalysisInFlightCache.set(inFlightKey, inFlightPromise);

  const onComplete = async (content: string) => {
    try {
      await writePersistentAnalysisCache({
        cookieHeader,
        requestHash,
        requestPayload: modelInput,
        content
      });
      resolveInFlight(content);
    } catch (error) {
      rejectInFlight(error);
    } finally {
      liuyaoAnalysisInFlightCache.delete(inFlightKey);
    }
  };
  const onError = (error: unknown) => {
    rejectInFlight(error);
    liuyaoAnalysisInFlightCache.delete(inFlightKey);
  };

  return anthropicApiKey && anthropicBaseUrl
    ? streamAnthropicMessages({
        apiKey: anthropicApiKey,
        baseUrl: anthropicBaseUrl,
        model,
        prompt: parsed.data.prompt,
        maxTokens: parsed.data.maxTokens ?? 3000,
        signal: request.signal,
        onComplete,
        onError
      })
    : streamOpenAICompatible({
        apiKey: anyRouterApiKey ?? "",
        baseUrl: anyRouterBaseUrl ?? "",
        model,
        prompt: parsed.data.prompt,
        temperature: parsed.data.temperature ?? 0.35,
        maxTokens: parsed.data.maxTokens ?? 3000,
        signal: request.signal,
        onComplete,
        onError
      });
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function getSignedInUserId(cookieHeader: string) {
  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${getBackendUrl()}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store"
    });
    const data = (await response.json().catch(() => null)) as { session?: unknown; user?: { id?: unknown } } | null;

    return response.ok && data?.session && typeof data.user?.id === "string" ? data.user.id : null;
  } catch {
    return null;
  }
}

async function readPersistentAnalysisCache(cookieHeader: string, requestHash: string) {
  try {
    const params = new URLSearchParams({ source: LIUYAO_ANALYSIS_SOURCE });
    const response = await fetch(`${getBackendUrl()}/api/ai/quick-analysis-cache/${encodeURIComponent(requestHash)}?${params.toString()}`, {
      headers: { cookie: cookieHeader },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json().catch(() => null)) as AiAnalysisCacheResponse | null;
    return typeof data?.responseBody?.content === "string" ? data.responseBody.content : null;
  } catch {
    return null;
  }
}

async function writePersistentAnalysisCache({
  cookieHeader,
  requestHash,
  requestPayload,
  content
}: {
  cookieHeader: string;
  requestHash: string;
  requestPayload: z.infer<typeof liuyaoAnalysisSchema> & { model: string };
  content: string;
}) {
  await fetch(`${getBackendUrl()}/api/ai/quick-analysis-cache/${encodeURIComponent(requestHash)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader
    },
    body: JSON.stringify({
      source: LIUYAO_ANALYSIS_SOURCE,
      requestPayload,
      responseBody: { content }
    })
  });
}

async function streamOpenAICompatible({
  apiKey,
  baseUrl,
  model,
  prompt,
  temperature,
  maxTokens,
  signal,
  onComplete,
  onError
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  signal: AbortSignal;
  onComplete: (content: string) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  let upstream: Response;

  try {
    upstream = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      signal
    });
  } catch (error) {
    onError(error);
    return Response.json({ error: error instanceof Error ? error.message : "大模型请求异常" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const error = await readUpstreamError(upstream, "大模型调用失败");
    onError(new Error(error));
    return Response.json({ error }, { status: 502 });
  }

  return createTextStreamResponse(upstream.body, parseOpenAICompatibleSseText, onComplete, onError);
}

async function streamAnthropicMessages({
  apiKey,
  baseUrl,
  model,
  prompt,
  maxTokens,
  signal,
  onComplete,
  onError
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  maxTokens: number;
  signal: AbortSignal;
  onComplete: (content: string) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  let upstream: Response;

  try {
    upstream = await fetch(`${normalizeBaseUrl(baseUrl)}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      signal
    });
  } catch (error) {
    onError(error);
    return Response.json({ error: error instanceof Error ? error.message : "大模型请求异常" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const error = await readUpstreamError(upstream, "大模型调用失败");
    onError(new Error(error));
    return Response.json({ error }, { status: 502 });
  }

  return createTextStreamResponse(upstream.body, parseAnthropicSseText, onComplete, onError);
}

function createTextStreamResponse(
  upstreamBody: ReadableStream<Uint8Array>,
  parseText: (line: string) => string | null,
  onComplete: (content: string) => Promise<void>,
  onError: (error: unknown) => void
) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";
  let content = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          pending += decoder.decode(value, { stream: true });
          const lines = pending.split("\n");
          pending = lines.pop() ?? "";

          for (const line of lines) {
            const text = parseText(line);

            if (text) {
              content += text;
              controller.enqueue(encoder.encode(formatSseEvent("delta", { content: text })));
            }
          }
        }
      } catch (error) {
        onError(error);
        controller.error(error);
        return;
      } finally {
        reader.releaseLock();
      }

      await onComplete(content);
      controller.enqueue(encoder.encode(formatSseEvent("done", { contentLength: content.length })));
      controller.close();
    }
  });

  return createSseResponse(stream);
}

function createStaticTextStreamResponse(content: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(formatSseEvent("delta", { content })));
      controller.enqueue(encoder.encode(formatSseEvent("done", { contentLength: content.length, cached: true })));
      controller.close();
    }
  });

  return createSseResponse(stream);
}

function createSseResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      "Connection": "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no"
    }
  });
}

function formatSseEvent(event: string, payload: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function hashText(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function parseOpenAICompatibleSseText(line: string) {
  const data = getSseData(line);

  if (!data || data === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as AnyRouterStreamChunk;
    return parsed.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

function parseAnthropicSseText(line: string) {
  const data = getSseData(line);

  if (!data) {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as AnthropicStreamChunk;
    return parsed.type === "content_block_delta" ? parsed.delta?.text ?? null : null;
  } catch {
    return null;
  }
}

function getSseData(line: string) {
  const trimmed = line.trim();

  if (!trimmed.startsWith("data:")) {
    return null;
  }

  return trimmed.slice("data:".length).trim();
}

async function readUpstreamError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as AnyRouterStreamChunk | AnthropicStreamChunk | null;

  if (typeof data?.error === "string") {
    return data.error;
  }

  return data?.error?.message ?? fallback;
}

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/$/, "");

  if (trimmed.endsWith("/v1")) {
    return trimmed;
  }

  return `${trimmed}/v1`;
}
