import { useEffect, useRef } from "react";
import { loadKakaoMaps } from "@/lib/gmaps";
import { RouteDTO } from "@/lib/routes.functions";

interface MapViewProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  routes?: RouteDTO[];
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
}

export function MapView({
  origin,
  destination,
  routes = [],
  selectedRouteId,
  onSelectRoute,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    let isCancelled = false;

    loadKakaoMaps().then((kakao) => {
      if (isCancelled || !containerRef.current) return;

      if (!mapRef.current) {
        const center = new kakao.maps.LatLng(origin.lat, origin.lng);
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center,
          level: 4,
        });
      }

      const map = mapRef.current;

      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

      routes.forEach((r) => {
        const path = r.path.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
        const isSelected = r.id === selectedRouteId;

        const polyline = new kakao.maps.Polyline({
          path,
          strokeWeight: isSelected ? 6 : 4,
          strokeColor: isSelected ? "#3b82f6" : "#9ca3af",
          strokeOpacity: isSelected ? 0.9 : 0.5,
          map,
        });

        if (onSelectRoute) {
          kakao.maps.event.addListener(polyline, "click", () => {
            onSelectRoute(r.id);
          });
        }

        polylinesRef.current.push(polyline);
      });

      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(new kakao.maps.LatLng(origin.lat, origin.lng));
      bounds.extend(new kakao.maps.LatLng(destination.lat, destination.lng));
      map.setBounds(bounds);
    });

    return () => {
      isCancelled = true;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, routes, selectedRouteId]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export default MapView;
