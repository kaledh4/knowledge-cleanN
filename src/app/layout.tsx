import type { Metadata } from "next";
import "./globals.css";
import Body from "@/components/layout/Body";

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
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KnowledgeVerse" />
        <meta name="application-name" content="KnowledgeVerse" />
        <meta name="msapplication-TileColor" content="#9333ea" />
        <meta name="theme-color" content="#9333ea" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" sizes="180x180" href="/static/icons/icon-192.png" />
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
      <body className="antialiased">
        <Body>{children}</Body>
      </body>
    </html>
  );
}
