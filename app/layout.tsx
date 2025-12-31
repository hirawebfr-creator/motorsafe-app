
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/shell/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MotorSafe",
    template: "%s | MotorSafe",
  },
  description: "Panel professionnel pour garages, interventions et conformite.",
  applicationName: "MotorSafe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-[#0F0F14] text-[#F5F6FA]">
      <body className={`${inter.variable} ${jetbrains.variable} flex min-h-screen`}>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
