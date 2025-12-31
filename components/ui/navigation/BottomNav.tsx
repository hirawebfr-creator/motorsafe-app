import React from "react";

/**
 * BottomNav
 * - Mobile only navigation bar (fixed bottom)
 */
export default function BottomNav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-background border-t border-border h-16 items-center justify-around">
      {children}
    </nav>
  );
}
