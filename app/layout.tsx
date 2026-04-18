import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Re:Stock | あるもんメンテナンス",
  description: "家にある食材で、今日のごはんを決める。Re:Core 会員向け献立サポートアプリ",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Re:Stock',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full`}>
      <body className="min-h-full font-[family-name:var(--font-noto-sans-jp)] antialiased">
        {children}
      </body>
    </html>
  );
}
