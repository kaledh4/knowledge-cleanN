import { getSupabaseClient } from './supabase';

export interface Tag {
    name: string;
    usageCount: number;
}

export interface TagColor {
    tag_name: string;
    background_color: string;
    border_color: string;
    text_color: string;
}

/**
 * Get all tags used by the current user
 */
export async function getUserTags(): Promise<Tag[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all entries for the user
    const { data: entries, error } = await supabase
        .from('entries')
        .select('tags')
        .eq('user_id', user.id);

    if (error) throw error;

    // Count tag usage
    const tagCounts: Record<string, number> = {};
    entries?.forEach(entry => {
        entry.tags?.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    // Get custom colors to include tags that have colors but no usage yet
    const { data: colors } = await supabase
        .from('tag_colors')
        .select('tag_name')
        .eq('user_id', user.id);

    colors?.forEach(color => {
        if (!tagCounts[color.tag_name]) {
            tagCounts[color.tag_name] = 0;
        }
    });

    return Object.entries(tagCounts).map(([name, usageCount]) => ({
        name,
        usageCount,
    })).sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Get all tag colors for the current user
 */
export async function getTagColors(): Promise<Record<string, TagColor>> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('tag_colors')
        .select('*')
        .eq('user_id', user.id);

    if (error) throw error;

    const colors: Record<string, TagColor> = {};
    data?.forEach(color => {
        colors[color.tag_name] = {
            tag_name: color.tag_name,
            background_color: color.background_color,
            border_color: color.border_color,
            text_color: color.text_color,
        };
    });

    return colors;
}

/**
 * Save or update a tag color
 */
export async function saveTagColor(
    tagName: string,
    backgroundColor: string,
    borderColor: string,
    textColor: string
): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('tag_colors')
        .upsert({
            user_id: user.id,
            tag_name: tagName,
            background_color: backgroundColor,
            border_color: borderColor,
            text_color: textColor,
        }, {
            onConflict: 'user_id,tag_name'
        });

    if (error) throw error;
}

/**
 * Delete a tag color (reset to default)
 */
export async function deleteTagColor(tagName: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('tag_colors')
        .delete()
        .eq('user_id', user.id)
        .eq('tag_name', tagName);

    if (error) throw error;
}

/**
 * Rename a tag across all entries
 */
export async function renameTag(oldName: string, newName: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all entries with the old tag
    const { data: entries, error: fetchError } = await supabase
        .from('entries')
        .select('id, tags')
        .eq('user_id', user.id)
        .contains('tags', [oldName]);

    if (fetchError) throw fetchError;

    // Update each entry
    for (const entry of entries || []) {
        const updatedTags = entry.tags.map((tag: string) =>
            tag === oldName ? newName : tag
        );

        const { error: updateError } = await supabase
            .from('entries')
            .update({ tags: updatedTags })
            .eq('id', entry.id);

        if (updateError) throw updateError;
    }

    // Update tag color if it exists
    const { data: colorData } = await supabase
        .from('tag_colors')
        .select('*')
        .eq('user_id', user.id)
        .eq('tag_name', oldName)
        .single();

    if (colorData) {
        await supabase
            .from('tag_colors')
            .delete()
            .eq('user_id', user.id)
            .eq('tag_name', oldName);

        await supabase
            .from('tag_colors')
            .insert({
                user_id: user.id,
                tag_name: newName,
                background_color: colorData.background_color,
                border_color: colorData.border_color,
                text_color: colorData.text_color,
            });
    }
}

/**
 * Delete a tag from all entries
 */
export async function deleteTag(tagName: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all entries with this tag
    const { data: entries, error: fetchError } = await supabase
        .from('entries')
        .select('id, tags')
        .eq('user_id', user.id)
        .contains('tags', [tagName]);

    if (fetchError) throw fetchError;

    // Remove tag from each entry
    for (const entry of entries || []) {
        const updatedTags = entry.tags.filter((tag: string) => tag !== tagName);

        const { error: updateError } = await supabase
            .from('entries')
            .update({ tags: updatedTags })
            .eq('id', entry.id);

        if (updateError) throw updateError;
    }

    // Delete tag color if it exists
    await deleteTagColor(tagName);
}

/**
 * Create a new tag (just adds it to tag_colors so it appears in the list)
 */
export async function createTag(tagName: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Add with default colors
    const { error } = await supabase
        .from('tag_colors')
        .insert({
            user_id: user.id,
            tag_name: tagName,
            background_color: 'bg-accent/20',
            border_color: 'border-accent/30',
            text_color: 'text-accent-foreground',
        });

    if (error) throw error;
}
