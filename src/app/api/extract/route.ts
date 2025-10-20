import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform } from '@/lib/url-extractor';
import { 
  extractYouTubeTranscript, 
  extractXPost, 
  extractTikTokTranscript 
} from '@/lib/platform-extractors';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { 
          status: 'error', 
          reason: 'Missing url parameter in request body' 
        },
        { status: 400 }
      );
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { 
          status: 'error', 
          reason: 'Invalid URL format' 
        },
        { status: 400 }
      );
    }
    
    // Detect platform
    const platform = detectPlatform(url);
    
    if (platform === 'unknown') {
      return NextResponse.json(
        { 
          status: 'error', 
          reason: 'Unsupported platform. Supported platforms: YouTube, X (Twitter), TikTok' 
        },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${platform} URL: ${url}`);
    
    // Route to appropriate extractor
    let result;
    
    switch (platform) {
      case 'youtube':
        result = await extractYouTubeTranscript(url);
        break;
      case 'x':
        result = await extractXPost(url);
        break;
      case 'tiktok':
        result = await extractTikTokTranscript(url);
        break;
      default:
        return NextResponse.json(
          { 
            status: 'error', 
            reason: `Platform ${platform} not implemented` 
          },
          { status: 500 }
        );
    }
    
    // Log the result
    console.log(`Extraction completed for ${platform} (${result.id}):`, result.status);
    
    // Return the result
    if (result.status === 'ok') {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 422 });
    }
    
  } catch (error) {
    console.error('Extraction endpoint error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        reason: error instanceof Error ? error.message : 'Internal server error',
        meta: {
          duration_ms: Date.now() - startTime
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Unified extraction endpoint',
      supported_platforms: ['youtube', 'x', 'tiktok'],
      usage: {
        method: 'POST',
        body: { url: 'https://example.com/...' },
        description: 'Submit a URL to extract transcripts or posts'
      },
      environment_variables: {
        required: ['DATA_PATH (optional, defaults to /usr/src/app/data)'],
        optional: ['X_BEARER_TOKEN (for X/Twitter API)', 'TIKTOK_API_KEY (for TikTok API)']
      }
    },
    { status: 200 }
  );
}