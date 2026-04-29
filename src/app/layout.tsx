import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import dynamic from "next/dynamic";
import { DesignTokens } from "@takaki/go-design-system";
import "./globals.css";

const Toaster = dynamic(
  () =>
    import("@takaki/go-design-system").then((m) => ({ default: m.Toaster })),
  { ssr: false },
);

const Analytics = dynamic(
  () =>
    import("@vercel/analytics/react").then((m) => ({ default: m.Analytics })),
  { ssr: false },
);

const PWARegister = dynamic(
  () =>
    import("@/components/pwa-register").then((m) => ({
      default: m.PWARegister,
    })),
  { ssr: false },
);

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
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
  themeColor: "#DC2626",
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
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJP.variable}`}
      suppressHydrationWarning
    >
      <head>
        <DesignTokens primaryColor="#DC2626" primaryColorHover="#B91C1C" />
        <link
          rel="apple-touch-icon"
          href="/icons/apple-touch-icon.png"
          sizes="180x180"
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
        <PWARegister />
        <Analytics />
      </body>
    </html>
  );
}
