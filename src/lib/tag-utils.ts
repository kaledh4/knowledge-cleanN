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
 * Get the border color for a card based on its first tag
 */
export function getCardBorderColor(
    firstTag: string | undefined,
    tagColors: Record<string, TagColor>
): string {
    if (!firstTag) return 'border-l-primary/30';

    //Check if user has custom color
    if (tagColors[firstTag]) {
        // Extract the border color and make it more prominent for the card border
        const borderColor = tagColors[firstTag].border_color;
        return `border-l-4 ${borderColor.replace('/40', '/80')}`;
    }

    // Fallback to color based on tag name
    const colorMap: Record<string, string> = {
        'A.I': 'border-l-purple-500',
        'LIFE': 'border-l-blue-500',
        'READ': 'border-l-green-500',
        'Research': 'border-l-pink-500',
        'WORK': 'border-l-orange-500',
    };

    return `border-l-4 ${colorMap[firstTag] || 'border-l-primary/50'}`;
}
