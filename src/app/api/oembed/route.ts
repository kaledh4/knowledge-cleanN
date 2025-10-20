import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the target URL from query parameters
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Validate that it's a supported URL
    const url = targetUrl.toLowerCase();
    let oembedEndpoint: string | undefined;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      oembedEndpoint = `https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`;
    } else if (url.includes('x.com') || url.includes('twitter.com')) {
      oembedEndpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(targetUrl)}`;
    } else if (url.includes('tiktok.com')) {
      oembedEndpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`;
    } else {
      return NextResponse.json(
        { error: 'Unsupported platform for oEmbed' },
        { status: 400 }
      );
    }

    console.log(`Proxying oEmbed request to: ${oembedEndpoint}`);
    
    // Make the server-side request to the oEmbed endpoint
    const response = await fetch(oembedEndpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`oEmbed request failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `oEmbed service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Set CORS headers to allow client-side access
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    return NextResponse.json(data, { headers });
    
  } catch (error) {
    console.error('oEmbed proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}