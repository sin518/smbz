import type { DaliurenInput, DaliurenOutput } from "taibu-core/daliuren";

type DaliurenCalculateResponse =
  | { chart: DaliurenOutput; canonicalText: string; error?: never }
  | { chart?: never; canonicalText?: never; error: string };

export async function calculateDaliurenChart(input: DaliurenInput): Promise<{ chart: DaliurenOutput; canonicalText: string }> {
  const response = await fetch("/api/daliuren/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const data = (await response.json()) as DaliurenCalculateResponse;

  if (!response.ok || !data.chart) {
    throw new Error(data.error || "大六壬起课失败");
  }

  return {
    chart: data.chart,
    canonicalText: data.canonicalText
  };
}
