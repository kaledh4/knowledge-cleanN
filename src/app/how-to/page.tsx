'use client';

import { Brain, Plus, Search, Tag, Youtube, Twitter, FileText, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold">KnowledgeVerse</span>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Vault</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl font-bold mb-4">
            Welcome to Your Knowledge Universe
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            KnowledgeVerse is your personal knowledge management system. Capture insights from anywhere, 
            organize them with smart tags, and discover connections through powerful search.
          </p>
        </div>

        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Getting Started</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5 text-green-500" />
                  Add Knowledge
                </CardTitle>
                <CardDescription>
                  Start building your knowledge base by adding entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click the &quot;Add Entry&quot; button to create new knowledge entries. You can add text content,
                  YouTube videos, or X (Twitter) posts. Each entry is automatically processed and made searchable.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-blue-500" />
                  Organize with Tags
                </CardTitle>
                <CardDescription>
                  Use smart tags to categorize your knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tag your entries with categories like &quot;Important&quot;, &quot;Learning&quot;, &quot;AI&quot;, or &quot;Investing&quot;.
                  Tags help you organize and quickly filter your knowledge base.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Content Types */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">What You Can Add</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-purple-500" />
                  Text Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add notes, ideas, quotes, or any text-based knowledge. Perfect for capturing 
                  thoughts, meeting notes, or research findings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Youtube className="mr-2 h-5 w-5 text-red-500" />
                  YouTube Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Save YouTube videos for later reference. The system automatically extracts 
                  metadata and makes the content searchable.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Twitter className="mr-2 h-5 w-5 text-blue-400" />
                  X Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Capture interesting tweets and threads from X (formerly Twitter). 
                  Great for saving insights from thought leaders and industry experts.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tag System */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Smart Tag System</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                KnowledgeVerse uses a color-coded tag system to help you organize and quickly identify different types of content:
              </p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Badge className="border-red-500/40 bg-red-900/50 text-red-300">Important</Badge>
                  <span className="text-sm text-muted-foreground">Critical information</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="border-yellow-500/40 bg-yellow-900/50 text-yellow-300">To Do Research On</Badge>
                  <span className="text-sm text-muted-foreground">Future exploration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="border-blue-500/40 bg-blue-900/50 text-blue-300">Learning</Badge>
                  <span className="text-sm text-muted-foreground">Educational content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="border-purple-500/40 bg-purple-900/50 text-purple-300">AI</Badge>
                  <span className="text-sm text-muted-foreground">AI & technology</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="border-green-500/40 bg-green-900/50 text-green-300">Investing</Badge>
                  <span className="text-sm text-muted-foreground">Financial insights</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Search & Discovery */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Search & Discovery</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5 text-primary" />
                Powerful Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use the search bar to find entries across your entire knowledge base. The search is semantic, 
                meaning it understands context and can find related content even if you don&apos;t use exact keywords.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Tips */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Pro Tips</h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Use Descriptive Tags</h3>
                    <p className="text-sm text-muted-foreground">
                      The more specific your tags, the easier it will be to find and organize your knowledge later.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Regular Review</h3>
                    <p className="text-sm text-muted-foreground">
                      Periodically browse your knowledge base to rediscover insights and make new connections.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Cross-Reference</h3>
                    <p className="text-sm text-muted-foreground">
                      Use search to find related entries and build connections between different pieces of knowledge.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link href="/">
            <Button size="lg" className="font-semibold">
              Start Building Your Knowledge Universe
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}