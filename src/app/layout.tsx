import type { Metadata, Viewport } from "next";
import { Inter, Sorts_Mill_Goudy } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from "@/components/sw-register";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const ebGaramond = Sorts_Mill_Goudy({
  subsets: ["latin"],
  variable: "--font-garamond",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magnifique — Управление персоналом",
  description: "Внутренний инструмент кейтеринговой компании Magnifique",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Magnifique",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" style={{ background: "#0D0D0D" }}>
      <body className={`${inter.className} ${ebGaramond.variable}`}>
        {children}
        <Toaster />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
