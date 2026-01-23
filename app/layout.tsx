
import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { DevTools } from "@/components/common/DevTools";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MotorSafe",
    template: "%s | MotorSafe",
  },
  metadataBase: new URL("https://motorsafe.fr"),
  description: "Panel professionnel pour garages, interventions et conformite.",
  applicationName: "MotorSafe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body
        className={`${inter.variable} ${inter.variable} ${plexMono.variable} min-h-screen font-sans antialiased`}
      >
        <ToastProvider>
          {children}
          {process.env.NODE_ENV === "development" ? <DevTools /> : null}
        </ToastProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
