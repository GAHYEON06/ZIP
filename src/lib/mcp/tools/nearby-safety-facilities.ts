import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import policeRaw from "../../../data/police.json";
import safetyRaw from "../../../data/safety.json";

type Point = { lat: number; lon: number };
const police = policeRaw as Point[];
const safety = safetyRaw as Point[];

function distM(a: { lat: number; lng: number }, b: Point) {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLon = toR(b.lon - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export default defineTool({
  name: "nearby_safety_facilities",
  title: "Count nearby safety facilities",
  description:
    "Count public safety infrastructure near a coordinate: police stations (nationwide) and CCTV / security lights (Seoul-area open data). Useful for judging how safe a specific spot is.",
  inputSchema: {
    lat: z.number().describe("Latitude of the point to inspect."),
    lng: z.number().describe("Longitude of the point to inspect."),
    radiusMeters: z.number().describe("Search radius in meters. Defaults to 500."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ lat, lng, radiusMeters }) => {
    const radius = Math.min(Math.max(radiusMeters || 500, 50), 5000);
    const at = { lat, lng };
    const policeCount = police.filter((p) => distM(at, p) < radius).length;
    const facilityCount = safety.filter((p) => distM(at, p) < radius).length;

    const result = {
      radiusMeters: radius,
      policeStations: policeCount,
      safetyFacilities: facilityCount,
      note: "Safety facility (CCTV / security light) data covers the Seoul area only; police station data is nationwide.",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
