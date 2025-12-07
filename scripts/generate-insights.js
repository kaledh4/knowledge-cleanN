import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openRouterKey) {
    console.error('Missing required environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateInsights() {
    console.log('Starting daily insight generation...');

    // 1. Get all distinct users who have added entries in the last 24 hours (or just all users for now to be safe)
    // For simplicity, we'll iterate all users who have entries.
    // Since we can't easily "list users" without admin API, we can get distinct user_ids from entries.

    const { data: userIds, error: userError } = await supabase
        .from('entries')
        .select('user_id');

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    // Get unique user IDs
    const uniqueUsers = [...new Set(userIds.map(u => u.user_id))];
    console.log(`Found ${uniqueUsers.length} users to process.`);

    for (const userId of uniqueUsers) {
        try {
            console.log(`Processing user: ${userId}`);

            // 2. Fetch user's entries (limit to last 50 or recent ones)
            const { data: entries, error: entriesError } = await supabase
                .from('entries')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (entriesError || !entries || entries.length === 0) {
                console.log(`No entries for user ${userId}, skipping.`);
                continue;
            }

            // 3. Convert to TOON
            // Simple inline conversion to avoid importing from src/lib which might have TS/browser dependencies
            let toonData = 'knowledge_entries:\n';
            entries.forEach(entry => {
                toonData += `  - title: ${JSON.stringify(entry.title || 'Untitled')}\n`;
                toonData += `    tags: [${(entry.tags || []).join(', ')}]\n`;
                toonData += `    content: |\n`;
                const contentLines = (entry.content || '').split('\n');
                contentLines.forEach(line => {
                    toonData += `      ${line}\n`;
                });
            });

            // 4. Call OpenRouter
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/kaledh4/daily-alpha-loop',
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-exp:free', // Or any other preferred model
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful knowledge assistant. Analyze the provided knowledge entries (in TOON format). Identify gaps in the user\'s knowledge based on the topics covered and suggest "Flashcards" for review. Format your response with clear headings: "## Knowledge Gaps" and "## Suggested Flashcards". Keep it concise.'
                        },
                        {
                            role: 'user',
                            content: toonData
                        }
                    ]
                })
            });

            if (!response.ok) {
                console.error(`OpenRouter API Error for user ${userId}: ${response.statusText}`);
                continue;
            }

            const aiData = await response.json();
            const content = aiData.choices[0]?.message?.content || 'No analysis generated.';

            // 5. Save to Insights table
            const { error: insertError } = await supabase
                .from('insights')
                .insert({
                    user_id: userId,
                    content: content,
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error(`Error saving insight for user ${userId}:`, insertError);
            } else {
                console.log(`Insight saved for user ${userId}`);
            }

        } catch (err) {
            console.error(`Error processing user ${userId}:`, err);
        }
    }

    console.log('Daily insight generation complete.');
}

generateInsights();
