import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, Search, Star, LogOut, Shield, MessageSquare, Siren } from "lucide-react";
import { MapView } from "@/components/MapView";

export const Route = createFileRoute("/")({
  component: MainWard,
});

function MainWard() {
  const [origin, setOrigin] = useState<{ lat: number; lng: number }>({
    lat: 37.5665,
    lng: 126.9780,
  });
  const [destination, setDestination] = useState<{ lat: number; lng: number }>({
    lat: 37.541,
    lng: 127.001,
  });

  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOrigin({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => console.log("위치 정보를 가져올 수 없습니다.")
      );
    }
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-amber-50/20 font-sans">
      {/* 1. 배경 지도 컴포넌트 */}
      <div className="absolute inset-0 h-full w-full">
        <MapView origin={origin} destination={destination} />
      </div>

      {/* 2. 상단 검색 오버레이 레이아웃 */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 gap-2">
        {/* 좌측 햄버거 메뉴 버튼 */}
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm active:scale-95 transition">
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* 중앙 흰색 출발지/도착지 입력 박스 */}
        <div className="flex flex-1 flex-col rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-gray-100">
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

        {/* 우측 나가기/로그아웃 버튼 */}
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm active:scale-95 transition">
          <LogOut className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* 3. 하단 네비게이션 & 긴급신고 안심 바 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex h-20 items-end justify-between bg-amber-100/90 px-8 pb-3 rounded-t-3xl border-t border-amber-200/50 shadow-2xl backdrop-blur-md">
        {/* 보안화면 탭 */}
        <Link
          to="/security"
          className="flex flex-col items-center gap-0.5 text-gray-800 hover:text-red-500 transition"
        >
          <Shield className="h-6 w-6 stroke-[2]" />
          <span className="text-[11px] font-black tracking-tight">보안화면</span>
        </Link>

        {/* 중앙 원형 긴급신고 대형 버튼 */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => alert("112 및 보호자에게 긴급 알림을 전송합니다.")}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white border-4 border-red-500 shadow-xl active:scale-95 transition group"
          >
            <div className="flex flex-col items-center justify-center text-red-500">
              <Siren className="h-8 w-8 animate-pulse stroke-[2.5]" />
              <span className="text-xs font-black mt-0.5 tracking-tighter">긴급신고</span>
            </div>
          </button>
        </div>

        {/* 커뮤니티 탭 */}
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
