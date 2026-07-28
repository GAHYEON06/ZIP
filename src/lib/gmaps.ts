// @ts-nocheck

// 카카오 지도 로더
export function loadKakaoMaps(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
      return;
    }

    const appkey =
      import.meta.env?.VITE_KAKAO_MAP_KEY ||
      import.meta.env?.KAKAO_REST_API_KEY ||
      "";

    if (!appkey) {
      reject(new Error("카카오 API 키가 설정되지 않았습니다."));
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false&libraries=services`;
    script.async = true;
    script.onerror = () => reject(new Error("카카오 지도 SDK 로드 실패"));
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };

    document.head.appendChild(script);
  });
}

// 빌드 에러 방지를 위한 기존 Google Maps 하위 호환 가짜/대체 함수들
export const cuteMapStyle = [];

export function loadGoogleMaps(): Promise<any> {
  // 기존 구글 지도를 호출하는 페이지들(navigate, MapView 등)이 터지지 않도록 카카오 지도로 연결해줍니다.
  return loadKakaoMaps();
}
