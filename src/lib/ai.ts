import { toToon } from './toon';
import { getKnowledgeEntries } from './knowledge-actions';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'KnowledgeVerse';

/**
 * Generate insight using AI with TOON-formatted context
 */
export async function generateInsight(contextData: any, prompt: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key is missing');
        return 'AI service unavailable (missing API key). Please add NEXT_PUBLIC_OPENROUTER_API_KEY to your environment variables.';
    }

    // Convert context data to TOON format to save tokens
    const toonContext = toToon(contextData);

    const systemPrompt = `You are a helpful AI assistant. 
Data is provided in TOON (Token-Oriented Object Notation) format, which is a compact representation of JSON designed for LLMs.
TOON uses YAML-like indentation for objects and CSV-style tabular layout for uniform arrays.
Analyze the data and answer the user's request.`;

    const userMessage = `Context Data (TOON format):
${toonContext}

Request: ${prompt}`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Use a free model as requested (Gemini 2.0 Flash via OpenRouter is often free/cheap)
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
        console.error('Error generating insight:', error);
        return `Failed to generate insight: ${error instanceof Error ? error.message : String(error)}`;
    }
}

/**
 * Retrieve knowledge entries and analyze them with AI
 */
export async function analyzeKnowledge(userId: string, query: string): Promise<string> {
    try {
        // Retrieve recent entries
        // We fetch a bit more since TOON is compact
        const { entries } = await getKnowledgeEntries(20, undefined, userId);

        // Prepare data for AI - simplify to save tokens further if needed
        const data = {
            userQuery: query,
            knowledgeBase: entries.map(e => ({
                id: e.id,
                title: e.title,
                content: e.content.substring(0, 500), // Truncate long content
                tags: e.tags.map(t => t.name),
                type: e.type,
                date: e.created_at
            }))
        };

        return generateInsight(data, `Analyze the knowledge base entries and answer: ${query}`);
    } catch (error) {
        console.error('Error analyzing knowledge:', error);
        return 'Failed to retrieve knowledge for analysis.';
    }
}
