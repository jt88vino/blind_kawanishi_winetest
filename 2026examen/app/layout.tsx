import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026年度 ソムリエ・ワインエキスパート二次試験",
  description: "ソムリエ・ワインエキスパート二次試験の回答を共有し、みんなの回答傾向を確認。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
