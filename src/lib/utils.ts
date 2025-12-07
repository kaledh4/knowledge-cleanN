import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getTagColor = (tag: string) => {
  // Enhanced vibrant colors with gradients for tags (Dark Mode Optimized)
  // These are fallback defaults when no custom color is set in Supabase
  const colors = [
    'bg-gradient-to-r from-red-900/70 to-red-800/70 text-red-200 border-red-500/50 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 font-medium',
    'bg-gradient-to-r from-blue-900/70 to-blue-800/70 text-blue-200 border-blue-500/50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 font-medium',
    'bg-gradient-to-r from-green-900/70 to-green-800/70 text-green-200 border-green-500/50 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 font-medium',
    'bg-gradient-to-r from-amber-900/70 to-amber-800/70 text-amber-200 border-amber-500/50 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 font-medium',
    'bg-gradient-to-r from-purple-900/70 to-purple-800/70 text-purple-200 border-purple-500/50 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 font-medium',
    'bg-gradient-to-r from-pink-900/70 to-pink-800/70 text-pink-200 border-pink-500/50 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 font-medium',
    'bg-gradient-to-r from-indigo-900/70 to-indigo-800/70 text-indigo-200 border-indigo-500/50 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 font-medium',
    'bg-gradient-to-r from-orange-900/70 to-orange-800/70 text-orange-200 border-orange-500/50 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 font-medium',
    'bg-gradient-to-r from-teal-900/70 to-teal-800/70 text-teal-200 border-teal-500/50 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 font-medium',
    'bg-gradient-to-r from-cyan-900/70 to-cyan-800/70 text-cyan-200 border-cyan-500/50 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 font-medium',
    'bg-gradient-to-r from-rose-900/70 to-rose-800/70 text-rose-200 border-rose-500/50 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 font-medium',
    'bg-gradient-to-r from-violet-900/70 to-violet-800/70 text-violet-200 border-violet-500/50 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 font-medium',
    'bg-gradient-to-r from-fuchsia-900/70 to-fuchsia-800/70 text-fuchsia-200 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 font-medium',
    'bg-gradient-to-r from-emerald-900/70 to-emerald-800/70 text-emerald-200 border-emerald-500/50 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 font-medium',
    'bg-gradient-to-r from-sky-900/70 to-sky-800/70 text-sky-200 border-sky-500/50 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 font-medium',
    'bg-gradient-to-r from-lime-900/70 to-lime-800/70 text-lime-200 border-lime-500/50 shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 font-medium',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
