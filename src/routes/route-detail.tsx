import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import MapView from "@/components/MapView";
import { computeRoutes, type RouteDTO } from "@/lib/routes.functions";
import { useRouteSelection } from "@/lib/store";

export const Route = createFileRoute("/route-detail")({
  component: RouteDetail,
});

function RouteDetail() {
  const navigate = useNavigate();
  const { selectedRoute, setRoute } = useRouteSelection();
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("위치 서비스를 사용할 수 없어요.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("현재 위치를 불러올 수 없어요.")
    );
  }, []);

  const handleSelectRoute = async (routeId: string) => {
    if (!myPos) return;
    try {
      const res = await computeRoutes({
        data: {
          origin: myPos,
          destination: { lat: 37.5665, lng: 126.9780 },
        },
      });
      const target = res.routes.find((r) => r.id === routeId);
      if (target) {
        setRoute(target);
        navigate({ to: "/navigate" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3">
        <Link to="/" className="text-xl">←</Link>
        <h1 className="text-sm font-bold text-foreground">안심 경로 상세정보</h1>
      </header>

      <div className="relative h-[40%] w-full">
        {myPos && <MapView origin={myPos} destination={{ lat: 37.5665, lng: 126.9780 }} />}
        {error && (
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/95 p-3 text-center text-xs text-primary shadow">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedRoute ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">{selectedRoute.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedRoute.summary}</p>
            </div>
            <button
              onClick={() => handleSelectRoute(selectedRoute.id)}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow"
            >
              이 경로로 안내 시작
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">선택된 경로가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
