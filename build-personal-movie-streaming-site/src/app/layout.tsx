import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyStream — Your Private Streaming Site",
  description: "Watch your own movie collection from anywhere, pulled from your hard drive and Google Drive.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0b0f] text-white antialiased">{children}</body>
    </html>
  );
}
