import type { Metadata } from "next";
import { Cairo, Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import "./globals.css";
import Body from "@/components/layout/Body";

// Plus Jakarta Sans - Modern, clean, professional body font
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

// Cairo - Premium Arabic font with Latin support
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

// Outfit - Bold, modern headlines
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "KnowledgeVerse",
  description: "Your personal knowledge management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${plusJakarta.variable} ${outfit.variable} ${cairo.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KnowledgeVerse" />
        <meta name="application-name" content="KnowledgeVerse" />
        <meta name="msapplication-TileColor" content="#9333ea" />
        <meta name="theme-color" content="#9333ea" />
        <link rel="manifest" href="/knowledge-cleanN/manifest.json" />
        <link rel="apple-touch-icon" sizes="192x192" href="/knowledge-cleanN/static/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/knowledge-cleanN/static/icons/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/knowledge-cleanN/static/icons/icon-192.png" />
        <meta name="msapplication-config" content="none" />
        <style>
          {`
            body.loading .splash-screen {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              width: 100vw;
              position: fixed;
              top: 0;
              left: 0;
              background-color: #0f0f23;
              z-index: 9999;
            }
            body.loading .main-content {
              display: none;
            }
            body:not(.loading) .splash-screen {
              display: none;
            }
            .splash-screen .logo {
              width: 120px;
              opacity: 0;
              animation: fadeIn 1.5s ease-in forwards;
            }
            @keyframes fadeIn {
              to { opacity: 1; }
            }
          `}
        </style>
      </head>
      <body className="antialiased font-body">
        <Body>{children}</Body>
      </body>
    </html>
  );
}
