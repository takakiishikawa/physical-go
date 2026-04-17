import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PhysicalGo",
  description: "撮る・記録する・振り返る。トレーニングが楽しくなる。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PhysicalGo",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563B0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster />
        <PWARegister />
      </body>
    </html>
  );
}
