import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { searchPlaces } from "../kakao";

export default defineTool({
  name: "search_place",
  title: "Search a place in Korea",
  description:
    "Search Korean places by name or keyword (e.g. '성신여자대학교') and get their coordinates, so they can be used as an origin or destination for safe-route planning.",
  inputSchema: {
    query: z.string().min(1).describe("Place name or keyword to search for, in Korean or English."),
    limit: z.number().int().describe("Maximum number of results to return (1-15). Defaults to 5."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, limit }) => {
    try {
      const places = await searchPlaces(query, limit || 5);
      if (places.length === 0) {
        return { content: [{ type: "text", text: `No places found for "${query}".` }] };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(places, null, 2) }],
        structuredContent: { places },
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  },
});
