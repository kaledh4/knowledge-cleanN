import { NextRequest, NextResponse } from 'next/server';
import { ensureDataDirectories } from '@/lib/url-extractor';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Basic health check - just return success
    // You could add database connectivity checks here if needed
    
    // Check data directories
    let dataDirectoriesStatus = 'ok';
    try {
      ensureDataDirectories();
    } catch (error) {
      dataDirectoriesStatus = 'error';
    }
    
    // Check environment variables
    const envStatus = {
      data_path: process.env.DATA_PATH || 'default',
      x_bearer_token: process.env.X_BEARER_TOKEN ? 'configured' : 'not_configured',
      tiktok_api_key: process.env.TIKTOK_API_KEY ? 'configured' : 'not_configured'
    };
    
    return NextResponse.json(
      { 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        extraction_system: {
          data_directories: dataDirectoriesStatus,
          supported_platforms: ['youtube', 'x', 'tiktok'],
          environment: envStatus
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}