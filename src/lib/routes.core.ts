export type RouteStepDTO = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
};

export type RouteDTO = {
  path: { lat: number; lng: number }[];
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStepDTO[];
};

type KakaoGuide = {
  name?: string;
  x: number;
  y: number;
  distance?: number;
  duration?: number;
  type?: number;
  guidance?: string;
};

type KakaoRoute = {
  result_code?: number;
  result_msg?: string;
  summary?: { distance?: number; duration?: number };
  sections?: Array<{
    roads?: Array<{ vertexes?: number[] }>;
    guides?: KakaoGuide[];
  }>;
};

const KAKAO_URL = "https://apis-navi.kakaomobility.com/v1/directions";

function toDTO(r: KakaoRoute): RouteDTO | null {
  if (r.result_code !== 0) return null;
  const path: { lat: number; lng: number }[] = [];
  const guides: KakaoGuide[] = [];
  for (const section of r.sections ?? []) {
    for (const road of section.roads ?? []) {
      const v = road.vertexes ?? [];
      for (let i = 0; i + 1 < v.length; i += 2) path.push({ lng: v[i], lat: v[i + 1] });
    }
    guides.push(...(section.guides ?? []));
  }
  if (path.length < 2) return null;

  const steps: RouteStepDTO[] = guides
    .filter((g) => (g.distance ?? 0) > 0 || g.guidance)
    .map((g, i, arr) => {
      const next = arr[i + 1] ?? g;
      return {
        instruction: g.guidance || g.name || "직진",
        distanceMeters: Math.round(g.distance ?? 0),
        durationSeconds: Math.round(g.duration ?? 0),
        startLocation: { lat: g.y, lng: g.x },
        endLocation: { lat: next.y, lng: next.x },
      };
    });

  return {
    path,
    distanceMeters: Math.round(r.summary?.distance ?? 0),
    durationSeconds: Math.round(r.summary?.duration ?? 0),
    steps,
  };
}

export async function callKakao(
  key: string,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  priority: "RECOMMEND" | "TIME" | "DISTANCE",
): Promise<RouteDTO[]> {
  const params = new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
    priority,
    alternatives: "true",
    road_details: "false",
    car_type: "1",
  });

  const res = await fetch(`${KAKAO_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Kakao directions failed [${res.status}]: ${body}`);
    throw new Error(`카카오 경로 계산 실패 (${res.status})`);
  }

  const json = (await res.json()) as { routes?: KakaoRoute[] };
  return (json.routes ?? []).map(toDTO).filter((r): r is RouteDTO => r !== null);
}

export async function computeRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ routes: RouteDTO[] }> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("카카오 REST API 키가 설정되지 않았습니다.");

  const results = await Promise.all(
    (["RECOMMEND", "TIME", "DISTANCE"] as const).map((p) =>
      callKakao(key, origin, destination, p).catch((e) => {
        console.error(e);
        return [] as RouteDTO[];
      }),
    ),
  );

  const seen = new Set<string>();
  const routes: RouteDTO[] = [];
  for (const r of results.flat()) {
    const sig = `${r.distanceMeters}-${r.durationSeconds}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    routes.push(r);
  }

  if (routes.length === 0) throw new Error("경로를 찾지 못했습니다.");
  return { routes };
}

export async function computeFastest(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ route: RouteDTO | null }> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("카카오 REST API 키가 설정되지 않았습니다.");
  const routes = await callKakao(key, origin, destination, "TIME");
  const fastest = routes.sort((a, b) => a.durationSeconds - b.durationSeconds)[0] ?? null;
  return { route: fastest };
}
