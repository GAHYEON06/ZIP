export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
};

export type RouteDTO = {
  id: string;
  name: string;
  summary: string;
  distanceMeters: number;
  durationSeconds: number;
  safetyScore: number;
  cctvCount: number;
  policeCount: number;
  bellCount: number;
  lampCount: number;
  path: { lat: number; lng: number }[];
  steps: RouteStep[];
};

export async function computeRoutes(opts: {
  data: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  };
}) {
  const { origin, destination } = opts.data;

  if (
    !origin ||
    !destination ||
    typeof origin.lat !== "number" ||
    typeof origin.lng !== "number" ||
    typeof destination.lat !== "number" ||
    typeof destination.lng !== "number"
  ) {
    throw new Error("출발지와 목적지 좌표가 유효하지 않아요.");
  }

  // 기본 경로 데이터 생성 (클라이언트 전용)
  const mockRoute: RouteDTO = {
    id: "route-1",
    name: "추천 안심 경로",
    summary: "CCTV 및 보안등 설치 구역 위주 안내",
    distanceMeters: 1200,
    durationSeconds: 900,
    safetyScore: 95,
    cctvCount: 12,
    policeCount: 2,
    bellCount: 5,
    lampCount: 20,
    path: [
      { lat: origin.lat, lng: origin.lng },
      { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 },
      { lat: destination.lat, lng: destination.lng },
    ],
    steps: [
      {
        instruction: "출발지에서 안심 귀갓길 진입",
        distanceMeters: 400,
        durationSeconds: 300,
      },
      {
        instruction: "CCTV 집중 감시 구역 직진",
        distanceMeters: 800,
        durationSeconds: 600,
      },
    ],
  };

  return { routes: [mockRoute] };
}

export async function computeFastestRoute(opts: {
  data: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  };
}) {
  const { routes } = await computeRoutes(opts);
  const sorted = [...routes].sort(
    (a, b) => a.durationSeconds - b.durationSeconds
  );

  return { route: sorted[0] ?? null };
}
