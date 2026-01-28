
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { DevTools } from "@/components/common/DevTools";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4F46E5",
};

export const metadata: Metadata = {
  title: {
    default: "MotorSafe",
    template: "%s | MotorSafe",
  },
  metadataBase: new URL("https://motorsafe.fr"),
  description: "Logiciel de gestion et protection juridique pour garages automobiles",
  applicationName: "MotorSafe",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MotorSafe",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body
        className="min-h-screen font-sans antialiased"
      >
        <ToastProvider>
          {children}
          {process.env.NODE_ENV === "development" ? <DevTools /> : null}
        </ToastProvider>
        <ServiceWorkerRegistration />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
