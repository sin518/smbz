import { cookies } from "next/headers";
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

export async function POST(request: Request) {
  const cookieHeader = await getCookieHeader();
  const isAdmin = await getIsAdmin(cookieHeader);

  if (!isAdmin) {
    return Response.json({ error: "当前账号没有后台管理权限" }, { status: 403 });
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

  const anyRouterApiKey = process.env.ANYROUTER_API_KEY;
  const anyRouterBaseUrl = process.env.ANYROUTER_BASE_URL;
  const anthropicApiKey = process.env.ANTHROPIC_AUTH_TOKEN;
  const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL;
  const model = process.env.ANYROUTER_MODEL ?? process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

  if ((!anyRouterApiKey || !anyRouterBaseUrl) && (!anthropicApiKey || !anthropicBaseUrl)) {
    return Response.json({ error: "大模型环境变量未配置" }, { status: 500 });
  }

  return anthropicApiKey && anthropicBaseUrl
    ? streamAnthropicMessages({
        apiKey: anthropicApiKey,
        baseUrl: anthropicBaseUrl,
        model,
        prompt: parsed.data.prompt,
        maxTokens: parsed.data.maxTokens ?? 3000,
        signal: request.signal
      })
    : streamOpenAICompatible({
        apiKey: anyRouterApiKey ?? "",
        baseUrl: anyRouterBaseUrl ?? "",
        model,
        prompt: parsed.data.prompt,
        temperature: parsed.data.temperature ?? 0.35,
        maxTokens: parsed.data.maxTokens ?? 3000,
        signal: request.signal
      });
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function getIsAdmin(cookieHeader: string) {
  if (!cookieHeader) {
    return false;
  }

  try {
    const response = await fetch(`${getBackendUrl()}/api/admin/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store"
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function streamOpenAICompatible({
  apiKey,
  baseUrl,
  model,
  prompt,
  temperature,
  maxTokens,
  signal
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  signal: AbortSignal;
}) {
  const upstream = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
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

  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: await readUpstreamError(upstream, "大模型调用失败") }, { status: 502 });
  }

  return createTextStreamResponse(upstream.body, parseOpenAICompatibleSseText);
}

async function streamAnthropicMessages({
  apiKey,
  baseUrl,
  model,
  prompt,
  maxTokens,
  signal
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  maxTokens: number;
  signal: AbortSignal;
}) {
  const upstream = await fetch(`${normalizeBaseUrl(baseUrl)}/messages`, {
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

  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: await readUpstreamError(upstream, "大模型调用失败") }, { status: 502 });
  }

  return createTextStreamResponse(upstream.body, parseAnthropicSseText);
}

function createTextStreamResponse(
  upstreamBody: ReadableStream<Uint8Array>,
  parseText: (line: string) => string | null
) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";

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
              controller.enqueue(encoder.encode(text));
            }
          }
        }
      } catch (error) {
        controller.error(error);
        return;
      } finally {
        reader.releaseLock();
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no"
    }
  });
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
