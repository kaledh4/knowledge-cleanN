import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export default function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-lg' },
    md: { icon: 'h-6 w-6', text: 'text-xl' },
    lg: { icon: 'h-8 w-8', text: 'text-2xl' },
  };

  const sizeClasses = sizes[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn(
        'relative overflow-hidden rounded-full p-2 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 ring-2 ring-primary/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-shadow duration-300',
      )}>
        <Brain className={cn(sizeClasses.icon, 'text-primary animate-pulse')} style={{ animationDuration: '3s' }} />
      </div>
      <span className={cn(
        'font-headline font-bold tracking-tight',
        'bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent',
        'drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]',
        sizeClasses.text
      )}>
        KnowledgeVerse
      </span>
    </div>
  );
}
