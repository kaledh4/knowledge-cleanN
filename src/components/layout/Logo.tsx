import { cn } from '@/lib/utils';
import Image from 'next/image';

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Use the generated logo if available, otherwise fallback to text/icon */}
      <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
        <Image
          src="/static/logo.png"
          alt="Logo"
          fill
          className="object-cover"
        />
      </div>
      <span className="font-headline text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-200 drop-shadow-sm">
        KnowledgeVerse
      </span>
    </div>
  );
}
