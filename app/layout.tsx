import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocsChat - AI chatbot trained on your documents",
  description: "Turn your docs into a 24/7 support agent. Answers only from your own PDFs, FAQs and policies, captures leads, embeds with one line of code.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4f46e5" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
