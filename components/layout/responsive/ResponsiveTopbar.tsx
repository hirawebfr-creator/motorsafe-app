import React from "react";

/**
 * ResponsiveTopbar
 * - Always sticky topbar
 * - Can add mobile/desktop variants if needed
 */
export default function ResponsiveTopbar({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-bg/70 border-b border-border flex items-center h-16 px-4 md:px-8 backdrop-blur-md">
      {children}
    </header>
  );
}
