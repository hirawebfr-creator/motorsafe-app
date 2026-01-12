"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ms_dev_last_origin";

export function DevOriginBanner() {
  const [mounted, setMounted] = useState(false);
  const [prevOrigin, setPrevOrigin] = useState<string | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const origin = window.location.origin;
    setCurrentOrigin(origin);

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== origin) {
        setPrevOrigin(stored);
      }
      window.localStorage.setItem(STORAGE_KEY, origin);
    } catch {
      // ignore storage errors
    }
  }, []);

  const backHref = useMemo(() => {
    if (!prevOrigin) return null;
    return `${prevOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, [prevOrigin]);

  if (!mounted || dismissed || !prevOrigin || !currentOrigin) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2147483646] border-t border-border bg-bg/95 px-4 py-3 text-sm text-text backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-semibold">Changement d’adresse détecté</div>
          <div className="text-xs text-muted2">
            Tu es passé de <span className="font-semibold">{prevOrigin}</span> à{" "}
            <span className="font-semibold">{currentOrigin}</span>. En dev, ça change les cookies/session → redirections.
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {backHref ? (
            <a
              href={backHref}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-surface px-3 text-xs font-semibold text-text hover:bg-surface2"
            >
              Revenir à {prevOrigin}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-surface px-3 text-xs font-semibold text-text hover:bg-surface2"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
