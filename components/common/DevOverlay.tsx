"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function DevOverlay() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [origin, setOrigin] = useState<string>("(server)");

  useEffect(() => {
    setHydrated(true);
    setOrigin(window.location.origin);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 2147483647,
        pointerEvents: "none",
      }}
      className="rounded-2xl border border-border/70 bg-bg/90 px-4 py-3 text-sm text-text backdrop-blur"
    >
      <div className="font-extrabold tracking-tight">DEV OVERLAY</div>
      <div className="text-muted2">origin: {origin}</div>
      <div className="text-muted2">route: {pathname || "(unknown)"}</div>
      <div className="text-muted2">hydration: {hydrated ? "OK" : "pending"}</div>
    </div>
  );
}
