import { useEffect, useState } from "react";

export function DesktopBlock({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setOk(w <= 820 || touch);
      setReady(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  if (!ready) return null;
  if (!ok) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-3xl border-2 border-dashed border-primary/40 bg-card p-8 text-center shadow-lg">
          <div className="mb-3 text-5xl">📱</div>
          <h1 className="text-lg font-bold text-foreground">모바일 전용 앱이에요</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            안심 귀갓길은 모바일 기기에서만 사용할 수 있어요. 휴대폰으로 접속해주세요.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            (개발자 도구에서 기기 툴바를 켜서 확인할 수도 있어요)
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
