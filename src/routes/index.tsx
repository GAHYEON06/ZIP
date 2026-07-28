import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Menu, Search, Star, LogOut, Shield, MessageSquare, Siren, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: MainWard,
});

function MainWard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 메뉴 모달 상태

  useEffect(() => {
    // 1. Leaflet 스타일 시트 동적 로드
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // 2. Leaflet JS 로드 및 지도 초기화
    if (window.L) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);

    function initMap() {
      if (mapRef.current && window.L && !mapInstanceRef.current) {
        const apiKey = "1BD705BC-E920-3526-B69B-B1E5B4C5C659";
        
        // 브이월드 표준 타일 지도 URL
        const vworldUrl = `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`;

        // 지도 생성 (서울시청 중심)
        const map = window.L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([37.5665, 126.9780], 14);

        window.L.tileLayer(vworldUrl, {
          maxZoom: 19,
          minZoom: 6,
        }).addTo(map);

        mapInstanceRef.current = map;
      }
    }
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-amber-50/25 font-sans select-none">
      {/* 1. 배경 지도 영역 (CSS 필터로 파스텔톤 아기자기한 느낌 부여) */}
      <div 
        ref={mapRef} 
        className="absolute inset-0 h-full w-full z-0 filter saturate-[0.7] contrast-[0.95] brightness-[1.05]" 
      />

      {/* 2. 상단 검색 및 메뉴 오버레이 레이어 */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 gap-2 pointer-events-none">
        {/* 좌측 햄버거 버튼 (메뉴 열기) */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95 transition"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* 중앙 출발지 / 도착지 입력 박스 */}
        <div className="pointer-events-auto flex flex-1 flex-col rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-gray-100">
          {/* 출발지 */}
          <div className="flex items-center gap-2 py-1 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-800 shrink-0">출발지:</span>
            <input
              type="text"
              value={originText}
              onChange={(e) => setOriginText(e.target.value)}
              placeholder="내 위치 또는 장소 입력"
              className="w-full text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            />
            <button className="text-amber-400 hover:text-amber-500">
              <Star className="h-4 w-4 fill-amber-400" />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* 도착지 */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-xs font-bold text-gray-800 shrink-0">도착지:</span>
            <input
              type="text"
              value={destText}
              onChange={(e) => setDestText(e.target.value)}
              placeholder="목적지 입력"
              className="w-full text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
            />
            <button className="text-gray-500 hover:text-gray-700">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 우측 로그아웃/나가기 버튼 */}
        <button className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95 transition">
          <LogOut className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* 3. 메뉴 클릭 시 나타나는 사이드 메뉴 모달 (신고 기능 포함) */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 flex">
          {/* 배경 어둡게 처리 */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={() => setIsMenuOpen(false)}
          />
          {/* 메뉴 컨텐츠 박스 */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 text-base">전체 메뉴</h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                <button 
                  onClick={() => {
                    alert("위험 구역 / 가로등 고장 등 신고 화면으로 이동합니다.");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>위험 지역 / 시설 신고</span>
                </button>
                <Link to="/security" className="p-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium text-sm transition">
                  안심 보안 설정
                </Link>
                <Link to="/routes" className="p-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium text-sm transition">
                  커뮤니티 및 안심 경로 공유
                </Link>
              </div>
            </div>
            <div className="text-xs text-gray-400 text-center pb-2">
              안심 귀갓길 프로젝트 TEAM
            </div>
          </div>
        </div>
      )}

      {/* 4. 하단 안심 네비게이션 바 (보안화면 / 긴급신고 / 커뮤니티) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex h-20 items-end justify-between bg-amber-100/90 px-8 pb-3 rounded-t-3xl border-t border-amber-200/50 shadow-2xl backdrop-blur-md">
        {/* 보안화면 이동 링크 */}
        <Link
          to="/security"
          className="flex flex-col items-center gap-0.5 text-gray-800 hover:text-red-500 transition"
        >
          <Shield className="h-6 w-6 stroke-[2]" />
          <span className="text-[11px] font-black tracking-tight">보안화면</span>
        </Link>

        {/* 중앙 빨간색 원형 긴급신고 버튼 */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => alert("112 및 보호자에게 긴급 알림을 전송합니다.")}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white border-4 border-red-500 shadow-xl active:scale-95 transition"
          >
            <div className="flex flex-col items-center justify-center text-red-500">
              <Siren className="h-8 w-8 animate-pulse stroke-[2.5]" />
              <span className="text-xs font-black mt-0.5 tracking-tighter">긴급신고</span>
            </div>
          </button>
        </div>

        {/* 커뮤니티 이동 링크 */}
        <Link
          to="/routes"
          className="flex flex-col items-center gap-0.5 text-gray-800 hover:text-red-500 transition"
        >
          <MessageSquare className="h-6 w-6 stroke-[2]" />
          <span className="text-[11px] font-black tracking-tight">커뮤니티</span>
        </Link>
      </div>
    </div>
  );
}
