// import "./globals.css"; // Temporarily disabled due to CSS parsing issues
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Persona × Playwright",
  description: "Think-aloud persona simulator with Playwright + OpenAI + SQLite"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}