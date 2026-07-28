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
  travelMode?: "WALKING" | "DRIVING";
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

// 보행자 평균 이동 속도: 약 4.5km/h = 초당 1.25m
const WALKING_SPEED_MPS = 1.25;

function toDTO(r: KakaoRoute, mode: "WALKING" | "DRIVING" = "WALKING"): RouteDTO | null {
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

  const totalDistance = Math.round(r.summary?.distance ?? 0);
  const kakaoDuration = Math.round(r.summary?.duration ?? 0);

  // DRIVING이면 카카오내비 실시간 시간 그대로 사용, WALKING이면 도보 속도로 재계산
  const totalDuration = mode === "DRIVING" 
    ? kakaoDuration 
    : Math.round(totalDistance / WALKING_SPEED_MPS);

  const steps: RouteStepDTO[] = guides
    .filter((g) => (g.distance ?? 0) > 0 || g.guidance)
    .map((g, i, arr) => {
      const next = arr[i + 1] ?? g;
      const stepDistance = Math.round(g.distance ?? 0);
      const stepKakaoDuration = Math.round(g.duration ?? 0);

      const stepDuration = mode === "DRIVING"
        ? stepKakaoDuration
        : Math.round(stepDistance / WALKING_SPEED_MPS);

      return {
        instruction: g.guidance || g.name || "직진",
        distanceMeters: stepDistance,
        durationSeconds: stepDuration,
        startLocation: { lat: g.y, lng: g.x },
        endLocation: { lat: next.y, lng: next.x },
      };
    });

  return {
    path,
    distanceMeters: totalDistance,
    durationSeconds: totalDuration,
    travelMode: mode,
    steps,
  };
}

export async function callKakao(
  key: string,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  priority: "RECOMMEND" | "TIME" | "DISTANCE",
  mode: "WALKING" | "DRIVING" = "WALKING",
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
  return (json.routes ?? []).map((r) => toDTO(r, mode)).filter((r): r is RouteDTO => r !== null);
}

export async function computeRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  options?: { mode?: "WALKING" | "DRIVING" },
): Promise<{ routes: RouteDTO[] }> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("카카오 REST API 키가 설정되지 않았습니다.");

  const mode = options?.mode ?? "WALKING";

  const results = await Promise.all(
    (["RECOMMEND", "TIME", "DISTANCE"] as const).map((p) =>
      callKakao(key, origin, destination, p, mode).catch((e) => {
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
  options?: { mode?: "WALKING" | "DRIVING" },
): Promise<{ route: RouteDTO | null }> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("카카오 REST API 키가 설정되지 않았습니다.");
  const mode = options?.mode ?? "WALKING";
  const routes = await callKakao(key, origin, destination, "TIME", mode);
  const fastest = routes.sort((a, b) => a.durationSeconds - b.durationSeconds)[0] ?? null;
  return { route: fastest };
}
