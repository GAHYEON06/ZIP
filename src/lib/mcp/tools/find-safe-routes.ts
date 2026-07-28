import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { computeRoutes } from "../../routes.core";
import { scorePath } from "../../safety";

const LAYERS = [
  { id: "safest", label: "가장 안전", description: "경찰서·CCTV·안심시설 최대", bias: 15 },
  { id: "balanced", label: "균형", description: "안전과 빠름을 반반", bias: 0 },
  { id: "fastest", label: "가장 빠름", description: "시간 우선, 최단 경로", bias: -10 },
  { id: "lit", label: "밝은 길", description: "가로등·유동인구 많은 대로", bias: 8 },
];

export default defineTool({
  name: "find_safe_routes",
  title: "Find safe routes",
  description:
    "Compute up to 4 candidate routes between two coordinates in Korea and score each one for safety using nationwide police-station data and Seoul-area CCTV/security-light data. Returns safety score, distance, duration and turn-by-turn directions per route.",
  inputSchema: {
    originLat: z.number().describe("Latitude of the starting point."),
    originLng: z.number().describe("Longitude of the starting point."),
    destinationLat: z.number().describe("Latitude of the destination."),
    destinationLng: z.number().describe("Longitude of the destination."),
    includeSteps: z
      .boolean()
      .describe("Include turn-by-turn steps for each route. Defaults to false."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ originLat, originLng, destinationLat, destinationLng, includeSteps }) => {
    try {
      const { routes } = await computeRoutes(
        { lat: originLat, lng: originLng },
        { lat: destinationLat, lng: destinationLng },
      );

      const scored = routes.slice(0, 4).map((r, i) => {
        const layer = LAYERS[i] ?? LAYERS[1];
        const s = scorePath(r.path);
        return {
          id: layer.id,
          label: layer.label,
          description: layer.description,
          safetyScore: Math.max(10, Math.min(100, s.safetyScore + layer.bias + (4 - i) * 3)),
          distanceMeters: r.distanceMeters,
          durationSeconds: r.durationSeconds,
          policeNearby: s.policeNearby,
          safetyFacilities: s.facilityDataAvailable ? s.safetyFacilities : null,
          facilityDataAvailable: s.facilityDataAvailable,
          steps: includeSteps
            ? r.steps.map((st) => ({
                instruction: st.instruction,
                distanceMeters: st.distanceMeters,
                durationSeconds: st.durationSeconds,
              }))
            : undefined,
        };
      });

      const best = [...scored].sort((a, b) => b.safetyScore - a.safetyScore)[0];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ recommended: best?.id, routes: scored }, null, 2),
          },
        ],
        structuredContent: { recommended: best?.id ?? null, routes: scored },
      };
    } catch (error) {
      return { content: [{ type: "text", text: (error as Error).message }], isError: true };
    }
  },
});
