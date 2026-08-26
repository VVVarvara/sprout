import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sprout — Nutrition & Lifestyle Coaching",
  description: "Local-first coaching platform: check-ins, questionnaires, progress and documents."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
