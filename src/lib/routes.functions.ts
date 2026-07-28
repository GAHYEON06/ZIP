import { computeCandidateRoutes } from "./routes.core";

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

  const routes = computeCandidateRoutes(origin, destination);
  return { routes };
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
