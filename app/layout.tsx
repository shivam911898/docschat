import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

// Absolute base for Open Graph URLs: explicit PUBLIC_URL, else the Vercel production domain, else local dev.
const siteUrl =
  process.env.PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const TITLE = "DocsChat - AI chatbot trained on your documents";
const DESCRIPTION =
  "Turn your PDFs, FAQs and policies into a 24/7 support agent. Answers only from your own documents, says \"I don't know\" instead of guessing, captures leads, and embeds with one line of code.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl.replace(/\/$/, "")),
  title: { default: TITLE, template: "%s - DocsChat" },
  description: DESCRIPTION,
  applicationName: "DocsChat",
  authors: [{ name: "Shivam Kumar Yadav", url: "https://github.com/shivam911898" }],
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    type: "website",
    siteName: "DocsChat",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DocsChat: an AI chatbot that answers from your own documents" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.png"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4F46E5" };

export default function Layout({ children }: { children: ReactNode }) {
  // suppressHydrationWarning: the /chat page adds an "embedded" class to <html> before hydration when it runs inside the widget iframe.
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
