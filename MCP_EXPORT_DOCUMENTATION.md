# Machine Context Protocol (MCP) Export Format

## Overview

The MCP export format transforms your KnowledgeVerse vault into a structured, semantically-rich dataset optimized for LLM/AGI integration. This format includes metadata, relationships, and semantic analysis to provide rich context for AI systems.

## Export Structure

```json
{
  "version": "1.0.0",
  "format": "MCP_KNOWLEDGE_VAULT",
  "created_at": "2024-01-15T10:30:00.000Z",
  "user": {
    "id": "user_123",
    "name": "John Doe"
  },
  "metadata": {
    "total_entries": 150,
    "total_tags": 25,
    "date_range": {
      "earliest": "2023-01-01T00:00:00.000Z",
      "latest": "2024-01-15T10:30:00.000Z"
    },
    "content_types": {
      "TEXT": 80,
      "YOUTUBE_LINK": 45,
      "X_POST_LINK": 20,
      "TIKTOK_LINK": 5
    },
    "tag_frequency": {
      "AI": 25,
      "Learning": 20,
      "Important": 18,
      "Investing": 15,
      "To Do Research On": 12
    }
  },
  "entries": [
    {
      "id": 1,
      "title": "Introduction to Machine Learning",
      "content": "Machine learning is a subset of artificial intelligence...",
      "url": "https://example.com/ml-intro",
      "type": "YOUTUBE_LINK",
      "tags": ["AI", "Learning", "Important"],
      "metadata": {
        "duration": "15:30",
        "channel": "AI Education"
      },
      "created_at": "2023-12-01T10:00:00.000Z",
      "updated_at": "2023-12-01T10:00:00.000Z",
      "content_hash": "a1b2c3d4e5f6",
      "word_count": 250,
      "semantic_category": "AI & Machine Learning",
      "entities": ["Machine Learning", "Artificial Intelligence", "AI Education"],
      "relationships": []
    }
  ],
  "relationships": [
    {
      "source_id": 1,
      "target_id": 5,
      "type": "thematic",
      "weight": 0.8,
      "description": "Shared tags: AI, Learning"
    },
    {
      "source_id": 1,
      "target_id": 3,
      "type": "temporal",
      "weight": 0.9,
      "description": "Created 2 days apart"
    }
  ],
  "semantic_summary": {
    "main_topics": ["AI", "Learning", "Important", "Investing", "Technology"],
    "knowledge_domains": ["Technology", "AI & Machine Learning", "Education & Learning", "Business & Finance"],
    "content_density": 180.5,
    "growth_trend": [
      {
        "date": "2023-11",
        "entries_count": 12
      },
      {
        "date": "2023-12",
        "entries_count": 18
      }
    ]
  }
}
```

## Key Features

### 1. Semantic Categorization
Each entry is automatically categorized into semantic domains:
- **Technology** - Code, programming, software development
- **AI & Machine Learning** - AI, ML, neural networks, algorithms
- **Business & Finance** - Business, finance, investment, markets
- **Science & Research** - Research, studies, experiments
- **Education & Learning** - Learning, education, tutorials
- **Productivity & Tools** - Productivity, workflows, tools
- **Social & Communication** - Social, communication, networks
- **Personal Development** - Personal growth, skills, habits
- **News & Current Events** - News, current events, updates
- **Entertainment & Media** - Media, entertainment, content
- **General** - Default category for uncategorized content

### 2. Entity Extraction
Automatic extraction of:
- URLs and links
- Hashtags (#tag)
- Mentions (@user)
- Capitalized words (potential entities)
- Proper nouns

### 3. Relationship Mapping
Entries are connected through:
- **Thematic relationships** - Based on shared tags
- **Temporal relationships** - Based on creation time proximity
- **Semantic relationships** - Based on content similarity

### 4. Content Analysis
- **Word count** - Entry length analysis
- **Content hash** - For duplicate detection
- **Category assignment** - Automatic semantic categorization
- **Entity recognition** - Key term extraction

## Use Cases

### 1. LLM Context Window
The MCP format provides structured context for LLMs:
```python
# Example: Loading MCP data for LLM context
import json

with open('knowledge-vault-mcp.json', 'r') as f:
    mcp_data = json.load(f)

# Build context from relevant entries
def build_context(query, mcp_data):
    relevant_entries = [
        entry for entry in mcp_data['entries']
        if any(tag in query.lower() for tag in entry['tags'])
    ]

    context = "User's Knowledge Base:\n"
    for entry in relevant_entries[:5]:  # Limit for context window
        context += f"- {entry['title']}: {entry['content'][:200]}...\n"

    return context
```

### 2. Vector Database Integration
```python
# Example: Preparing for ChromaDB
import chromadb

client = chromadb.Client()
collection = client.create_collection("knowledge_vault")

# Add entries with metadata
for entry in mcp_data['entries']:
    collection.add(
        documents=[entry['content']],
        metadatas=[{
            'id': entry['id'],
            'title': entry['title'],
            'tags': entry['tags'],
            'category': entry['semantic_category']
        }],
        ids=[str(entry['id'])]
    )
```

### 3. Knowledge Graph Construction
```python
# Example: Building a knowledge graph
import networkx as nx

G = nx.Graph()

# Add nodes (entries)
for entry in mcp_data['entries']:
    G.add_node(entry['id'],
               title=entry['title'],
               category=entry['semantic_category'],
               tags=entry['tags'])

# Add relationships
for rel in mcp_data['relationships']:
    G.add_edge(rel['source_id'], rel['target_id'],
               type=rel['type'],
               weight=rel['weight'])
```

## Integration Examples

### 1. Custom AI Assistant
```python
class KnowledgeAssistant:
    def __init__(self, mcp_file):
        with open(mcp_file, 'r') as f:
            self.mcp_data = json.load(f)

        # Build search index
        self.entries = {str(e['id']): e for e in self.mcp_data['entries']}

    def search_knowledge(self, query):
        results = []
        for entry in self.entries.values():
            if query.lower() in entry['title'].lower() or \
               query.lower() in entry['content'].lower():
                results.append(entry)
        return results

    def get_context(self, query, max_entries=5):
        relevant = self.search_knowledge(query)
        context = "\n".join([
            f"{e['title']}: {e['content'][:200]}..."
            for e in relevant[:max_entries]
        ])
        return context
```

### 2. RAG System Integration
```python
# Example: Using MCP data for Retrieval-Augmented Generation
def rag_query(query, mcp_data, llm):
    # Find relevant entries
    relevant_entries = find_relevant_entries(query, mcp_data)

    # Build context
    context = build_context_from_entries(relevant_entries)

    # Generate response
    prompt = f"""Based on the following knowledge:

{context}

Question: {query}

Answer:"""

    response = llm.generate(prompt)
    return response
```

## Future Enhancements

### 1. Vector Embeddings
- Pre-computed embeddings for semantic search
- Support for multiple embedding models
- Dimensionality reduction options

### 2. Multi-modal Support
- Image and video metadata
- Audio transcription integration
- Cross-modal relationships

### 3. Real-time Sync
- Incremental updates
- Conflict resolution
- Version control

### 4. Advanced Analytics
- Knowledge gap analysis
- Learning path recommendations
- Trend analysis

## File Naming Convention

Export files use the following naming pattern:
```
knowledge-vault-mcp-YYYY-MM-DD-HHMMSS.json
```

Example: `knowledge-vault-mcp-2024-01-15-103045.json`

## Privacy and Security

- All exports are user-specific and contain only personal data
- No external API calls during export processing
- Content analysis is performed locally
- Export files are not stored on servers

## Technical Specifications

- **Format**: JSON
- **Encoding**: UTF-8
- **Compression**: None (human-readable)
- **Size**: Varies based on knowledge vault size
- **Compatibility**: LLMs, vector databases, knowledge graphs

## Support

For questions about MCP export format or integration assistance:
- Check the semantic summary for knowledge domain insights
- Use the relationships for context connections
- Leverage entity extraction for term analysis
- Apply semantic categorization for content organization