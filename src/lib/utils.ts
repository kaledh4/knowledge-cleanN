import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getTagColor = (tag: string) => {
  // Simple fallback for when Supabase colors aren't loaded
  // Components should use getTagColorClasses from tag-utils.ts instead
  const colors = [
    'bg-red-900/60 border-red-500/50 text-red-200',
    'bg-blue-900/60 border-blue-500/50 text-blue-200',
    'bg-green-900/60 border-green-500/50 text-green-200',
    'bg-amber-900/60 border-amber-500/50 text-amber-200',
    'bg-purple-900/60 border-purple-500/50 text-purple-200',
    'bg-pink-900/60 border-pink-500/50 text-pink-200',
    'bg-indigo-900/60 border-indigo-500/50 text-indigo-200',
    'bg-orange-900/60 border-orange-500/50 text-orange-200',
    'bg-teal-900/60 border-teal-500/50 text-teal-200',
    'bg-cyan-900/60 border-cyan-500/50 text-cyan-200',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
