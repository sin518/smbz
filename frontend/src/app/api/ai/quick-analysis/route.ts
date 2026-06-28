import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().trim().min(1).max(12000)
});

const quickAnalysisSchema = z.object({
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

const defaultAnthropicModel = "claude-haiku-4-5-20251001";

export async function POST(request: Request) {
  const anyRouterApiKey = process.env.ANYROUTER_API_KEY;
  const anyRouterBaseUrl = process.env.ANYROUTER_BASE_URL;
  const anthropicApiKey = process.env.ANTHROPIC_AUTH_TOKEN;
  const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL;
  const model = process.env.ANYROUTER_MODEL ?? process.env.ANTHROPIC_MODEL ?? defaultAnthropicModel;

  if ((!anyRouterApiKey || !anyRouterBaseUrl) && (!anthropicApiKey || !anthropicBaseUrl)) {
    return NextResponse.json({ error: "AnyRouter 环境变量未配置" }, { status: 500 });
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

  if (anthropicApiKey && anthropicBaseUrl) {
    return callAnthropicMessages({
      apiKey: anthropicApiKey,
      baseUrl: anthropicBaseUrl,
      model,
      messages: parsed.data.messages,
      maxTokens: parsed.data.maxTokens ?? 800
    });
  }

  return callOpenAICompatible({
    apiKey: anyRouterApiKey ?? "",
    baseUrl: anyRouterBaseUrl ?? "",
    model,
    messages: parsed.data.messages,
    temperature: parsed.data.temperature ?? 0.35,
    maxTokens: parsed.data.maxTokens ?? 800,
    responseFormat: parsed.data.responseFormat
  });
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
