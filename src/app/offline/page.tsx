import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-6 bg-background text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <WifiOff className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          You are currently offline
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          It looks like you&apos;ve lost your connection. Please check your network status and try again.
        </p>
      </div>
    </div>
  );
}