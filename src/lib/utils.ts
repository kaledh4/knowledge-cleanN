import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getTagColor = (tag: string) => {
  // Vibrant, bold colors for tags (Dark Mode Optimized)
  const colors = [
    'bg-red-600 text-white border-red-500 shadow-sm shadow-red-900/20',
    'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-900/20',
    'bg-green-600 text-white border-green-500 shadow-sm shadow-green-900/20',
    'bg-yellow-600 text-white border-yellow-500 shadow-sm shadow-yellow-900/20',
    'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-900/20',
    'bg-pink-600 text-white border-pink-500 shadow-sm shadow-pink-900/20',
    'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-900/20',
    'bg-orange-600 text-white border-orange-500 shadow-sm shadow-orange-900/20',
    'bg-teal-600 text-white border-teal-500 shadow-sm shadow-teal-900/20',
    'bg-cyan-600 text-white border-cyan-500 shadow-sm shadow-cyan-900/20',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
