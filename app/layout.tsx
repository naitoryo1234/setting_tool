import type { Metadata } from "next";
import { Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "設鑑 | SEKKAN",
  description: "パチスロ稼働データ蓄積・設定分析ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={notoSerifJP.className}>
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          <Navigation />
          <main className="main-content container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
