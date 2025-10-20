import {
  extractYouTubeVideoId,
  extractXPostId,
  extractTikTokVideoId,
  saveDataToFile,
  retryWithBackoff,
  YouTubeTranscript,
  XPost,
  TikTokVideo,
  ExtractionResult
} from './url-extractor';
import { logger } from './extraction-logger';

/**
 * YouTube transcript extraction using youtube-transcript library
 */
export async function extractYouTubeTranscript(url: string): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      logger.error('youtube_extraction', 'Could not extract video ID from URL', { url });
      return {
        status: 'error',
        platform: 'youtube',
        id: '',
        reason: 'Could not extract video ID from URL'
      };
    }

    logger.extractionStart('youtube', videoId, url);

    // For now, use web scraping approach since transcript APIs have module issues
    // TODO: Implement proper youtube-transcript-api integration after resolving module types
    const fallbackData = await extractYouTubeMetadata(url, videoId);
    const savedPath = saveDataToFile('youtube', videoId, {
      ...fallbackData,
      note: 'Using metadata extraction - transcript API integration pending'
    });
    
    const duration_ms = Date.now() - startTime;
    logger.extractionSuccess('youtube', videoId, duration_ms, savedPath);
    
    return {
      status: 'ok',
      platform: 'youtube',
      id: videoId,
      data: {
        ...fallbackData,
        note: 'Using metadata extraction - transcript API integration pending'
      },
      meta: {
        duration_ms,
        source: 'metadata-fallback',
        saved_path: savedPath
      }
    };
  } catch (error) {
    const duration_ms = Date.now() - startTime;
    logger.extractionFailure('youtube', extractYouTubeVideoId(url) || 'unknown', error as Error, duration_ms);
    
    // Fallback: Try to get basic video information
    try {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        const fallbackData = await extractYouTubeMetadata(url, videoId);
        const savedPath = saveDataToFile('youtube', videoId, fallbackData);
        
        return {
          status: 'ok',
          platform: 'youtube',
          id: videoId,
          data: fallbackData,
          meta: {
            duration_ms: Date.now() - startTime,
            source: 'metadata-fallback',
            saved_path: savedPath
          }
        };
      }
    } catch (fallbackError) {
      logger.error('youtube_extraction', 'Fallback extraction also failed', { fallbackError, originalError: error });
    }
    
    return {
      status: 'error',
      platform: 'youtube',
      id: extractYouTubeVideoId(url) || '',
      reason: error instanceof Error ? error.message : 'Unknown error during transcript extraction'
    };
  }
}

/**
 * Fallback method to extract YouTube metadata when transcript is unavailable
 */
async function extractYouTubeMetadata(url: string, videoId: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extract title from various sources
    let title = '';
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace(' - YouTube', '');
    }
    
    // Extract description
    let description = '';
    const descMatch = html.match(/<meta name="description" content="([^"]*)">/);
    if (descMatch) {
      description = descMatch[1];
    }
    
    // Extract channel name
    let channelName = '';
    const channelMatch = html.match(/"ownerText":{"runs":\[{"text":"([^"]+)"/);
    if (channelMatch) {
      channelName = channelMatch[1];
    }
    
    return {
      video_id: videoId,
      url,
      title,
      description,
      channel_name: channelName,
      transcript: null,
      full_text: `${title}. ${description}`,
      metadata_only: true,
      note: 'Transcript not available, metadata extracted instead'
    };
  } catch (error) {
    throw new Error(`Failed to extract YouTube metadata: ${error}`);
  }
}

/**
 * X (Twitter) post extraction using X API v2
 */
export async function extractXPost(url: string): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  try {
    const postId = extractXPostId(url);
    if (!postId) {
      logger.error('x_extraction', 'Could not extract post ID from URL', { url });
      return {
        status: 'error',
        platform: 'x',
        id: '',
        reason: 'Could not extract post ID from URL'
      };
    }

    logger.extractionStart('x', postId, url);

    const bearerToken = process.env.X_BEARER_TOKEN;
    if (!bearerToken) {
      logger.environmentIssue('X_BEARER_TOKEN environment variable not set', { postId });
      // Try fallback approach
      const fallbackData = await extractXPostFallback(url, postId);
      const savedPath = saveDataToFile('x', postId, fallbackData);
      
      return {
        status: 'ok',
        platform: 'x',
        id: postId,
        data: fallbackData,
        meta: {
          duration_ms: Date.now() - startTime,
          source: 'scraping-fallback',
          saved_path: savedPath
        }
      };
    }

    const response = await retryWithBackoff(async () => {
      const apiUrl = `https://api.twitter.com/2/tweets/${postId}?expansions=author_id&tweet.fields=created_at,public_metrics,text&user.fields=username,name`;
      
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`X API error: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    });

    const post = response.data;
    const author = response.includes?.users?.[0];

    const processedPost = {
      post_id: postId,
      url,
      text: post.text,
      author: {
        id: post.author_id,
        username: author?.username || 'unknown',
        name: author?.name || 'unknown'
      },
      created_at: post.created_at,
      public_metrics: post.public_metrics || {},
      full_text: post.text
    };

    const savedPath = saveDataToFile('x', postId, processedPost);
    
    return {
      status: 'ok',
      platform: 'x',
      id: postId,
      data: processedPost,
      meta: {
        duration_ms: Date.now() - startTime,
        source: 'x-api-v2',
        saved_path: savedPath
      }
    };
  } catch (error) {
    console.error('X post extraction failed:', error);
    
    // Fallback: Try scraping approach
    try {
      const postId = extractXPostId(url);
      if (postId) {
        const fallbackData = await extractXPostFallback(url, postId);
        const savedPath = saveDataToFile('x', postId, fallbackData);
        
        return {
          status: 'ok',
          platform: 'x',
          id: postId,
          data: fallbackData,
          meta: {
            duration_ms: Date.now() - startTime,
            source: 'scraping-fallback',
            saved_path: savedPath
          }
        };
      }
    } catch (fallbackError) {
      console.error('X fallback extraction failed:', fallbackError);
    }
    
    return {
      status: 'error',
      platform: 'x',
      id: extractXPostId(url) || '',
      reason: error instanceof Error ? error.message : 'Unknown error during X post extraction'
    };
  }
}

/**
 * Fallback X post extraction using web scraping
 */
async function extractXPostFallback(url: string, postId: string) {
  try {
    // First, try using our oEmbed proxy for better data
    const oEmbedResponse = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
    if (oEmbedResponse.ok) {
      const oEmbedData = await oEmbedResponse.json();
      if (oEmbedData.author_name && oEmbedData.html) {
        // Extract content from oEmbed HTML
        const htmlMatch = oEmbedData.html.match(/<p[^>]*>([^<]+)<\/p>/);
        const extractedText = htmlMatch ? htmlMatch[1] : '';
        
        const author = {
          username: oEmbedData.author_name || 'unknown',
          name: oEmbedData.author_name || 'unknown'
        };
        
        const summary = `🐦 **X Post by @${author.username}**

💬 "${extractedText || 'This post contains media content or special formatting'}"

📱 *Enhanced via X oEmbed API*`;
        
        return {
          post_id: postId,
          url,
          text: extractedText || 'Post with media content',
          author,
          full_text: summary,
          engagement: { likes: 0, retweets: 0, replies: 0 },
          scraped: false,
          oembed_source: true,
          note: 'Data extracted via oEmbed API proxy'
        };
      }
    }
  } catch (oEmbedError) {
    console.log('oEmbed extraction failed, falling back to scraping:', oEmbedError);
  }
  
  // Fallback to enhanced web scraping
  const response = await fetch(url, {    
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    }
  });
  
  const html = await response.text();
  
  // Enhanced extraction with multiple strategies
  let text = '';
  let author = { username: 'unknown', name: 'unknown' };
  let engagement = { likes: 0, retweets: 0, replies: 0 };
  let publishedAt = '';
  
  // Multiple extraction strategies for better results
  const extractionStrategies = [
    // Strategy 1: Open Graph description
    () => {
      const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
      return ogDesc ? ogDesc[1] : null;
    },
    // Strategy 2: Twitter card description  
    () => {
      const twitterDesc = html.match(/<meta name="twitter:description" content="([^"]*)"/i);
      return twitterDesc ? twitterDesc[1] : null;
    },
    // Strategy 3: Title content (cleaned)
    () => {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        return titleMatch[1]
          .replace(/ \/ X$/, '')
          .replace(/ \/ Twitter$/, '')
          .replace(/^[^:]*:\s*/, '') // Remove "UserName: " prefix
          .replace(/^"/, '').replace(/"$/, '') // Remove quotes
          .trim();
      }
      return null;
    },
    // Strategy 4: JSON-LD structured data
    () => {
      const jsonMatch = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/i);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          return data.text || data.description || null;
        } catch (e) {
          return null;
        }
      }
      return null;
    }
  ];
  
  // Try each strategy until we get content
  for (const strategy of extractionStrategies) {
    const result = strategy();
    if (result && result.length > 5) { // Minimum content length
      text = result;
      break;
    }
  }
  
  // Enhanced author extraction
  const authorStrategies = [
    () => html.match(/@([a-zA-Z0-9_]+)/)?.[1],
    () => html.match(/"screen_name":"([^"]+)"/)?.[1],
    () => html.match(/data-screen-name="([^"]+)"/)?.[1],
    () => html.match(/<meta property="og:site_name" content="([^"]*) \([^)]*\)"/)?.[1],
    () => {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        const nameMatch = titleMatch[1].match(/^([^\(]+)/);
        return nameMatch?.[1]?.trim();
      }
      return null;
    }
  ];
  
  for (const strategy of authorStrategies) {
    const result = strategy();
    if (result && result !== 'unknown') {
      author.username = result.replace('@', '');
      author.name = result.replace('@', '');
      break;
    }
  }
  
  // Extract publish date
  const dateMatch = html.match(/<time[^>]*datetime="([^"]*)"/i) || 
                   html.match(/"created_at":"([^"]*)"/i);
  if (dateMatch) {
    publishedAt = dateMatch[1];
  }
  
  // Try to extract engagement metrics with better patterns
  const engagementPatterns = {
    likes: [/(\d+(?:[,.]\d+)*(?:[KMB])?)s*(?:likes?|❤️|♥️)/i, /(\d+(?:[,.]\d+)*(?:[KMB])?)s*(?:👍|💖)/i],
    retweets: [/(\d+(?:[,.]\d+)*(?:[KMB])?)s*(?:retweets?|reposts?|🔄)/i],
    replies: [/(\d+(?:[,.]\d+)*(?:[KMB])?)s*(?:replies?|comments?|💬)/i]
  };
  
  for (const [key, patterns] of Object.entries(engagementPatterns)) {
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        engagement[key as keyof typeof engagement] = parseEngagementNumber(match[1]);
        break;
      }
    }
  }
  
  // Create enriched content with better fallback
  let finalText = text;
  if (!finalText || finalText.length < 5) {
    // Try to get any meaningful text from the page
    const metaDescription = html.match(/<meta name="description" content="([^"]*)"/i);
    finalText = metaDescription?.[1] || 'This X post contains media, links, or content that requires viewing on X.com';
  }
  
  const authorDisplay = author.username !== 'unknown' ? `@${author.username}` : 'X User';
  
  // Generate creative summary following the specification standards
  let summary = `🐦 **X Post by ${authorDisplay}**\n\n`;
  
  if (finalText && finalText.length > 0) {
    summary += `💬 "${finalText}"\n\n`;
  }
  
  // Add timestamp if available
  if (publishedAt) {
    try {
      const date = new Date(publishedAt);
      summary += `📅 **Posted:** ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}\n\n`;
    } catch (e) {
      // Invalid date format, skip
    }
  }
  
  // Add engagement metrics if available
  if (engagement.likes > 0 || engagement.retweets > 0 || engagement.replies > 0) {
    summary += `📊 **Engagement:** `;
    const metrics = [];
    if (engagement.likes > 0) metrics.push(`${formatNumber(engagement.likes)} likes`);
    if (engagement.retweets > 0) metrics.push(`${formatNumber(engagement.retweets)} retweets`);
    if (engagement.replies > 0) metrics.push(`${formatNumber(engagement.replies)} replies`);
    summary += metrics.join(' • ') + '\n\n';
  }
  
  summary += `🔗 **Source:** ${url}\n\n`;
  
  // Add contextual insights based on content analysis
  if (finalText.length > 200) {
    summary += `📝 This is a detailed post with ${finalText.length} characters of thoughtful content.`;
  } else if (finalText.length < 50) {
    summary += `📱 This is a brief post, likely containing media, links, or concise thoughts.`;
  } else if (finalText.includes('http')) {
    summary += `🔗 This post contains links to external content or media.`;
  } else {
    summary += `💭 This post shares ideas and thoughts as part of the X conversation.`;
  }
  
  return {
    post_id: postId,
    url,
    text: finalText,
    author,
    published_at: publishedAt,
    full_text: summary,
    engagement,
    scraped: true,
    note: 'Enhanced data extracted via advanced web scraping'
  };
}

/**
 * Helper function to parse engagement numbers (e.g., "1.2K" -> 1200)
 */
function parseEngagementNumber(str: string): number {
  const cleanStr = str.replace(/,/g, '');
  const num = parseFloat(cleanStr);
  
  if (str.includes('K')) return Math.round(num * 1000);
  if (str.includes('M')) return Math.round(num * 1000000);
  if (str.includes('B')) return Math.round(num * 1000000000);
  
  return Math.round(num);
}

/**
 * Helper function to format numbers for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * TikTok video transcript extraction
 */
export async function extractTikTokTranscript(url: string): Promise<ExtractionResult> {
  const startTime = Date.now();
  
  try {
    const videoId = extractTikTokVideoId(url);
    if (!videoId) {
      return {
        status: 'error',
        platform: 'tiktok',
        id: '',
        reason: 'Could not extract video ID from URL'
      };
    }

    // For now, implement basic metadata extraction since TikTok API access is restricted
    const fallbackData = await extractTikTokMetadata(url, videoId);
    const savedPath = saveDataToFile('tiktok', videoId, fallbackData);
    
    return {
      status: 'ok',
      platform: 'tiktok',
      id: videoId,
      data: fallbackData,
      meta: {
        duration_ms: Date.now() - startTime,
        source: 'metadata-extraction',
        saved_path: savedPath
      }
    };
  } catch (error) {
    console.error('TikTok extraction failed:', error);
    
    return {
      status: 'error',
      platform: 'tiktok',
      id: extractTikTokVideoId(url) || '',
      reason: error instanceof Error ? error.message : 'Unknown error during TikTok extraction'
    };
  }
}

/**
 * TikTok metadata extraction using web scraping
 */
async function extractTikTokMetadata(url: string, videoId: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  });
  
  const html = await response.text();
  
  // Enhanced extraction with multiple strategies
  let description = '';
  let author = { username: 'unknown', name: 'unknown' };
  let stats = { views: 0, likes: 0, comments: 0, shares: 0 };
  let hashtags: string[] = [];
  
  // Extract title/description with multiple fallbacks
  const titleSources = [
    html.match(/<title>([^<]+)<\/title>/),
    html.match(/<meta property="og:title" content="([^"]*)"/),
    html.match(/<meta name="twitter:title" content="([^"]*)"/),
    html.match(/"desc":"([^"]*)"/),
  ];
  
  for (const match of titleSources) {
    if (match && match[1]) {
      description = match[1]
        .replace(' | TikTok', '')
        .replace(' on TikTok', '')
        .trim();
      break;
    }
  }
  
  // Extract description from meta tags as fallback
  if (!description) {
    const descMatch = html.match(/<meta name="description" content="([^"]*)">/);
    if (descMatch) {
      description = descMatch[1];
    }
  }
  
  // Extract author information with multiple strategies
  const authorSources = [
    html.match(/@([a-zA-Z0-9_.]+)/), // @username pattern
    html.match(/"uniqueId":"([^"]+)"/), // JSON data
    html.match(/"author":{[^}]*"uniqueId":"([^"]+)"/), // Nested JSON
    html.match(/tiktok\.com\/@([^/]+)/), // URL pattern
  ];
  
  for (const match of authorSources) {
    if (match && match[1]) {
      author.username = match[1];
      break;
    }
  }
  
  // Extract display name
  const nameMatch = html.match(/"nickname":"([^"]+)"/);
  if (nameMatch) {
    author.name = nameMatch[1];
  }
  
  // Extract engagement statistics
  const viewMatch = html.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:views?|Views?)/);
  const likeMatch = html.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:likes?|Likes?)/);
  const commentMatch = html.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:comments?|Comments?)/);
  const shareMatch = html.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:shares?|Shares?)/);
  
  if (viewMatch) stats.views = parseEngagementNumber(viewMatch[1]);
  if (likeMatch) stats.likes = parseEngagementNumber(likeMatch[1]);
  if (commentMatch) stats.comments = parseEngagementNumber(commentMatch[1]);
  if (shareMatch) stats.shares = parseEngagementNumber(shareMatch[1]);
  
  // Extract hashtags
  const hashtagMatches = description.match(/#[a-zA-Z0-9_]+/g);
  if (hashtagMatches) {
    hashtags = hashtagMatches.map(tag => tag.slice(1)); // Remove # symbol
  }
  
  // Generate creative and informative summary
  const authorDisplay = author.username !== 'unknown' ? `@${author.username}` : 'Unknown creator';
  const authorName = author.name !== 'unknown' ? ` (${author.name})` : '';
  
  let summary = `🎥 TikTok Video by ${authorDisplay}${authorName}\n\n`;
  
  if (description && description !== 'TikTok Video') {
    summary += `"💬 ${description}"\n\n`;
  } else {
    summary += `🔍 Content description not available - this might be a visual-only video or contain music/effects.\n\n`;
  }
  
  // Add engagement metrics if available
  if (stats.views > 0 || stats.likes > 0) {
    summary += `📊 Performance: `;
    const metrics = [];
    if (stats.views > 0) metrics.push(`${formatNumber(stats.views)} views`);
    if (stats.likes > 0) metrics.push(`${formatNumber(stats.likes)} likes`);
    if (stats.comments > 0) metrics.push(`${formatNumber(stats.comments)} comments`);
    if (stats.shares > 0) metrics.push(`${formatNumber(stats.shares)} shares`);
    summary += metrics.join(' • ') + '\n\n';
  }
  
  // Add hashtag information
  if (hashtags.length > 0) {
    summary += `🏷️ Hashtags: ${hashtags.slice(0, 5).map(tag => `#${tag}`).join(' ')}${hashtags.length > 5 ? ` +${hashtags.length - 5} more` : ''}\n\n`;
  }
  
  // Add content insights
  if (description.length > 100) {
    summary += `📝 This is a detailed TikTok with a comprehensive description (${description.length} characters).`;
  } else if (description.length < 20 && stats.views > 10000) {
    summary += `🔥 This appears to be a viral visual content with minimal text description.`;
  } else {
    summary += `🎬 This TikTok video focuses on visual content and entertainment.`;
  }
  
  return {
    video_id: videoId,
    url,
    description: description || 'TikTok video content',
    author,
    stats,
    hashtags,
    full_text: summary,
    transcript: null,
    metadata_only: true,
    note: 'Enhanced TikTok metadata extracted - transcript API integration pending'
  };
}