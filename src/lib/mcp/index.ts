import { defineMcp } from "@lovable.dev/mcp-js";
import findSafeRoutes from "./tools/find-safe-routes";
import nearbySafetyFacilities from "./tools/nearby-safety-facilities";
import searchPlace from "./tools/search-place";

export default defineMcp({
  name: "ziplog-safe-route-mcp",
  title: "안심 귀갓길 (Safe Route)",
  version: "0.1.0",
  instructions:
    "Tools for planning safe walking routes in Korea. Use `search_place` to turn a Korean place name into coordinates, `find_safe_routes` to compare up to 4 candidate routes scored by nearby police stations and CCTV/security lights, and `nearby_safety_facilities` to inspect the safety infrastructure around a single point.",
  tools: [searchPlace, findSafeRoutes, nearbySafetyFacilities],
});
