'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { getKnowledgeEntries } from '@/lib/knowledge-actions';
import { toToon } from '@/lib/toon';
import { generateInsight } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

export default function ToonDemoPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toonOutput, setToonOutput] = useState('');
    const [jsonOutput, setJsonOutput] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [prompt, setPrompt] = useState('Summarize these entries');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const supabase = getSupabaseClient();
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { entries } = await getKnowledgeEntries(5, undefined, user.id);

            // Simplify for demo
            const simplified = entries.map(e => ({
                title: e.title,
                content: e.content.substring(0, 100) + '...',
                tags: e.tags,
                type: e.type
            }));

            setEntries(simplified);

            const json = JSON.stringify(simplified, null, 2);
            const toon = toToon(simplified);

            setJsonOutput(json);
            setToonOutput(toon);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAiAnalysis() {
        setAiLoading(true);
        try {
            const response = await generateInsight(entries, prompt);
            setAiResponse(response);
        } catch (error) {
            setAiResponse('Error: ' + String(error));
        } finally {
            setAiLoading(false);
        }
    }

    if (loading) return <div className="p-8"><Spinner /></div>;

    const jsonChars = jsonOutput.length;
    const toonChars = toonOutput.length;
    const savings = Math.round(((jsonChars - toonChars) / jsonChars) * 100);

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-3xl font-bold">TOON Project Demo</h1>
            <p className="text-muted-foreground">
                Token-Oriented Object Notation (TOON) vs JSON.
                Optimized for LLM input.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>JSON Format ({jsonChars} chars)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto h-64 text-xs">
                            {jsonOutput}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <span>TOON Format ({toonChars} chars)</span>
                            <span className="text-green-500">{savings}% Savings</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto h-64 text-xs">
                            {toonOutput}
                        </pre>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>AI Analysis (using TOON)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Ask AI about your data..."
                        />
                        <Button onClick={handleAiAnalysis} disabled={aiLoading}>
                            {aiLoading ? <Spinner className="mr-2" /> : null}
                            Analyze
                        </Button>
                    </div>

                    {aiResponse && (
                        <div className="bg-muted p-4 rounded-md">
                            <h3 className="font-semibold mb-2">AI Response:</h3>
                            <p className="whitespace-pre-wrap">{aiResponse}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
