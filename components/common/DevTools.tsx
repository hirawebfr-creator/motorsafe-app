"use client";

import { useEffect, useState } from "react";
import { DevOverlay } from "@/components/common/DevOverlay";
import { DevOriginBanner } from "@/components/common/DevOriginBanner";

const STORAGE_KEY = "ms_dev_tools";

export function DevTools() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const byQuery = params.get("dev") === "1" || params.get("__dev") === "1" || params.get("debug") === "1";
      const byStorage = window.localStorage.getItem(STORAGE_KEY) === "1";

      const nextEnabled = byQuery || byStorage;
      setEnabled(nextEnabled);

      if (byQuery) {
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
    } catch {
      // ignore
    }
  }, []);

  if (!enabled) return null;

  return (
    <>
      <DevOverlay />
      <DevOriginBanner />
    </>
  );
}
