import type { QimenInput, QimenOutput } from "taibu-core/qimen";

type QimenCalculateResponse =
  | { chart: QimenOutput; error?: never }
  | { chart?: never; error: string };

export async function calculateQimenChart(input: QimenInput): Promise<QimenOutput> {
  const response = await fetch("/api/qimen/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const data = (await response.json()) as QimenCalculateResponse;

  if (!response.ok || !data.chart) {
    throw new Error(data.error || "奇门排盘失败");
  }

  return data.chart;
}
