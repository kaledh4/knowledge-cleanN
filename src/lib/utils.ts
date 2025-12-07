import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getTagColor = (tag: string) => {
  // Dark mode optimized colors
  const colors = [
    'bg-red-500/20 text-red-200 border-red-500/30',
    'bg-blue-500/20 text-blue-200 border-blue-500/30',
    'bg-green-500/20 text-green-200 border-green-500/30',
    'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
    'bg-purple-500/20 text-purple-200 border-purple-500/30',
    'bg-pink-500/20 text-pink-200 border-pink-500/30',
    'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
    'bg-orange-500/20 text-orange-200 border-orange-500/30',
    'bg-teal-500/20 text-teal-200 border-teal-500/30',
    'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
