// Basic client-side content extractor for URLs (YouTube, X/Twitter, TikTok)
// Uses r.jina.ai to bypass CORS and fetch readable page text

export type ExtractedContent = {
  title?: string;
  content?: string;
};

function isUrl(str: string) {
  try { new URL(str); return true; } catch { return false; }
}

function jinaProxyUrl(originalUrl: string) {
  // r.jina.ai fetches and renders page text; use http scheme in path per service docs
  const url = new URL(originalUrl);
  url.protocol = 'http:'; // switch to http
  return `https://r.jina.ai/${url.toString()}`;
}

async function fetchPageText(url: string): Promise<string | undefined> {
  try {
    const proxied = jinaProxyUrl(url);
    const res = await fetch(proxied, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const text = await res.text();
    return text?.trim();
  } catch {
    return undefined;
  }
}

async function fetchOEmbed(url: string): Promise<{ title?: string } | undefined> {
  try {
    const u = url.toLowerCase();
    
    // Check if URL is supported
    if (!u.includes('youtube.com') && !u.includes('youtu.be') && 
        !u.includes('x.com') && !u.includes('twitter.com') && 
        !u.includes('tiktok.com')) {
      return undefined;
    }
    
    // Use our proxy endpoint to avoid CORS issues
    const proxyUrl = `/api/oembed?url=${encodeURIComponent(url)}`;
    
    const res = await fetch(proxyUrl, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.warn(`oEmbed proxy failed for ${url}: ${res.status}`);
      return undefined;
    }
    
    const data = await res.json();
    return { title: (data.title as string) || undefined };
  } catch (error) {
    console.warn('oEmbed fetch failed:', error);
    return undefined;
  }
}

export async function extractFromSource(source: string): Promise<ExtractedContent | undefined> {
  if (!source || !isUrl(source)) return undefined;
  const [pageText, oembed] = await Promise.all([
    fetchPageText(source),
    fetchOEmbed(source),
  ]);
  const content = pageText;
  const title = oembed?.title || (pageText ? pageText.split('\n')[0]?.slice(0, 80) : undefined);
  if (!content && !title) return undefined;
  return { content, title };
}