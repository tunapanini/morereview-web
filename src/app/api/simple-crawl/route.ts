// 개발용 간단한 크롤링 API (인증 불필요)

import { NextRequest, NextResponse } from 'next/server';
import { SimpleCrawler } from '@/services/simple-crawler';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '제품';
    
    console.warn(`🚀 간단 크롤링 API 요청: category=${category}`);
    
    const crawler = new SimpleCrawler();
    const result = await crawler.crawlReviewplace(category);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          duration: result.duration 
        },
        { status: 500 }
      );
    }
    
    const totalDuration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: result.data,
      validation: result.validation,
      meta: {
        category,
        count: result.data.length,
        saved: result.saved || 0,
        crawlDuration: result.duration,
        totalDuration,
        timestamp: new Date().toISOString(),
        qualityScore: result.validation?.validCount === result.data.length ? 100 : 
                     Math.round((result.validation?.validCount || 0) / result.data.length * 100)
      }
    });
    
  } catch (error) {
    console.error('❌ 간단 크롤링 API 에러:', (error as Error).message);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: (error as Error).message,
        duration: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}