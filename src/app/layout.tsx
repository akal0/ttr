import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AureaTracking } from "@/components/aurea-tracking";

import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Tom's Trading Room - Master Prop Firm Trading & Build Six-Figure Accounts",
  description:
    "Join Tom's Trading Room and learn the exact frameworks hundreds of traders use to pass prop firm challenges, secure six-figure funding, and take their trading to the next level.",
  keywords: [
    "prop firm trading",
    "trading education",
    "forex trading",
    "prop trading",
    "Tom's Trading Room",
    "trading course",
    "funded trader",
    "FTMO",
    "prop firm challenge",
    "day trading",
  ],
  authors: [{ name: "Tom's Trading Room" }],
  creator: "Tom's Trading Room",
  publisher: "Tom's Trading Room",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  ),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    title: "Tom's Trading Room - Master Prop Firm Trading",
    description:
      "Join hundreds of traders who've passed prop firm challenges and secured six-figure funding. Learn the exact frameworks that work.",
    siteName: "Tom's Trading Room",
    images: [
      {
        url: "/og-poster.png",
        width: 2552,
        height: 1436,
        alt: "Tom's Trading Room - Prop Firm Trading Education",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tom's Trading Room - Master Prop Firm Trading",
    description:
      "Join hundreds of traders who've passed prop firm challenges and secured six-figure funding.",
    images: ["/og-poster.png"],
    creator: "@t0mbfx", // Update with actual Twitter handle if you have one
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AureaTracking />
        {children}
      </body>
    </html>
  );
}
