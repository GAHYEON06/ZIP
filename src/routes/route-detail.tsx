import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRouteStore } from "@/lib/store";

export const Route = createFileRoute("/route-detail")({
  head: () => ({
    meta: [
      { title: "경로 상세 안내 · 안심 귀갓길" },
      { name: "description", content: "선택한 안전 경로의 턴바이턴 상세 안내를 확인하세요." },
      { property: "og:title", content: "경로 상세 안내" },
      { property: "og:description", content: "안전 경로의 단계별 상세 지시" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RouteDetail,
});

function maneuverIcon(m?: string) {
  if (!m) return "↑";
  if (m.includes("left")) return "↰";
  if (m.includes("right")) return "↱";
  if (m.includes("uturn")) return "↩";
  if (m.includes("roundabout")) return "⟳";
  return "↑";
}

function RouteDetail() {
  const nav = useNavigate();
  const { routes, selectedRouteId, origin, destination } = useRouteStore();
  const route = routes.find((r) => r.id === selectedRouteId);
  useEffect(() => {
    if (!route) nav({ to: "/" });
  }, [route, nav]);
  if (!route) return null;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3">
        <Link to="/routes" className="text-xl">←</Link>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-foreground">{route.label} 경로 상세</h1>
          <p className="text-[10px] text-muted-foreground">
            {origin?.name} → {destination?.name}
          </p>
        </div>
        <span className="rounded-full px-2 py-1 text-[10px] font-bold text-white" style={{ background: route.color }}>
          {route.safetyScore}점
        </span>
      </header>

      <div className="border-b border-border bg-card p-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-muted-foreground">소요</div>
            <div className="font-bold">{Math.round(route.durationSeconds / 60)}분</div>
          </div>
          <div>
            <div className="text-muted-foreground">거리</div>
            <div className="font-bold">{(route.distanceMeters / 1000).toFixed(2)}km</div>
          </div>
          <div>
            <div className="text-muted-foreground">단계</div>
            <div className="font-bold">{route.steps.length}개</div>
          </div>
        </div>
      </div>

      <ol className="flex-1 overflow-y-auto px-3 py-3">
        <StepRow icon="🚩" title="출발" sub={origin?.name ?? ""} />
        {route.steps.map((s, i) => (
          <StepRow
            key={i}
            icon={maneuverIcon(s.maneuver)}
            title={s.instruction || "직진"}
            sub={`${s.distanceMeters}m · ${Math.round(s.durationSeconds / 60)}분`}
          />
        ))}
        <StepRow icon="🏁" title="도착" sub={destination?.name ?? ""} />
      </ol>

      <div className="border-t border-border bg-card p-3">
        <Link
          to="/navigate"
          className="block w-full rounded-full bg-primary py-3 text-center text-sm font-bold text-primary-foreground"
        >
          🚶 이 경로로 안내 시작
        </Link>
      </div>
    </div>
  );
}

function StepRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <li className="flex items-start gap-3 border-b border-border/60 py-3 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-lg">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </li>
  );
}
