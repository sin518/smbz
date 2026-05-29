import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";

type AmapGeocodeResponse = {
  status?: string;
  info?: string;
  geocodes?: Array<{
    location?: string;
    level?: string;
    formatted_address?: string;
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const province = normalizePart(searchParams.get("province"));
  const city = normalizePart(searchParams.get("city"));
  const district = normalizePart(searchParams.get("district"));

  if (!province || !city || !district) {
    return NextResponse.json({ error: "缺少省市区参数" }, { status: 400 });
  }

  const key = getAmapKey();

  if (!key) {
    return NextResponse.json({ error: "未配置高德 Web 服务 API Key" }, { status: 500 });
  }

  const address = `${province}${city}${district}`;
  const url = new URL(AMAP_GEOCODE_URL);
  url.searchParams.set("key", key);
  url.searchParams.set("address", address);
  url.searchParams.set("city", city);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ error: "高德地理编码请求失败" }, { status: 502 });
    }

    const data = (await response.json()) as AmapGeocodeResponse;
    const geocode = data.geocodes?.[0];
    const coordinate = parseAmapLocation(geocode?.location);

    if (data.status !== "1" || !coordinate) {
      return NextResponse.json({ error: data.info || "未查询到经纬度" }, { status: 404 });
    }

    return NextResponse.json({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      precision: geocode?.level === "区县" ? "district" : "city",
      formattedAddress: geocode?.formatted_address || address
    });
  } catch {
    return NextResponse.json({ error: "高德地理编码服务暂不可用" }, { status: 502 });
  }
}

function normalizePart(value: string | null) {
  return value?.trim().slice(0, 40) ?? "";
}

function parseAmapLocation(value?: string) {
  if (!value) {
    return null;
  }

  const [longitudeText, latitudeText] = value.split(",");
  const longitude = Number(longitudeText);
  const latitude = Number(latitudeText);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return {
    latitude,
    longitude
  };
}

function getAmapKey() {
  const envKey =
    process.env.AMAP_WEB_SERVICE_KEY ||
    process.env.GAODE_WEB_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_AMAP_WEB_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_GAODE_WEB_SERVICE_KEY;

  if (envKey) {
    return envKey;
  }

  try {
    const rawEnv = readFileSync(join(process.cwd(), ".env"), "utf8").trim();

    if (rawEnv && !rawEnv.includes("=") && !rawEnv.includes("\n")) {
      return rawEnv;
    }
  } catch {
    // Fall through to missing-key response.
  }

  return "";
}
