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

// 1. 구버전 코드 호환용 export
export const cuteMapStyle = [];

// 2. 구버전 loadGoogleMaps 호출 시 loadKakaoMaps 실행
export function loadGoogleMaps(): Promise<any> {
  return loadKakaoMaps();
}
