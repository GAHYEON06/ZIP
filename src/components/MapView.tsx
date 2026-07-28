import { useEffect, useRef } from "react";
import { loadGoogleMaps, cuteMapStyle } from "@/lib/gmaps";

export function MapView({
  center = { lat: 37.5636, lng: 126.99 },
  zoom = 14,
  onMap,
  className,
}: {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  onMap?: (m: google.maps.Map) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((g) => {
      if (cancelled || !ref.current) return;
      const map = new g.maps.Map(ref.current, {
        center,
        zoom,
        styles: cuteMapStyle,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
      });
      mapRef.current = map;
      onMap?.(map);
      // 전국 어디서든 사용자의 현재 위치로 지도 중심 이동
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 },
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);
  return <div ref={ref} className={className ?? "h-full w-full"} />;
}
