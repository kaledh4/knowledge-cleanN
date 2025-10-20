'use client';

import { FileDown, Download, Database, FileJson, FileSpreadsheet, Brain, ArrowRight, ArrowLeft, Code, Package, Cpu, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function ExportPage() {
  const [isExportingMCP, setIsExportingMCP] = useState(false);
  const [mcpExportStatus, setMcpExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleMCPExport = async () => {
    try {
      setIsExportingMCP(true);
      setMcpExportStatus('idle');

      const response = await fetch('/api/export/mcp');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the filename from headers or create a default one
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || 'knowledge-vault-mcp.json';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMcpExportStatus('success');
    } catch (error) {
      console.error('MCP Export error:', error);
      setMcpExportStatus('error');
    } finally {
      setIsExportingMCP(false);
    }
  };
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
            Export Your Knowledge Vault
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download your entire knowledge base in various formats. Perfect for backups, analysis,
            or migrating to other platforms.
          </p>
        </div>

        {/* Export Options */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Available Export Formats</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* MCP Export - First and highlighted */}
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-primary/5">
              {mcpExportStatus === 'success' && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="mr-2 h-5 w-5 text-primary" />
                  MCP Package Export
                </CardTitle>
                <CardDescription>
                  Machine Context Protocol ready for LLM/AGI integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your knowledge vault in MCP format - optimized for next-gen local or cloud LLMs.
                  Includes semantic structure, relationships, and metadata for AI context understanding.
                </p>
                <div className="space-y-2 mb-4">
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    Available Now
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    • Semantic relationships between entries<br/>
                    • Entity extraction and categorization<br/>
                    • LLM-ready JSON structure<br/>
                    • Complete metadata preservation
                  </div>
                </div>
                <Button
                  onClick={handleMCPExport}
                  disabled={isExportingMCP}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isExportingMCP ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export MCP Package
                    </>
                  )}
                </Button>
                {mcpExportStatus === 'success' && (
                  <p className="text-sm text-green-600 mt-2 text-center">
                    ✅ Your export is now MCP-ready — usable with next-gen local or cloud LLMs.
                  </p>
                )}
                {mcpExportStatus === 'error' && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    ❌ Export failed. Please try again.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-purple-500" />
                  Vector Database Export
                </CardTitle>
                <CardDescription>
                  Export with embeddings for AI-powered search systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your knowledge entries along with their vector embeddings. Perfect for importing
                  into vector databases like Pinecone, Weaviate, or ChromaDB.
                </p>
                <div className="space-y-2 mb-4">
                  <Badge variant="outline" className="text-purple-500 border-purple-500/30">
                    Coming Soon
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    • JSON format with embeddings<br/>
                    • Compatible with major vector databases<br/>
                    • Includes metadata and tags
                  </div>
                </div>
                <Button disabled className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Vector Data
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileJson className="mr-2 h-5 w-5 text-blue-500" />
                  JSON Export
                </CardTitle>
                <CardDescription>
                  Complete data export in structured JSON format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export all your knowledge entries in a clean JSON format. Includes all content,
                  metadata, tags, and timestamps for easy processing.
                </p>
                <div className="space-y-2 mb-4">
                  <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                    Coming Soon
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    • Human-readable JSON<br/>
                    • Full data preservation<br/>
                    • Easy to parse and process
                  </div>
                </div>
                <Button disabled className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-5 w-5 text-green-500" />
                  CSV Export
                </CardTitle>
                <CardDescription>
                  Tabular format for spreadsheet applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your knowledge entries as CSV files. Perfect for importing into Excel,
                  Google Sheets, or data analysis tools.
                </p>
                <div className="space-y-2 mb-4">
                  <Badge variant="outline" className="text-green-500 border-green-500/30">
                    Coming Soon
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    • Excel-compatible format<br/>
                    • Separate files for entries and tags<br/>
                    • Easy data manipulation
                  </div>
                </div>
                <Button disabled className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5 text-orange-500" />
                  Archive Export
                </CardTitle>
                <CardDescription>
                  Complete archive with all files and media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your entire knowledge vault as a compressed archive. Includes all data,
                  extracted content, and media files.
                </p>
                <div className="space-y-2 mb-4">
                  <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                    Coming Soon
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    • Complete backup<br/>
                    • Includes all media files<br/>
                    • Self-contained archive
                  </div>
                </div>
                <Button disabled className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Archive
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* MCP Integration Details */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Machine Context Protocol (MCP)</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="mr-2 h-5 w-5 text-primary" />
                LLM-Ready Knowledge Export
              </CardTitle>
              <CardDescription>
                Optimized for next-generation AI systems and AGI integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                The MCP export format transforms your personal knowledge vault into a structured, semantically-rich dataset
                that LLMs and AI systems can easily understand and process. Perfect for building custom AI assistants,
                knowledge graphs, or training specialized language models.
              </p>

              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Semantic Structure</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automatic content categorization</li>
                    <li>• Entity extraction and recognition</li>
                    <li>• Relationship mapping between entries</li>
                    <li>• Context-aware metadata enrichment</li>
                    <li>• Temporal and thematic clustering</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">AI Integration Ready</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• LLM context optimization</li>
                    <li>• Vector database compatibility</li>
                    <li>• Knowledge graph structure</li>
                    <li>• Cross-reference linking</li>
                    <li>• Query-ready indexing</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg mb-6">
                <h4 className="font-semibold mb-2">Export Structure:</h4>
                <pre className="text-xs overflow-x-auto">
{`{
  "version": "1.0.0",
  "format": "MCP_KNOWLEDGE_VAULT",
  "user": { "id": "...", "name": "..." },
  "entries": [
    {
      "id": 1,
      "title": "...",
      "content": "...",
      "semantic_category": "...",
      "entities": ["..."],
      "relationships": [...],
      "metadata": {...}
    }
  ],
  "semantic_summary": {
    "main_topics": ["..."],
    "knowledge_domains": ["..."],
    "relationships": [...]
  }
}`}
                </pre>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Future Enhancements</h4>
                  <p className="text-sm text-muted-foreground">
                    Vector embeddings • Multi-modal support • Real-time sync
                  </p>
                </div>
                <Button onClick={handleMCPExport} disabled={isExportingMCP} className="bg-primary hover:bg-primary/90">
                  {isExportingMCP ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export MCP Package
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Developer Options */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Developer Options</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2 h-5 w-5 text-primary" />
                API Export
              </CardTitle>
              <CardDescription>
                Programmatic access to your knowledge data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Access your knowledge data programmatically through our REST API. Perfect for custom
                integrations, data analysis, or building custom applications.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-4">
                <code className="text-sm">
                  GET /api/knowledge<br/>
                  GET /api/knowledge/export
                </code>
              </div>
              <Button variant="outline" disabled>
                View API Documentation
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Export Information */}
        <section className="mb-12">
          <h2 className="font-headline text-2xl font-bold mb-6">Export Information</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">What's Included</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All knowledge entries and content</li>
                    <li>• Tags and categorization</li>
                    <li>• Metadata and timestamps</li>
                    <li>• Search history and filters</li>
                    <li>• User preferences and settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Privacy & Security</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Your data never leaves your control</li>
                    <li>• All exports are encrypted</li>
                    <li>• No third-party data sharing</li>
                    <li>• GDPR compliant</li>
                    <li>• Local processing only</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Status */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <FileDown className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Export Status</h3>
                <p className="text-sm text-muted-foreground">
                  We're actively developing the export functionality with priority on vector database exports.
                  The feature will be available in the coming weeks. Sign up for updates to be notified when it's ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/customize-tags">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Customize Tags
            </Button>
          </Link>
          <Link href="/">
            <Button className="flex items-center">
              Back to Vault
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}