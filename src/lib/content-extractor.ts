import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  type: 'YOUTUBE' | 'TIKTOK' | 'X_POST' | 'UNKNOWN';
  metadata: {
    author?: string;
    description?: string;
    thumbnail?: string;
    publishedAt?: string;
    duration?: string;
    viewCount?: string;
    likeCount?: string;
  };
}

export function detectUrlType(url: string): 'YOUTUBE' | 'TIKTOK' | 'X_POST' | 'UNKNOWN' {
  const youtubeRegex = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i;
  const tiktokRegex = /(?:tiktok\.com|tiktokcdn\.com)/i;
  const xRegex = /(?:x\.com|twitter\.com)/i;
  
  if (youtubeRegex.test(url)) return 'YOUTUBE';
  if (tiktokRegex.test(url)) return 'TIKTOK';
  if (xRegex.test(url)) return 'X_POST';
  
  return 'UNKNOWN';
}

export async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('title').text() || 
                  'YouTube Video';
    
    // Extract description
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content') || '';
    
    // Extract author
    const author = $('meta[itemprop="author"]').attr('content') || 
                   $('.ytd-channel-name a').text() || 
                   $('link[itemprop="name"]').attr('content') || '';
    
    // Extract thumbnail
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    
    // Extract view count (simplified)
    const viewCount = $('meta[itemprop="interactionCount"]').attr('content') || '';
    
    // Extract like count (simplified)
    const likeCount = $('.like-button-renderer-like-button .yt-uix-button-content').text() || '';
    
    // Create comprehensive content
    const content = `
Title: ${title}
Author: ${author}
Description: ${description}
URL: ${url}

This is a YouTube video about ${title}. The video ${description.toLowerCase()}.
${author ? `Created by ${author}.` : ''}
    `.trim();
    
    return {
      title,
      content,
      url,
      type: 'YOUTUBE',
      metadata: {
        author,
        description,
        thumbnail,
        viewCount,
        likeCount
      }
    };
  } catch (error) {
    console.error('Error extracting YouTube content:', error);
    return {
      title: 'YouTube Video',
      content: `YouTube video from ${url}`,
      url,
      type: 'YOUTUBE',
      metadata: {}
    };
  }
}

export async function extractTikTokContent(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Enhanced extraction for better content
    let title = $('meta[property="og:title"]').attr('content') || 
                $('meta[property="twitter:title"]').attr('content') || 
                $('title').text().replace(' | TikTok', '') ||
                'TikTok Video';
    
    // Extract description with multiple fallbacks
    let description = $('meta[property="og:description"]').attr('content') || 
                     $('meta[name="description"]').attr('content') || '';
    
    // Extract author with enhanced patterns
    let author = $('meta[property="og:author"]').attr('content') || 
                $('.author-username').text() || '';
    
    // Try to extract from URL pattern
    if (!author) {
      const urlMatch = url.match(/tiktok\.com\/@([^/]+)/);
      if (urlMatch) {
        author = urlMatch[1];
      }
    }
    
    // Extract thumbnail
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    
    // Create engaging content summary
    let content = '';
    
    if (title && title !== 'TikTok Video') {
      content = `🎥 **${title}**\n\n`;
    } else {
      content = `🎥 **TikTok Video**\n\n`;
    }
    
    if (author) {
      content += `👤 **Creator:** @${author}\n\n`;
    }
    
    if (description && description.length > 0) {
      content += `💬 **Description:** ${description}\n\n`;
    } else {
      content += `🔍 *Visual content - description not available*\n\n`;
    }
    
    content += `🔗 **Source:** ${url}\n\n`;
    content += `🎦 This TikTok video ${description ? 'features creative content with detailed description' : 'focuses on visual storytelling'}. `;
    
    if (author) {
      content += `Created by @${author} on the TikTok platform.`;
    } else {
      content += `Part of the vibrant TikTok creator community.`;
    }
    
    return {
      title: title || 'TikTok Video',
      content,
      url,
      type: 'TIKTOK',
      metadata: {
        author,
        description,
        thumbnail
      }
    };
  } catch (error) {
    console.error('Error extracting TikTok content:', error);
    return {
      title: 'TikTok Video',
      content: `🎥 TikTok video from ${url}\n\nUnable to extract detailed content, but this link contains a TikTok video that can be viewed directly.`,
      url,
      type: 'TIKTOK',
      metadata: {}
    };
  }
}

export async function extractXPostContent(url: string): Promise<ExtractedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Enhanced extraction for better content
    let title = $('meta[property="og:title"]').attr('content') || 
               $('meta[property="twitter:title"]').attr('content') || 
               'X Post';
    
    // Clean up title to extract actual post content
    if (title && title.includes(':')) {
      const parts = title.split(':');
      if (parts.length > 1) {
        title = parts.slice(1).join(':').trim();
      }
    }
    title = title.replace(' / X', '').replace(' / Twitter', '');
    
    // Extract description (tweet content) with multiple strategies
    let description = $('meta[property="og:description"]').attr('content') || 
                     $('meta[property="twitter:description"]').attr('content') || 
                     title || '';
    
    // Enhanced author with enhanced patterns
    let author = $('meta[property="og:author"]').attr('content') || 
                $('.username').text() || '';
    
    // Try to extract author from title pattern
    if (!author && title) {
      const authorMatch = title.match(/^([^:]+)/);
      if (authorMatch) {
        author = authorMatch[1].trim().replace(/[()]/g, '');
      }
    }
    
    // Try to extract from URL  
    if (!author) {
      const urlMatch = url.match(/x\.com\/([^/]+)/);
      if (urlMatch) {
        author = urlMatch[1];
      }
    }
    
    // Extract published date
    const publishedAt = $('meta[property="article:published_time"]').attr('content') || 
                         $('time').attr('datetime') || '';
    
    // Extract like count (simplified)
    const likeCount = $('.like-count').text() || '';
    
    // Create engaging content summary
    let content = '';
    
    if (author) {
      content = `🐦 **X Post by @${author}**\n\n`;
    } else {
      content = `🐦 **X Post**\n\n`;
    }
    
    if (description && description.length > 0 && description !== 'X Post') {
      // Check if it's a quote or regular post
      if (description.startsWith('"') && description.endsWith('"')) {
        content += `💬 ${description}\n\n`;
      } else {
        content += `💬 "${description}"\n\n`;
      }
    } else {
      content += `🔍 *Post content not fully accessible - may contain media, links, or special formatting*\n\n`;
    }
    
    if (publishedAt) {
      const date = new Date(publishedAt);
      content += `📅 **Published:** ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}\n\n`;
    }
    
    if (likeCount) {
      content += `❤️ **Engagement:** ${likeCount} likes\n\n`;
    }
    
    content += `🔗 **Source:** ${url}\n\n`;
    
    // Add contextual insights
    if (description.length > 200) {
      content += `📝 This is a detailed post with ${description.length} characters of content, likely containing in-depth thoughts or information.`;
    } else if (description.length < 50) {
      content += `📱 This is a brief post, possibly containing media content, links, or concise thoughts.`;
    } else {
      content += `💬 This post shares thoughts and ideas as part of the ongoing conversation on X.`;
    }
    
    return {
      title: title || 'X Post',
      content,
      url,
      type: 'X_POST',
      metadata: {
        author,
        description,
        publishedAt,
        likeCount
      }
    };
  } catch (error) {
    console.error('Error extracting X post content:', error);
    return {
      title: 'X Post',
      content: `🐦 X (Twitter) post from ${url}\n\nUnable to extract detailed content, but this link contains a post that can be viewed directly on X.`,
      url,
      type: 'X_POST',
      metadata: {}
    };
  }
}

export async function extractContentFromUrl(url: string): Promise<ExtractedContent> {
  const urlType = detectUrlType(url);
  
  switch (urlType) {
    case 'YOUTUBE':
      return extractYouTubeContent(url);
    case 'TIKTOK':
      return extractTikTokContent(url);
    case 'X_POST':
      return extractXPostContent(url);
    default:
      return {
        title: 'Unknown Content',
        content: `Content from ${url}`,
        url,
        type: 'UNKNOWN',
        metadata: {}
      };
  }
}