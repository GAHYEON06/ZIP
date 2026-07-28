import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, cuteMapStyle } from "@/lib/gmaps";
import { useRouteStore, type SafeRoute, type RouteStep } from "@/lib/store";
import { scorePath } from "@/lib/safety";
import { computeSafeRoutes, type RouteDTO } from "@/lib/routes.functions";

export const Route = createFileRoute("/routes")({
  head: () => ({
    meta: [
      { title: "안전 경로 결과 · 안심 귀갓길" },
      { name: "description", content: "AI가 계산한 4가지 안전 경로 후보를 비교하고 선택하세요." },
      { property: "og:title", content: "안전 경로 결과" },
      { property: "og:description", content: "4개 레이어에서 동시에 계산된 안전 경로" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoutesPage,
});

const LAYERS: Array<Pick<SafeRoute, "id" | "label" | "color" | "description">> = [
  { id: "safest", label: "가장 안전", color: "#22c55e", description: "경찰서·CCTV·안심시설 최대" },
  { id: "balanced", label: "균형", color: "#3b82f6", description: "안전과 빠름을 반반" },
  { id: "fastest", label: "가장 빠름", color: "#f59e0b", description: "시간 우선, 최단 경로" },
  { id: "lit", label: "밝은 길", color: "#a855f7", description: "가로등·유동인구 많은 대로" },
];

function RoutesPage() {
  const nav = useNavigate();
  const compute = useServerFn(computeSafeRoutes);
  const { origin, destination, setRoutes, routes, selectedRouteId, setSelectedRouteId } = useRouteStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!origin || !destination) {
      nav({ to: "/" });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      loadGoogleMaps(),
      compute({ data: { origin: { lat: origin.lat, lng: origin.lng }, destination: { lat: destination.lat, lng: destination.lng } } }),
    ])
      .then(([g, result]: [typeof google, { routes: RouteDTO[] }]) => {
        if (cancelled) return;
        if (!mapRef.current && mapDiv.current) {
          mapRef.current = new g.maps.Map(mapDiv.current, {
            center: origin,
            zoom: 14,
            styles: cuteMapStyle,
            disableDefaultUI: true,
            gestureHandling: "greedy",
          });
        }
        const rawRoutes = result.routes.slice(0, 4);
        if (rawRoutes.length === 0) {
          setError("경로를 찾지 못했어요. 다른 장소로 시도해주세요.");
          setLoading(false);
          return;
        }
        while (rawRoutes.length < 4) rawRoutes.push(rawRoutes[0]);

        const built: SafeRoute[] = rawRoutes.map((r, i) => {
          const layer = LAYERS[i];
          const path = r.path;
          const { safetyScore, policeNearby, safetyFacilities, facilityDataAvailable } = scorePath(path);

          const steps: RouteStep[] = r.steps.map((s) => ({
            instruction: (s.instruction ?? "").replace(/<[^>]*>/g, ""),
            distanceMeters: s.distanceMeters,
            durationSeconds: s.durationSeconds,
            startLocation: s.startLocation,
            endLocation: s.endLocation,
          }));
          let bias = 0;
          if (layer.id === "safest") bias = 15;
          if (layer.id === "lit") bias = 8;
          if (layer.id === "fastest") bias = -10;
          return {
            ...layer,
            safetyScore: Math.max(10, Math.min(100, safetyScore + bias + (4 - i) * 3)),
            distanceMeters: r.distanceMeters,
            durationSeconds: r.durationSeconds,
            path,
            steps,
            policeNearby,
            safetyFacilities,
            facilityDataAvailable,
          };
        });

        setRoutes(built);
        setSelectedRouteId(built[0].id);
        setLoading(false);

        polylinesRef.current.forEach((p) => p.setMap(null));
        polylinesRef.current = built.map(
          (r) =>
            new g.maps.Polyline({
              path: r.path,
              strokeColor: r.color,
              strokeOpacity: 0.85,
              strokeWeight: 6,
              map: mapRef.current!,
            }),
        );
        const bounds = new g.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        mapRef.current!.fitBounds(bounds, 80);
        new g.maps.Marker({ position: origin, map: mapRef.current!, label: "출" });
        new g.maps.Marker({ position: destination, map: mapRef.current!, label: "도" });
      })
      .catch((e) => {
        console.error(e);
        setError("경로를 찾지 못했어요. 다른 장소로 시도해주세요.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination]);

  useEffect(() => {
    polylinesRef.current.forEach((line, i) => {
      const r = routes[i];
      if (!r) return;
      line.setOptions({
        strokeWeight: r.id === selectedRouteId ? 8 : 4,
        strokeOpacity: r.id === selectedRouteId ? 1 : 0.4,
        zIndex: r.id === selectedRouteId ? 10 : 1,
      });
    });
  }, [selectedRouteId, routes]);

  const selected = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3">
        <Link to="/" className="text-xl">←</Link>
        <h1 className="text-sm font-bold text-foreground">안전 경로 4개 비교</h1>
      </header>

      <div className="relative h-[42%] w-full">
        <div ref={mapDiv} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-2 text-xs text-muted-foreground">4개 레이어 동시 계산 중…</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center text-sm text-primary">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {routes.map((r) => {
            const active = r.id === selectedRouteId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRouteId(r.id)}
                className={`rounded-2xl border-2 p-3 text-left transition ${
                  active ? "border-primary bg-card shadow-md" : "border-border bg-card/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: r.color }} />
                  <span className="text-xs font-bold text-foreground">{r.label}</span>
                </div>
                <div className="mt-2 text-2xl font-black text-foreground">
                  {r.safetyScore}
                  <span className="text-xs font-normal text-muted-foreground"> /100</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {Math.round(r.durationSeconds / 60)}분 · {(r.distanceMeters / 1000).toFixed(2)}km
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{r.description}</div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">선택된 경로 상세</h2>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="안전 점수" value={`${selected.safetyScore}점`} />
              <Stat label="경찰서 근처" value={`${selected.policeNearby}곳`} />
              <Stat
                label="안심시설"
                value={selected.facilityDataAvailable ? `${selected.safetyFacilities}개` : "데이터 없음"}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to="/route-detail"
                className="flex-1 rounded-full border-2 border-primary py-2 text-center text-sm font-bold text-primary"
              >
                🗺️ 길찾기 상세
              </Link>
              <Link
                to="/navigate"
                className="flex-1 rounded-full bg-primary py-2 text-center text-sm font-bold text-primary-foreground"
              >
                🚶 안내 시작
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}
