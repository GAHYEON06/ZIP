import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LatLng = z.object({ lat: z.number(), lng: z.number() });
const Input = z.object({ origin: LatLng, destination: LatLng });

export type RouteStepDTO = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  encodedPolyline: string;
};

export type RouteDTO = {
  encodedPolyline: string;
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStepDTO[];
};

type GoogleRoute = {
  distanceMeters?: number;
  duration?: string;
  polyline?: { encodedPolyline?: string };
  legs?: Array<{
    steps?: Array<{
      distanceMeters?: number;
      staticDuration?: string;
      navigationInstruction?: { instructions?: string; maneuver?: string };
      polyline?: { encodedPolyline?: string };
      startLocation?: { latLng?: { latitude: number; longitude: number } };
      endLocation?: { latLng?: { latitude: number; longitude: number } };
    }>;
  }>;
};

const parseSec = (d?: string) => (d ? parseInt(d.replace("s", ""), 10) || 0 : 0);

export const computeSafeRoutes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<{ routes: RouteDTO[] }> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmapsKey) throw new Error("Google Maps 게이트웨이 자격 증명이 설정되지 않았습니다.");

    const fieldMask = [
      "routes.duration",
      "routes.distanceMeters",
      "routes.polyline.encodedPolyline",
      "routes.legs.steps.navigationInstruction",
      "routes.legs.steps.distanceMeters",
      "routes.legs.steps.staticDuration",
      "routes.legs.steps.polyline.encodedPolyline",
      "routes.legs.steps.startLocation",
      "routes.legs.steps.endLocation",
    ].join(",");

    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gmapsKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: data.origin.lat, longitude: data.origin.lng } } },
          destination: { location: { latLng: { latitude: data.destination.lat, longitude: data.destination.lng } } },
          travelMode: "WALK",
          computeAlternativeRoutes: true,
          languageCode: "ko",
          regionCode: "KR",
          units: "METRIC",
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`Routes API failed [${res.status}]: ${body}`);
      throw new Error(`경로 계산 실패 (${res.status})`);
    }

    const json = (await res.json()) as { routes?: GoogleRoute[] };
    const routes: RouteDTO[] = (json.routes ?? []).map((r) => ({
      encodedPolyline: r.polyline?.encodedPolyline ?? "",
      distanceMeters: r.distanceMeters ?? 0,
      durationSeconds: parseSec(r.duration),
      steps: (r.legs?.[0]?.steps ?? []).map((s) => ({
        instruction: s.navigationInstruction?.instructions ?? "",
        distanceMeters: s.distanceMeters ?? 0,
        durationSeconds: parseSec(s.staticDuration),
        startLocation: {
          lat: s.startLocation?.latLng?.latitude ?? 0,
          lng: s.startLocation?.latLng?.longitude ?? 0,
        },
        endLocation: {
          lat: s.endLocation?.latLng?.latitude ?? 0,
          lng: s.endLocation?.latLng?.longitude ?? 0,
        },
        encodedPolyline: s.polyline?.encodedPolyline ?? "",
      })),
    }));

    return { routes };
  });
