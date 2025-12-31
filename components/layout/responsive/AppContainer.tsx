import React from "react";

/**
 * AppContainer
 * - Wraps the entire app, applies container queries if needed
 * - Handles safe-area, dark mode, and min-h-screen
 */
export default function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-background-dark dark:text-foreground-dark pt-safe pb-safe @container">
      {children}
    </div>
  );
}
