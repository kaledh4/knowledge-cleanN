'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Providers from '@/components/providers/Providers';

export default function Body({ children }: { children: React.ReactNode }) {
  const [bodyClassName, setBodyClassName] = useState('antialiased');

  useEffect(() => {
    setBodyClassName('antialiased loading');
    // Apply the class to the actual body element
    document.body.className = 'antialiased loading';

    const timer = setTimeout(() => {
      document.body.classList.remove('loading');
      setBodyClassName('antialiased');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="splash-screen">
        <Image src="/static/logo.png" className="logo" alt="KnowledgeVerse Logo" width={120} height={120} />
      </div>
      <div className="main-content">
        <Providers>{children}</Providers>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                // Get the base path from Next.js config (for GitHub Pages)
                const basePath = '${process.env.NEXT_PUBLIC_BASE_PATH || ''}';
                const swPath = basePath + '/sw.js';
                
                navigator.serviceWorker.register(swPath, { 
                  scope: basePath + '/' 
                }).then(registration => {
                  console.log('✅ Service Worker registered successfully:', registration.scope);
                }).catch(registrationError => {
                  console.warn('⚠️ Service Worker registration failed:', registrationError.message);
                  console.log('App will continue to work without offline support.');
                  // Gracefully degrade - app works fine without SW
                });
              });
            }
          `,
        }}
      />

    </>
  );
}