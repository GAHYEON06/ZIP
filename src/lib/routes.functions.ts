import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeFastest, computeRoutes } from "./routes.core";

export type { RouteDTO, RouteStepDTO } from "./routes.core";

const LatLng = z.object({ lat: z.number(), lng: z.number() });
const Input = z.object({ origin: LatLng, destination: LatLng });

export const computeSafeRoutes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => computeRoutes(data.origin, data.destination));

/** 보호자 → 피보호자 위치까지 가장 빠른 단일 경로 */
export const computeFastestRoute = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => computeFastest(data.origin, data.destination));
