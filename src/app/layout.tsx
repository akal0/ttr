import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AureaTracking } from "@/components/aurea-tracking";
import { ClickIdCapture } from "@/components/click-id-capture";
import { Suspense } from "react";

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
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Tom's Trading Room - Master Prop Firm Trading",
    description:
      "Join hundreds of traders who've passed prop firm challenges and secured six-figure funding. Learn the exact frameworks that work.",
    siteName: "Tom's Trading Room",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Capture click IDs IMMEDIATELY before Next.js can strip them
              (function() {
                try {
                  const url = new URL(window.location.href);
                  const params = url.searchParams;
                  
                  const clickIds = {};
                  const now = Date.now();
                  
                  // Attribution windows in milliseconds
                  const windows = {
                    fbclid: 28 * 24 * 60 * 60 * 1000,
                    gclid: 90 * 24 * 60 * 60 * 1000,
                    ttclid: 28 * 24 * 60 * 60 * 1000,
                    msclkid: 90 * 24 * 60 * 60 * 1000
                  };
                  
                  // Extract all click IDs
                  const ids = ['fbclid', 'fbadid', 'gclid', 'gbraid', 'wbraid', 'dclid', 'ttclid', 'tt_content', 'msclkid', 'twclid', 'li_fat_id', 'ScCid', 'epik', 'rdt_cid'];
                  
                  ids.forEach(function(id) {
                    const value = params.get(id);
                    if (value) {
                      clickIds[id] = {
                        id: value,
                        timestamp: now,
                        expiresAt: now + (windows[id] || 30 * 24 * 60 * 60 * 1000)
                      };
                    }
                  });
                  
                  // Store in localStorage if we found any
                  if (Object.keys(clickIds).length > 0) {
                    const existing = localStorage.getItem('aurea_click_ids');
                    const existingData = existing ? JSON.parse(existing) : {};
                    const merged = Object.assign({}, existingData, clickIds);
                    localStorage.setItem('aurea_click_ids', JSON.stringify(merged));
                    console.log('[Early ClickID Capture] Saved:', Object.keys(clickIds).join(', '));
                  }
                } catch (e) {
                  console.error('[Early ClickID Capture] Error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Suspense fallback={null}>
          <ClickIdCapture />
        </Suspense>
        <AureaTracking />
        {children}
      </body>
    </html>
  );
}
