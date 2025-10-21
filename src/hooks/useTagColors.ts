'use client';

import { useState, useEffect } from 'react';

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

  const fetchTagColors = async () => {
    if (globalLoadPromise) {
      await globalLoadPromise;
      return;
    }

    globalLoadPromise = (async () => {
      try {
        globalLoading = true;
        setLoading(true);
        const response = await fetch('/api/tags/colors');
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
    // Check if user has custom colors for this tag
    if (tagColors[tagName]) {
      const colors = tagColors[tagName];
      return `${colors.borderColor} ${colors.backgroundColor} ${colors.textColor} hover:opacity-80`;
    }

    // Default colors for known tags
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
      default:
        return 'border-accent/30 bg-accent/20 text-accent-foreground hover:bg-accent/30';
    }
  };

  const getCardBorderColor = (tagName: string): string => {
    // Check if user has custom colors for this tag
    if (tagColors[tagName]) {
      const colors = tagColors[tagName];
      // Extract the base color from the borderColor
      if (colors.borderColor.includes('red')) return 'border-l-red-500/60 border-l-4';
      if (colors.borderColor.includes('blue')) return 'border-l-blue-500/60 border-l-4';
      if (colors.borderColor.includes('green')) return 'border-l-green-500/60 border-l-4';
      if (colors.borderColor.includes('yellow')) return 'border-l-yellow-500/60 border-l-4';
      if (colors.borderColor.includes('purple')) return 'border-l-purple-500/60 border-l-4';
      if (colors.borderColor.includes('pink')) return 'border-l-pink-500/60 border-l-4';
      if (colors.borderColor.includes('orange')) return 'border-l-orange-500/60 border-l-4';
      if (colors.borderColor.includes('teal')) return 'border-l-teal-500/60 border-l-4';
    }

    // Default colors for known tags
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
      default:
        return '';
    }
  };

  return {
    tagColors,
    loading,
    getTagClasses,
    getCardBorderColor,
    refetch: fetchTagColors
  };
}