import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { NetworkBanner } from "../components/NetworkBanner";

const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const viewport: Viewport = {
  themeColor: "#090A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Musify • Music for a better you",
  description:
    "Next-generation glassmorphic music streaming web & Android player",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Musify",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* Preconnect & DNS-Prefetch for zero-latency network handshakes */}
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://musify-4fzw.onrender.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://musify-4fzw.onrender.com" />
        {/* Pre-warm YouTube Audio Engine API */}
        <script src="https://www.youtube.com/iframe_api" async id="yt-iframe-api"></script>
        {/* Mobile WebView Background Playback & Visibility Immunity */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                Object.defineProperty(document, 'hidden', { get: function() { return false; }, configurable: true });
                Object.defineProperty(document, 'visibilityState', { get: function() { return 'visible'; }, configurable: true });
                var stopEvt = function(e) { e.stopImmediatePropagation(); };
                document.addEventListener('visibilitychange', stopEvt, true);
                window.addEventListener('visibilitychange', stopEvt, true);
                window.addEventListener('blur', stopEvt, true);
                window.addEventListener('pagehide', stopEvt, true);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#090A0F] text-[#F5F5F7] selection:bg-[#292B4B] selection:text-[#A5A9FF]">
        <NetworkBanner />
        <Suspense fallback={<div className="min-h-screen bg-[#090A0F]" />}>
          {children}
        </Suspense>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
