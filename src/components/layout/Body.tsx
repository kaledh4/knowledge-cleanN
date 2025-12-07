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
                navigator.serviceWorker.register('/sw.js').then(registration => {
                  console.log('SW registered: ', registration);
                }).catch(registrationError => {
                  console.log('SW registration failed: ', registrationError);
                  // Fallback: try to clear cache and reload if registration fails
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => {
                        if (name.includes('workbox') || name.includes('precache')) {
                          caches.delete(name);
                        }
                      });
                    });
                  }
                });
              });
            }
          `,
        }}
      />
    </>
  );
}