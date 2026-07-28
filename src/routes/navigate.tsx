import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, cuteMapStyle } from "@/lib/gmaps";
import { useRouteStore, useGuardian, useWardTrack } from "@/lib/store";

export const Route = createFileRoute("/navigate")({
  head: () => ({
    meta: [
      { title: "실시간 안내 · 안심 귀갓길" },
      { name: "description", content: "GPS 실시간 안내로 안전 경로를 따라가세요." },
      { property: "og:title", content: "실시간 안내" },
      { property: "og:description", content: "GPS 기반 턴바이턴 네비게이션" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Navigate,
});

function distance(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLon = toR(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

function Navigate() {
  const nav = useNavigate();
  const { routes, selectedRouteId, destination, currentPosition, setCurrentPosition } = useRouteStore();
  const { guardianPhone } = useGuardian();
  const setWardPosition = useWardTrack((s) => s.setWardPosition);

  const route = routes.find((r) => r.id === selectedRouteId);
  const isDriving = (route as any)?.travelMode === "DRIVING";

  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const meMarkerRef = useRef<google.maps.Marker | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [tracks, setTracks] = useState<google.maps.LatLngLiteral[]>([]);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!route) {
      nav({ to: "/" });
      return;
    }
    let cancelled = false;
    loadGoogleMaps().then((g) => {
      if (cancelled || !mapDiv.current) return;
      const start = route.path[0];
      const map = new g.maps.Map(mapDiv.current, {
        center: start,
        zoom: isDriving ? 15 : 17,
        styles: cuteMapStyle,
        disableDefaultUI: true,
        heading: 0,
        tilt: 45,
      });
      mapRef.current = map;
      new g.maps.Polyline({
        path: route.path,
        strokeColor: route.color,
        strokeWeight: 8,
        strokeOpacity: 0.9,
        map,
      });
      new g.maps.Marker({ position: destination!, map, label: "도" });
      meMarkerRef.current = new g.maps.Marker({
        position: start,
        map,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: isDriving ? 12 : 10,
          fillColor: isDriving ? "#ef4444" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
      });
    });

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPosition(p);
          setWardPosition(p, destination?.name ?? null);
          setTracks((prev) => [...prev, p]);

          if (mapRef.current && meMarkerRef.current) {
            meMarkerRef.current.setPosition(p);
            mapRef.current.panTo(p);
            if (pos.coords.heading != null && !isNaN(pos.coords.heading)) {
              mapRef.current.setHeading(pos.coords.heading);
            }
          }
        },
        (err) => console.warn("geolocation err", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
      );
    }
    return () => {
      cancelled = true;
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [route]);

  useEffect(() => {
    if (!route || !currentPosition) return;
    const currentStep = route.steps[stepIndex];
    if (!currentStep) return;
    const threshold = isDriving ? 30 : 20;

    if (distance(currentPosition, currentStep.endLocation) < threshold) {
      if (stepIndex + 1 >= route.steps.length) {
        setArrived(true);
      } else {
        setStepIndex((i) => i + 1);
      }
    }
  }, [currentPosition, stepIndex, route, isDriving]);

  if (!route) return null;
  const step = route.steps[stepIndex];
  const remainingMeters = route.steps.slice(stepIndex).reduce((s, x) => s + x.distanceMeters, 0);
  const remainingSec = route.steps.slice(stepIndex).reduce((s, x) => s + x.durationSeconds, 0);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <div className="bg-primary p-4 text-primary-foreground">
        <div className="mb-1 flex items-center justify-between text-xs opacity-80">
          <span className="font-semibold">{isDriving ? "🚗 차량 경로 안내" : "🚶 도보 경로 안내"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-4xl font-black">
            {step?.maneuver?.includes("left") ? "↰" : step?.maneuver?.includes("right") ? "↱" : "↑"}
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold leading-tight">
              {step?.instruction || "목적지 근처입니다"}
            </div>
            <div className="mt-1 text-xs opacity-90">
              {step?.distanceMeters}m 앞
            </div>
          </div>
          <Link to="/routes" aria-label="종료" className="text-2xl">✕</Link>
        </div>
      </div>

      <div className="relative flex-1">
        <div ref={mapDiv} className="h-full w-full" />
        {guardianPhone && (
          <div className="absolute left-3 top-3 rounded-full bg-safe/90 px-3 py-1 text-[10px] font-bold text-white shadow">
            👥 보호자 실시간 공유 중 · {tracks.length}지점
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-muted-foreground">남은 거리</div>
            <div className="text-base font-bold text-foreground">
              {(remainingMeters / 1000).toFixed(2)}km
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">예상 시간</div>
            <div className="text-base font-bold text-foreground">
              {Math.round(remainingSec / 60)}분
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">단계</div>
            <div className="text-base font-bold text-foreground">
              {stepIndex + 1}/{route.steps.length}
            </div>
          </div>
        </div>
      </div>

      {arrived && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-safe/95">
          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="text-6xl">🎉</div>
            <h2 className="mt-3 text-xl font-black text-foreground">도착했어요!</h2>
            <p className="mt-2 text-sm text-muted-foreground">안전하게 목적지에 도착하셨습니다.</p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground"
            >
              홈으로
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
