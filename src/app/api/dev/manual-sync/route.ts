import { NextResponse } from 'next/server';

export async function GET() {
  // 개발 환경에서만 접근 가능
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development environment' },
      { status: 404 }
    );
  }

  try {
    // 동기화 API 호출
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/sync-regions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: '🔧 Development manual sync completed',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}