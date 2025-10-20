'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import KnowledgeVault from '@/components/knowledge/KnowledgeVault';
import { Spinner } from '@/components/ui/spinner';

export default function VaultPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect to login
  }

  return <KnowledgeVault />;
}
