import { useEffect, useRef } from "react";
import { loadKakaoMaps } from "@/lib/gmaps";

export function MapView({
  center = { lat: 37.5636, lng: 126.99 },
  zoom = 3,
  onMap,
  className,
}: {
  center?: { lat: number; lng: number };
  zoom?: number;
  onMap?: (m: any) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps().then((kakao) => {
      if (cancelled || !ref.current) return;

      const options = {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: zoom,
      };

      const map = new kakao.maps.Map(ref.current, options);
      mapRef.current = map;
      onMap?.(map);

      // 전국 어디서든 사용자의 현재 위치로 지도 중심 이동
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const moveLatLng = new kakao.maps.LatLng(
              pos.coords.latitude,
              pos.coords.longitude
            );
            map.setCenter(moveLatLng);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={ref} className={className ?? "h-full w-full"} />;
}
