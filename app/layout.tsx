import type { Metadata } from "next";
import { Syne, Fredoka, DM_Sans } from "next/font/google";
import { validateEnv } from "@/lib/env";
import "./globals.css";

// Skip env validation at build time — env vars are only injected at runtime
if (process.env.NEXT_PHASE !== "phase-production-build") {
  validateEnv();
}

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Curiova.ai — Where Curious Minds Level Up",
    template: "%s · Curiova.ai",
  },
  description:
    "Adaptive study and screen-time reward platform for families. CBSE, ICSE, US K-12 and IB curricula.",
  keywords: ["edtech", "adaptive learning", "CBSE", "ICSE", "US K-12", "IB", "screen time", "kids education"],
  authors: [{ name: "Curiova" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Curiova.ai",
    title: "Curiova.ai — Where Curious Minds Level Up",
    description: "Adaptive study and screen-time reward platform for families.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Curiova.ai — Where Curious Minds Level Up",
    description: "Adaptive study and screen-time reward platform for families.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${fredoka.variable} ${dmSans.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
