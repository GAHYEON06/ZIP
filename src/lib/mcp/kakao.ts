// Shared Kakao helpers for MCP tools. No env reads at module scope.

export function kakaoKey(): string {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("KAKAO_REST_API_KEY is not configured on the server.");
  return key;
}

export type PlaceHit = {
  name: string;
  address: string;
  roadAddress: string;
  category: string;
  lat: number;
  lng: number;
};

export async function searchPlaces(query: string, limit = 5): Promise<PlaceHit[]> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", String(Math.min(Math.max(limit, 1), 15)));

  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey()}` } });
  if (!res.ok) {
    throw new Error(`Kakao place search failed [${res.status}]: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    documents?: Array<{
      place_name: string;
      address_name: string;
      road_address_name: string;
      category_group_name: string;
      category_name: string;
      x: string;
      y: string;
    }>;
  };
  return (json.documents ?? []).map((d) => ({
    name: d.place_name,
    address: d.address_name,
    roadAddress: d.road_address_name,
    category: d.category_group_name || d.category_name,
    lat: Number(d.y),
    lng: Number(d.x),
  }));
}
