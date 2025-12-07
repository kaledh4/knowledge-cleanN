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
        {/* Placeholder for the actual image path once moved to public */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-80" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 m-auto h-5 w-5 text-white"
        >
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 16v.01" />
          <path d="M12 12v.01" />
          <path d="M12 17h.01" />
          <path d="M17 12h.01" />
        </svg>
      </div>
      <span className="font-headline text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-200 drop-shadow-sm">
        KnowledgeVerse
      </span>
    </div>
  );
}
