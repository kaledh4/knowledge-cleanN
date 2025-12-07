'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from '@/components/layout/Logo';

function ResetPasswordContent() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">Loading...</div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="mb-4 inline-block" />
          <h2 className="font-headline text-3xl font-bold tracking-tight text-primary">
            Password Management
          </h2>
          <p className="mt-2 text-muted-foreground">
            Password reset is handled via email token. If you have a token, use the reset link sent to you.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}