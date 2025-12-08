import { TagColor } from './tagService';

/**
 * Get tag color classes from Supabase tagColors or use default
 */
export function getTagColorClasses(
    tagName: string,
    tagColors: Record<string, TagColor>
): string {
    // First check if user has custom color from Supabase
    if (tagColors[tagName]) {
        const colors = tagColors[tagName];
        return `${colors.background_color} ${colors.border_color} ${colors.text_color} font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90`;
    }

    // Fallback to default color scheme
    return getDefaultTagColor(tagName);
}

/**
 * Get default tag color (fallback when no Supabase color exists)
 */
function getDefaultTagColor(tag: string): string {
    const colors = [
        'bg-red-900/60 text-red-200 border-red-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-blue-900/60 text-blue-200 border-blue-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-green-900/60 text-green-200 border-green-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-amber-900/60 text-amber-200 border-amber-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-purple-900/60 text-purple-200 border-purple-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-pink-900/60 text-pink-200 border-pink-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-indigo-900/60 text-indigo-200 border-indigo-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-orange-900/60 text-orange-200 border-orange-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-teal-900/60 text-teal-200 border-teal-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
        'bg-cyan-900/60 text-cyan-200 border-cyan-500/50 font-medium px-3.5 py-1.5 text-sm transition-all duration-200 hover:opacity-90',
    ];

    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Get card styles (border, shadow, stripe) based on the first tag
 */
export function getCardStyles(
    firstTag: string | undefined,
    tagColors: Record<string, TagColor>
): { borderColor: string; shadowColor: string; stripeColor: string } {
    const defaultStyles = {
        borderColor: 'border-white/10',
        shadowColor: 'shadow-primary/5',
        stripeColor: 'bg-primary/20'
    };

    if (!firstTag) return defaultStyles;

    // Helper to extract color name from class (e.g., 'border-red-500/50' -> 'red-500')
    const extractColor = (className: string) => {
        const match = className.match(/border-([a-z]+-\d+)/);
        return match ? match[1] : null;
    };

    if (tagColors[firstTag]) {
        const colorClass = tagColors[firstTag].border_color;
        const colorName = extractColor(colorClass);

        if (colorName) {
            return {
                borderColor: `border-${colorName}/50`,
                shadowColor: `shadow-${colorName}/20`,
                stripeColor: `bg-${colorName}`
            };
        }
    }

    // Fallback logic if no custom color or regex fails
    // We can try to guess from the default tag colors if needed, but for now return a safe default
    // or try to match the fallback colors from getDefaultTagColor

    // Simple fallback map for common colors if regex fails
    const fallbackMap: Record<string, string> = {
        'A.I': 'purple-500',
        'LIFE': 'blue-500',
        'READ': 'green-500',
        'Research': 'pink-500',
        'WORK': 'orange-500',
    };

    const fallbackColor = fallbackMap[firstTag];
    if (fallbackColor) {
        return {
            borderColor: `border-${fallbackColor}/50`,
            shadowColor: `shadow-${fallbackColor}/20`,
            stripeColor: `bg-${fallbackColor}`
        };
    }

    return defaultStyles;
}
