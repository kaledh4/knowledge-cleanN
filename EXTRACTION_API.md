# Unified Content Extraction API

A production-ready, unified API endpoint that automatically detects and extracts content from YouTube, X (Twitter), and TikTok URLs.

## 🚀 Features

- **Automatic Platform Detection**: Detects YouTube, X/Twitter, and TikTok URLs automatically
- **Unified Interface**: Single `/api/extract` endpoint for all platforms
- **Persistent Storage**: Saves extracted content to JSON files with organized directory structure
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Error Handling**: Robust error handling with retry mechanisms
- **Fallback Support**: Graceful fallbacks when APIs are unavailable
- **Production Ready**: Optimized for CapRover deployment with Docker

## 📋 API Endpoints

### POST /api/extract

Extracts content from supported platform URLs.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "status": "ok",
  "platform": "youtube",
  "id": "dQw4w9WgXcQ",
  "data": {
    "video_id": "dQw4w9WgXcQ",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "description": "The official video for...",
    "channel_name": "RickAstleyVEVO",
    "full_text": "Rick Astley - Never Gonna Give You Up...",
    "metadata_only": true,
    "note": "Using metadata extraction - transcript API integration pending"
  },
  "meta": {
    "duration_ms": 1723,
    "source": "metadata-fallback",
    "saved_path": "/usr/src/app/data/transcripts/dQw4w9WgXcQ.json"
  }
}
```

### GET /api/extract

Returns API documentation and configuration.

### GET /api/oembed

Proxy endpoint for oEmbed requests to avoid CORS issues.

**Query Parameters:**
- `url` (required): The URL to fetch oEmbed data for

**Example:**
```bash
GET /api/oembed?url=https://x.com/user/status/1234567890
```

**Response:**
```json
{
  "url": "https://twitter.com/user/status/1234567890",
  "author_name": "User Name",
  "html": "<blockquote>...</blockquote>",
  "type": "rich",
  "provider_name": "Twitter"
}
```

**Supported Platforms:**
- YouTube (`youtube.com`, `youtu.be`)
- X/Twitter (`x.com`, `twitter.com`) 
- TikTok (`tiktok.com`)

### GET /api/health

Health check endpoint that includes extraction system status.

## 🎯 Supported Platforms

| Platform | URL Examples | Content Extracted |
|----------|-------------|-------------------|
| **YouTube** | `youtube.com/watch?v=ID`, `youtu.be/ID` | Video metadata, title, description, channel |
| **X (Twitter)** | `x.com/user/status/ID`, `twitter.com/user/status/ID` | Tweet text, author, metadata |
| **TikTok** | `tiktok.com/@user/video/ID` | Video description, author, metadata |

## 📁 Data Storage

Extracted content is automatically saved in organized directories:

```
/usr/src/app/data/
├── transcripts/          # YouTube content
│   └── {video_id}.json
├── x/                    # X/Twitter posts
│   └── {post_id}.json
└── tiktok/              # TikTok videos
    └── {video_id}.json
```

Each saved file contains:
```json
{
  "id": "content_id",
  "platform": "youtube|x|tiktok",
  "extracted_at": "2025-10-07T23:56:07.338Z",
  "data": {
    // Platform-specific extracted content
  }
}
```

## 🔧 Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATA_PATH` | No | Base directory for saved content | `/usr/src/app/data` |
| `X_BEARER_TOKEN` | No | Twitter API v2 Bearer Token | - |
| `TIKTOK_API_KEY` | No | TikTok API Key | - |

## 🐳 CapRover Deployment

### captain-definition
```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

### Environment Configuration
1. Set persistent directory: `/usr/src/app/data`
2. Configure environment variables (optional)
3. Map port 3000

### Dockerfile Updates
Ensure your Dockerfile includes:
```dockerfile
# Create data directory
RUN mkdir -p /usr/src/app/data

# Set appropriate permissions
RUN chown -R node:node /usr/src/app/data
```

## 📖 Usage Examples

### Extract YouTube Video
```bash
curl -X POST http://your-app.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Extract X/Twitter Post
```bash
curl -X POST http://your-app.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x.com/user/status/1234567890"}'
```

### Extract TikTok Video
```bash
curl -X POST http://your-app.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@user/video/1234567890"}'
```

## 🚨 Error Handling

The API returns appropriate HTTP status codes:

- `200`: Successful extraction
- `400`: Invalid URL or unsupported platform
- `422`: Extraction failed but request was valid
- `500`: Internal server error

Error response format:
```json
{
  "status": "error",
  "reason": "Could not extract video ID from URL",
  "meta": {
    "duration_ms": 123
  }
}
```

## 🔍 Monitoring

### Health Check
```bash
curl http://your-app.com/api/health
```

Returns system status including:
- Data directory status
- Environment configuration
- Supported platforms

### Logging
All operations are logged with:
- Timestamp
- Operation type
- Platform
- Success/failure status
- Performance metrics

## 🛠️ Troubleshooting

### CORS Issues

If you encounter CORS errors when trying to fetch content from social media platforms:

1. **Use the oEmbed Proxy**: The `/api/oembed` endpoint provides server-side proxying to avoid CORS issues
2. **Check Network Requests**: Ensure client-side code uses the proxy endpoint instead of direct API calls
3. **Verify Headers**: The Next.js configuration includes proper CORS headers for API routes

### Common Error Messages

- `Access to fetch at 'https://publish.twitter.com/oembed' has been blocked by CORS policy`
  - **Solution**: Use `/api/oembed?url=...` instead of direct Twitter API calls

- `No 'Access-Control-Allow-Origin' header is present on the requested resource`
  - **Solution**: Ensure all external API calls go through server-side endpoints

### Performance Optimization

- Use `cache: 'no-store'` for dynamic content
- Implement proper error handling with fallbacks
- Monitor server logs for API rate limiting issues

## 🛠️ Development

### Local Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. API available at: `http://localhost:3000/api/extract`

### Testing
Use the provided test cases to verify functionality:
- YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- X: `https://x.com/user/status/1234567890`
- TikTok: `https://www.tiktok.com/@user/video/1234567890`

## 🎨 **Enhanced Content Quality (v2.0)**

### Creative TikTok Extraction
- 🎥 **Visual indicators** with emojis for better readability
- 📊 **Engagement metrics** (views, likes, comments, shares)
- 🏷️ **Hashtag analysis** with trending indicators
- 👤 **Creator information** with enhanced author detection
- 🎯 **Content insights** based on description length and engagement

### Enhanced X Post Extraction  
- 🐦 **Rich formatting** with author highlighting
- 📈 **Engagement data** (likes, retweets, replies)
- 📅 **Timestamp formatting** for better context
- 💬 **Content analysis** with length and type detection
- 🔗 **Source attribution** with clean formatting

### Content Quality Examples

**Before:**
```
Title: TikTok Video
Author: 
Description: 
URL: https://www.tiktok.com/@user/video/123
```

**After:**
```
🎥 TikTok Video by @lewismenelaws (Coding with Lewis)

💬 "Building amazing projects with MCP servers"

📊 Performance: 10.2K views • 1.2K likes • 89 comments
🏷️ Hashtags: #coding #ai #development #tech
🔥 This appears to be a viral visual content with minimal text description.
```

## 📈 Future Enhancements

- [ ] Full YouTube transcript extraction with proper API integration
- [ ] Enhanced TikTok transcript extraction
- [ ] Batch URL processing
- [ ] Vector database integration for LLM analysis
- [ ] Rate limiting and caching
- [ ] Webhook notifications
- [ ] Content similarity detection

## 🤝 Contributing

The extraction system is modular and extensible. Key files:
- `/src/app/api/extract/route.ts` - Main API endpoint
- `/src/lib/url-extractor.ts` - Platform detection and utilities
- `/src/lib/platform-extractors.ts` - Platform-specific extraction logic
- `/src/lib/extraction-logger.ts` - Logging utilities

## 📝 License

This project is part of the KnowledgeVerse application.