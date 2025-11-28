'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_TAGS } from '@/lib/types';

interface TagColors {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

interface TagColorsMap {
  [tagName: string]: TagColors;
}

// Cache colors globally to prevent loading delays
let globalTagColors: TagColorsMap = {};
let globalLoading = false;
let globalLoadPromise: Promise<void> | null = null;

export function useTagColors() {
  const [tagColors, setTagColors] = useState<TagColorsMap>(globalTagColors);
  const [loading, setLoading] = useState(globalLoading);

  const fetchTagColors = async (forceRefresh = false) => {
    if (globalLoadPromise) {
      await globalLoadPromise;
      return;
    }

    globalLoadPromise = (async () => {
      try {
        globalLoading = true;
        setLoading(true);

        // Add cache busting for force refresh
        const url = forceRefresh ? '/api/tags/colors?t=' + Date.now() : '/api/tags/colors';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          globalTagColors = data.tagColors || {};
          setTagColors(globalTagColors);
        }
      } catch (error) {
        console.error('Error fetching tag colors:', error);
      } finally {
        globalLoading = false;
        setLoading(false);
        globalLoadPromise = null;
      }
    })();

    await globalLoadPromise;
  };

  useEffect(() => {
    // If we already have colors, no need to load again
    if (Object.keys(globalTagColors).length > 0) {
      setTagColors(globalTagColors);
      setLoading(false);
      return;
    }

    fetchTagColors();
  }, []);

  const getTagClasses = (tagName: string): string => {
    // Ensure tagName is a valid string
    if (!tagName || typeof tagName !== 'string') {
      return 'border-accent/30 bg-accent/20 text-accent-foreground hover:bg-accent/30';
    }

    // Check if user has custom colors for this tag
    if (tagColors && tagColors[tagName]) {
      const colors = tagColors[tagName];
      // Ensure colors exists and has required properties
      if (colors && colors.borderColor && colors.backgroundColor && colors.textColor) {
        return `${colors.borderColor} ${colors.backgroundColor} ${colors.textColor} hover:opacity-80`;
      }
    }

    // Default colors for default tags
    switch (tagName) {
      case 'Important':
        return 'border-red-500/40 bg-red-900/50 text-red-300 hover:bg-red-900/80';
      case 'To Do Research On':
        return 'border-yellow-500/40 bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/80';
      case 'Learning':
        return 'border-blue-500/40 bg-blue-900/50 text-blue-300 hover:bg-blue-900/80';
      case 'AI':
        return 'border-purple-500/40 bg-purple-900/50 text-purple-300 hover:bg-purple-900/80';
      case 'Investing':
        return 'border-green-500/40 bg-green-900/50 text-green-300 hover:bg-green-900/80';
      case 'Finance':
        return 'border-orange-500/40 bg-orange-900/50 text-orange-300 hover:bg-orange-900/80';
      default:
        // Generate a consistent color for custom tags based on tag name
        const colors = [
          'border-pink-500/40 bg-pink-900/50 text-pink-300 hover:bg-pink-900/80',
          'border-teal-500/40 bg-teal-900/50 text-teal-300 hover:bg-teal-900/80',
          'border-indigo-500/40 bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/80',
          'border-cyan-500/40 bg-cyan-900/50 text-cyan-300 hover:bg-cyan-900/80',
          'border-amber-500/40 bg-amber-900/50 text-amber-300 hover:bg-amber-900/80',
          'border-lime-500/40 bg-lime-900/50 text-lime-300 hover:bg-lime-900/80',
          'border-emerald-500/40 bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/80',
          'border-violet-500/40 bg-violet-900/50 text-violet-300 hover:bg-violet-900/80',
        ];

        // Use a simple hash function to select a consistent color for custom tags
        let hash = 0;
        for (let i = 0; i < tagName.length; i++) {
          hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    }
  };

  const getCardBorderColor = (tagName: string): string => {
    // Ensure tagName is a valid string
    if (!tagName || typeof tagName !== 'string') {
      return '';
    }

    // Check if user has custom colors for this tag
    if (tagColors && tagColors[tagName]) {
      const colors = tagColors[tagName];
      // Ensure colors exists and has borderColor property
      if (colors && colors.borderColor && typeof colors.borderColor === 'string') {
        // Extract the base color from the borderColor
        if (colors.borderColor.includes('red')) return 'border-l-red-500/60 border-l-4';
        if (colors.borderColor.includes('blue')) return 'border-l-blue-500/60 border-l-4';
        if (colors.borderColor.includes('green')) return 'border-l-green-500/60 border-l-4';
        if (colors.borderColor.includes('yellow')) return 'border-l-yellow-500/60 border-l-4';
        if (colors.borderColor.includes('purple')) return 'border-l-purple-500/60 border-l-4';
        if (colors.borderColor.includes('pink')) return 'border-l-pink-500/60 border-l-4';
        if (colors.borderColor.includes('orange')) return 'border-l-orange-500/60 border-l-4';
        if (colors.borderColor.includes('teal')) return 'border-l-teal-500/60 border-l-4';
        if (colors.borderColor.includes('indigo')) return 'border-l-indigo-500/60 border-l-4';
        if (colors.borderColor.includes('cyan')) return 'border-l-cyan-500/60 border-l-4';
        if (colors.borderColor.includes('amber')) return 'border-l-amber-500/60 border-l-4';
        if (colors.borderColor.includes('lime')) return 'border-l-lime-500/60 border-l-4';
        if (colors.borderColor.includes('emerald')) return 'border-l-emerald-500/60 border-l-4';
        if (colors.borderColor.includes('violet')) return 'border-l-violet-500/60 border-l-4';
      }
    }

    // Default colors for default tags
    switch (tagName) {
      case 'Important':
        return 'border-l-red-500/60 border-l-4';
      case 'To Do Research On':
        return 'border-l-yellow-500/60 border-l-4';
      case 'Learning':
        return 'border-l-blue-500/60 border-l-4';
      case 'AI':
        return 'border-l-purple-500/60 border-l-4';
      case 'Investing':
        return 'border-l-green-500/60 border-l-4';
      case 'Finance':
        return 'border-l-orange-500/60 border-l-4';
      default:
        // Return border color for custom tags based on their hash color
        const colors = [
          'border-l-pink-500/60 border-l-4',
          'border-l-teal-500/60 border-l-4',
          'border-l-indigo-500/60 border-l-4',
          'border-l-cyan-500/60 border-l-4',
          'border-l-amber-500/60 border-l-4',
          'border-l-lime-500/60 border-l-4',
          'border-l-emerald-500/60 border-l-4',
          'border-l-violet-500/60 border-l-4',
        ];

        // Use the same hash function as getTagClasses for consistency
        let hash = 0;
        for (let i = 0; i < tagName.length; i++) {
          hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    }
  };

  const getTagHexColor = (tagName: string): string => {
    // Ensure tagName is a valid string
    if (!tagName || typeof tagName !== 'string') {
      return '#64748b'; // slate-500
    }

    // Check if user has custom colors for this tag
    if (tagColors && tagColors[tagName]) {
      const colors = tagColors[tagName];
      // Ensure colors exists and has borderColor property
      if (colors && colors.borderColor && typeof colors.borderColor === 'string') {
        // Extract the base color from the borderColor
        if (colors.borderColor.includes('red')) return '#ef4444';
        if (colors.borderColor.includes('blue')) return '#3b82f6';
        if (colors.borderColor.includes('green')) return '#22c55e';
        if (colors.borderColor.includes('yellow')) return '#eab308';
        if (colors.borderColor.includes('purple')) return '#a855f7';
        if (colors.borderColor.includes('pink')) return '#ec4899';
        if (colors.borderColor.includes('orange')) return '#f97316';
        if (colors.borderColor.includes('teal')) return '#14b8a6';
        if (colors.borderColor.includes('indigo')) return '#6366f1';
        if (colors.borderColor.includes('cyan')) return '#06b6d4';
        if (colors.borderColor.includes('amber')) return '#f59e0b';
        if (colors.borderColor.includes('lime')) return '#84cc16';
        if (colors.borderColor.includes('emerald')) return '#10b981';
        if (colors.borderColor.includes('violet')) return '#8b5cf6';
      }
    }

    // Default colors for default tags
    switch (tagName) {
      case 'Important': return '#ef4444'; // red-500
      case 'To Do Research On': return '#eab308'; // yellow-500
      case 'Learning': return '#3b82f6'; // blue-500
      case 'AI': return '#a855f7'; // purple-500
      case 'Investing': return '#22c55e'; // green-500
      case 'Finance': return '#f97316'; // orange-500
      default:
        // Return consistent color for custom tags based on hash
        const colors = [
          '#ec4899', // pink-500
          '#14b8a6', // teal-500
          '#6366f1', // indigo-500
          '#06b6d4', // cyan-500
          '#f59e0b', // amber-500
          '#84cc16', // lime-500
          '#10b981', // emerald-500
          '#8b5cf6', // violet-500
        ];

        // Use the same hash function as getTagClasses for consistency
        let hash = 0;
        for (let i = 0; i < tagName.length; i++) {
          hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    }
  };

  return {
    tagColors,
    loading,
    getTagClasses,
    getCardBorderColor,
    getTagHexColor,
    refetch: () => fetchTagColors(false),
    forceRefresh: () => fetchTagColors(true)
  };
}