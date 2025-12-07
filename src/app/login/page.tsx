'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Spinner } from '@/components/ui/spinner';
import Logo from '@/components/layout/Logo';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="mb-4 inline-block" />
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary">
            Sign in to your Vault
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your personal knowledge universe awaits.
          </p>
        </div>

        <AuthDialog
          isOpen={true}
          onClose={() => router.push('/')}
          onSuccess={() => router.push('/')}
        />
      </div>
    </div>
  );
}
