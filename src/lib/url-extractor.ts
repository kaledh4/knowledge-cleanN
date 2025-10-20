import fs from 'fs';
import path from 'path';
import { logger } from './extraction-logger';

export type Platform = 'youtube' | 'x' | 'tiktok' | 'unknown';

export interface ExtractionResult {
  status: 'ok' | 'error';
  platform: Platform;
  id: string;
  data?: any;
  meta?: {
    duration_ms: number;
    source: string;
    saved_path?: string;
  };
  reason?: string;
}

export interface YouTubeTranscript {
  text: string;
  offset: number;
  duration: number;
}

export interface XPost {
  id: string;
  text: string;
  author: {
    username: string;
    name: string;
  };
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
}

export interface TikTokVideo {
  id: string;
  desc: string;
  author: {
    unique_id: string;
    nickname: string;
  };
  create_time: number;
  stats?: {
    digg_count: number;
    comment_count: number;
    share_count: number;
  };
  transcript?: string;
}

/**
 * Detects the platform from a given URL
 */
export function detectPlatform(url: string): Platform {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // YouTube detection
    if (domain.includes('youtube.com') || domain.includes('youtu.be') || domain.includes('youtube-nocookie.com')) {
      return 'youtube';
    }
    
    // X (Twitter) detection
    if (domain.includes('x.com') || domain.includes('twitter.com')) {
      return 'x';
    }
    
    // TikTok detection
    if (domain.includes('tiktok.com')) {
      return 'tiktok';
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error parsing URL:', error);
    return 'unknown';
  }
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be short links
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    // Handle youtube.com/watch?v= links
    if (urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    
    // Handle youtube.com/embed/ links
    if (urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/embed/')[1];
    }
    
    // Handle youtube.com/v/ links
    if (urlObj.pathname.startsWith('/v/')) {
      return urlObj.pathname.split('/v/')[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting YouTube video ID:', error);
    return null;
  }
}

/**
 * Extracts X (Twitter) post ID from URL
 */
export function extractXPostId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Look for status in path: /username/status/1234567890
    const statusIndex = pathParts.indexOf('status');
    if (statusIndex !== -1 && statusIndex + 1 < pathParts.length) {
      return pathParts[statusIndex + 1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting X post ID:', error);
    return null;
  }
}

/**
 * Extracts TikTok video ID from URL
 */
export function extractTikTokVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Look for video in path: /@username/video/1234567890
    const videoIndex = pathParts.indexOf('video');
    if (videoIndex !== -1 && videoIndex + 1 < pathParts.length) {
      return pathParts[videoIndex + 1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting TikTok video ID:', error);
    return null;
  }
}

/**
 * Ensures data directories exist
 */
export function ensureDataDirectories() {
  // Use consistent data path for both development and production
  const dataPath = process.env.DATA_PATH || (
    process.env.NODE_ENV === 'production' 
      ? '/usr/src/app/data'
      : './data'
  );
  
  const subdirs = ['transcripts', 'x', 'tiktok'];
  
  // Create main data directory
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
    console.log(`Created data directory: ${dataPath}`);
  }
  
  // Create subdirectories
  subdirs.forEach(subdir => {
    const fullPath = path.join(dataPath, subdir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created subdirectory: ${fullPath}`);
    }
  });
}

/**
 * Saves data to file and returns the saved path
 */
export function saveDataToFile(platform: Platform, id: string, data: any): string {
  ensureDataDirectories();
  
  // Use consistent data path for both development and production
  const dataPath = process.env.DATA_PATH || (
    process.env.NODE_ENV === 'production' 
      ? '/usr/src/app/data'
      : './data'
  );
  
  let subdir: string;
  
  switch (platform) {
    case 'youtube':
      subdir = 'transcripts';
      break;
    case 'x':
      subdir = 'x';
      break;
    case 'tiktok':
      subdir = 'tiktok';
      break;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
  
  const filePath = path.join(dataPath, subdir, `${id}.json`);
  const dataToSave = {
    id,
    platform,
    extracted_at: new Date().toISOString(),
    data
  };
  
  fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
  console.log(`Data saved to: ${filePath}`);
  return filePath;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operation: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      logger.retryAttempt(operation, attempt + 1, maxRetries, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}