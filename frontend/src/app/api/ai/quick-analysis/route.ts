import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().trim().min(1).max(12000)
});

const quickAnalysisSchema = z.object({
  source: z.string().trim().min(1).max(80).optional(),
  messages: z.array(messageSchema).min(1).max(12),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(64).max(4000).optional(),
  responseFormat: z.enum(["text", "json_object"]).optional()
});

type AnyRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: string | {
    message?: string;
  };
};

type AnthropicMessageResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  error?: string | {
    message?: string;
  };
};

type SessionResponse = {
  session?: unknown;
  user?: {
    id?: string;
  } | null;
};

type CachedQuickAnalysisResponse = {
  body: Record<string, unknown>;
  status: number;
};

type PersistentQuickAnalysisCacheResponse = {
  responseBody?: Record<string, unknown>;
};

const defaultAnthropicModel = "claude-haiku-4-5-20251001";
const quickAnalysisResponseCache = new Map<string, Promise<CachedQuickAnalysisResponse>>();

export async function POST(request: Request) {
  const cookieHeader = await getCookieHeader();
  const userId = await getSignedInUserId(cookieHeader);

  if (!userId) {
    return NextResponse.json({ error: "请先登录后再进行 AI 分析" }, { status: 401 });
  }

  let rawInput: unknown;

  try {
    rawInput = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = quickAnalysisSchema.safeParse(rawInput);

  if (!parsed.success) {
    return NextResponse.json({ error: "快速分析参数无效" }, { status: 400 });
  }

  const { source = "bazi-quick-analysis", ...modelInput } = parsed.data;
  const requestHash = getQuickAnalysisRequestHash(modelInput);
  const cacheKey = getQuickAnalysisCacheKey(userId, source, requestHash);
  const cachedResponse = quickAnalysisResponseCache.get(cacheKey);

  if (cachedResponse) {
    const cached = await cachedResponse;
    return NextResponse.json(cached.body, { status: cached.status });
  }

  const persistentCache = await readPersistentQuickAnalysisCache(cookieHeader, source, requestHash);

  if (persistentCache) {
    quickAnalysisResponseCache.set(cacheKey, Promise.resolve({ body: persistentCache, status: 200 }));
    return NextResponse.json(persistentCache);
  }

  const anyRouterApiKey = process.env.ANYROUTER_API_KEY;
  const anyRouterBaseUrl = process.env.ANYROUTER_BASE_URL;
  const anthropicApiKey = process.env.ANTHROPIC_AUTH_TOKEN;
  const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL;
  const model = process.env.ANYROUTER_MODEL ?? process.env.ANTHROPIC_MODEL ?? defaultAnthropicModel;

  if ((!anyRouterApiKey || !anyRouterBaseUrl) && (!anthropicApiKey || !anthropicBaseUrl)) {
    return NextResponse.json({ error: "AnyRouter 环境变量未配置" }, { status: 500 });
  }

  const responsePromise = resolveQuickAnalysisResponse({
    useAnthropic: Boolean(anthropicApiKey && anthropicBaseUrl),
    anthropicApiKey: anthropicApiKey ?? "",
    anthropicBaseUrl: anthropicBaseUrl ?? "",
    anyRouterApiKey: anyRouterApiKey ?? "",
    anyRouterBaseUrl: anyRouterBaseUrl ?? "",
    model,
    input: modelInput,
    source,
    requestHash,
    cookieHeader
  });
  quickAnalysisResponseCache.set(cacheKey, responsePromise);

  const cached = await responsePromise;

  if (cached.status >= 500) {
    quickAnalysisResponseCache.delete(cacheKey);
  }

  return NextResponse.json(cached.body, { status: cached.status });
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
    const data = response.ok ? ((await response.json()) as SessionResponse | null) : null;

    return data?.session && data.user?.id ? data.user.id : null;
  } catch {
    return null;
  }
}

async function readPersistentQuickAnalysisCache(cookieHeader: string, source: string, requestHash: string) {
  if (!cookieHeader) {
    return null;
  }

  try {
    const params = new URLSearchParams({ source });
    const response = await fetch(`${getBackendUrl()}/api/ai/quick-analysis-cache/${encodeURIComponent(requestHash)}?${params.toString()}`, {
      headers: { cookie: cookieHeader },
      cache: "no-store"
    });

    if (response.status === 404) {
      return null;
    }

    const data = response.ok ? ((await response.json()) as PersistentQuickAnalysisCacheResponse) : null;
    return data?.responseBody ?? null;
  } catch {
    return null;
  }
}

async function writePersistentQuickAnalysisCache({
  cookieHeader,
  source,
  requestHash,
  requestPayload,
  responseBody
}: {
  cookieHeader: string;
  source: string;
  requestHash: string;
  requestPayload: z.infer<typeof quickAnalysisModelSchema>;
  responseBody: Record<string, unknown>;
}) {
  if (!cookieHeader) {
    return;
  }

  try {
    await fetch(`${getBackendUrl()}/api/ai/quick-analysis-cache/${encodeURIComponent(requestHash)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader
      },
      body: JSON.stringify({
        source,
        requestPayload,
        responseBody
      })
    });
  } catch {
    // Keep the AI response usable even if persistence is temporarily unavailable.
  }
}

async function resolveQuickAnalysisResponse({
  useAnthropic,
  anthropicApiKey,
  anthropicBaseUrl,
  anyRouterApiKey,
  anyRouterBaseUrl,
  model,
  input,
  source,
  requestHash,
  cookieHeader
}: {
  useAnthropic: boolean;
  anthropicApiKey: string;
  anthropicBaseUrl: string;
  anyRouterApiKey: string;
  anyRouterBaseUrl: string;
  model: string;
  input: z.infer<typeof quickAnalysisModelSchema>;
  source: string;
  requestHash: string;
  cookieHeader: string;
}): Promise<CachedQuickAnalysisResponse> {
  const response = useAnthropic
    ? await callAnthropicMessages({
        apiKey: anthropicApiKey,
        baseUrl: anthropicBaseUrl,
        model,
        messages: input.messages,
        maxTokens: input.maxTokens ?? 800
      })
    : await callOpenAICompatible({
        apiKey: anyRouterApiKey,
        baseUrl: anyRouterBaseUrl,
        model,
        messages: input.messages,
        temperature: input.temperature ?? 0.35,
        maxTokens: input.maxTokens ?? 800,
        responseFormat: input.responseFormat
      });
  const body = (await response.clone().json().catch(() => ({ error: "AI 分析响应解析失败" }))) as Record<string, unknown>;

  if (response.ok) {
    await writePersistentQuickAnalysisCache({
      cookieHeader,
      source,
      requestHash,
      requestPayload: input,
      responseBody: body
    });
  }

  return {
    body,
    status: response.status
  };
}

const quickAnalysisModelSchema = quickAnalysisSchema.omit({ source: true });

function getQuickAnalysisRequestHash(input: z.infer<typeof quickAnalysisModelSchema>) {
  return hashText(JSON.stringify(input));
}

function hashText(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function getQuickAnalysisCacheKey(userId: string, source: string, requestHash: string) {
  return `${userId}:${source}:${requestHash}`;
}

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
}

async function callOpenAICompatible({
  apiKey,
  baseUrl,
  model,
  messages,
  temperature,
  maxTokens,
  responseFormat
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: z.infer<typeof messageSchema>[];
  temperature: number;
  maxTokens: number;
  responseFormat?: "text" | "json_object";
}) {
  const endpoint = `${normalizeAnyRouterBaseUrl(baseUrl)}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === "json_object" ? { response_format: { type: "json_object" } } : {})
      })
    });

    const data = (await response.json().catch(() => ({}))) as AnyRouterChatResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: getAnyRouterErrorMessage(data) ?? "AnyRouter 调用失败", status: response.status },
        { status: 502 }
      );
    }

    return NextResponse.json({
      content: data.choices?.[0]?.message?.content ?? ""
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AnyRouter 请求异常" },
      { status: 502 }
    );
  }
}

async function callAnthropicMessages({
  apiKey,
  baseUrl,
  model,
  messages,
  maxTokens
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: z.infer<typeof messageSchema>[];
  maxTokens: number;
}) {
  const endpoint = `${normalizeAnyRouterBaseUrl(baseUrl)}/messages`;
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const anthropicMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content
    }));

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: anthropicMessages.length > 0 ? anthropicMessages : [{ role: "user", content: "请输出简短分析。" }]
      })
    });

    const data = (await response.json().catch(() => ({}))) as AnthropicMessageResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: getAnthropicErrorMessage(data) ?? "AnyRouter 调用失败", status: response.status },
        { status: 502 }
      );
    }

    return NextResponse.json({
      content: data.content?.find((item) => item.type === "text" || item.text)?.text ?? ""
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AnyRouter 请求异常" },
      { status: 502 }
    );
  }
}

function getAnyRouterErrorMessage(data: AnyRouterChatResponse) {
  if (typeof data.error === "string") {
    return data.error;
  }

  return data.error?.message;
}

function getAnthropicErrorMessage(data: AnthropicMessageResponse) {
  if (typeof data.error === "string") {
    return data.error;
  }

  return data.error?.message;
}

function normalizeAnyRouterBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/$/, "");

  if (trimmed.endsWith("/v1")) {
    return trimmed;
  }

  return `${trimmed}/v1`;
}
