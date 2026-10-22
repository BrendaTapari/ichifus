import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";

import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "Ichifus",
    template: "%s · Ichifus",
  },
  description: "Historial clínico veterinario para mascotas",
  applicationName: "Ichifus",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ichifus",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6d28d9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="violeta" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className={outfit.className}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
