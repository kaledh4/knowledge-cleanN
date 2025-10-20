export interface SharedContent {
  title?: string;
  text?: string;
  url?: string;
  source?: string;
}

export function parseSharedContentFromURL(): SharedContent | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);

  const title = urlParams.get('title') || undefined;
  const text = urlParams.get('text') || undefined;
  const url = urlParams.get('url') || undefined;

  if (!title && !text && !url) return null;

  // Determine the source platform
  let source = 'Unknown';
  if (url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        source = 'YouTube';
      } else if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
        source = 'X (Twitter)';
      } else if (urlObj.hostname.includes('tiktok.com')) {
        source = 'TikTok';
      } else if (urlObj.hostname.includes('linkedin.com')) {
        source = 'LinkedIn';
      } else if (urlObj.hostname.includes('reddit.com')) {
        source = 'Reddit';
      } else {
        source = 'Website';
      }
    } catch {
      source = 'Website';
    }
  }

  return {
    title: title || (url ? extractTitleFromURL(url) : undefined),
    text: text || title || '',
    url: url || '',
    source
  };
}

function extractTitleFromURL(url: string): string {
  try {
    const urlObj = new URL(url);

    // YouTube title extraction
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
      if (videoId) {
        return `YouTube Video: ${videoId}`;
      }
    }

    // X/Twitter title extraction
    if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
      const pathParts = urlObj.pathname.split('/');
      const username = pathParts[1];
      const tweetId = pathParts[3];
      if (username && tweetId) {
        return `Tweet by @${username}`;
      }
    }

    // Generic fallback
    return urlObj.hostname;
  } catch {
    return 'Shared Content';
  }
}

export function clearSharedContentFromURL(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Remove share-related parameters
  params.delete('title');
  params.delete('text');
  params.delete('url');
  params.delete('action');

  // Update URL without these parameters
  window.history.replaceState({}, document.title, url.toString());
}

export function detectContentType(url?: string): 'TEXT' | 'YOUTUBE_LINK' | 'X_POST_LINK' | 'TIKTOK_LINK' {
  if (!url) return 'TEXT';

  try {
    const urlObj = new URL(url.toLowerCase());

    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      return 'YOUTUBE_LINK';
    }

    if (urlObj.hostname.includes('tiktok.com') || urlObj.hostname.includes('tiktokcdn.com')) {
      return 'TIKTOK_LINK';
    }

    if (urlObj.hostname.includes('x.com') || urlObj.hostname.includes('twitter.com')) {
      return 'X_POST_LINK';
    }
  } catch {
    // Invalid URL, treat as text
  }

  return 'TEXT';
}

export function isValidShareURL(url: string): boolean {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}