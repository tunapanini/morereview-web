// Vercel Cron 전용 크롤링 API

import { NextRequest, NextResponse } from 'next/server';
import { withCronAuth } from '@/middleware/cron-auth';
import { SimpleCrawler } from '@/services/simple-crawler';
// import { delay } from '@/utils/simple-http';

async function cronHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  // console.log('🕐 다중 소스 크론 크롤링 시작');

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all'; // 'all', 'reviewplace', 'reviewnote', 'revu'
    
    const crawler = new SimpleCrawler();
    let results: Array<{
      source: string;
      success: boolean;
      count: number;
      duration?: number;
      saved?: number;
      validation?: {
        valid: boolean;
        issues: string[];
        warnings: string[];
        totalProcessed: number;
        validCount: number;
      };
      error?: string;
    }> = [];

    if (mode === 'all') {
      // 🚀 통합 크롤링 (모든 소스)
      // console.log('🎯 통합 크롤링 모드: 모든 소스 크롤링');
      const allSourcesResult = await crawler.crawlAllSources();
      
      results = [{
        source: 'all_sources',
        success: allSourcesResult.success,
        count: allSourcesResult.data.length,
        duration: allSourcesResult.duration,
        saved: allSourcesResult.saved,
        validation: allSourcesResult.validation,
        error: allSourcesResult.error
      }];
      
    } else {
      // 개별 소스별 크롤링 (기존 방식 호환)
      const crawlConfigs = [
        {
          source: 'reviewplace',
          method: () => crawler.crawlReviewplace('제품'),
          categories: ['제품', '지역', '기자단']
        },
        {
          source: 'reviewnote', 
          method: () => crawler.crawlReviewnote(),
          categories: ['재택', '지역별']
        },
        {
          source: 'revu',
          method: () => crawler.crawlRevu('제품'),
          categories: ['제품', '쇼핑리뷰']
        }
      ];

      const targetConfig = crawlConfigs.find(c => c.source === mode);
      if (targetConfig) {
        // console.log(`🎯 개별 크롤링 모드: ${targetConfig.source}`);
        const result = await targetConfig.method();
        
        results.push({
          source: targetConfig.source,
          success: result.success,
          count: result.data.length,
          duration: result.duration,
          saved: result.saved,
          validation: result.validation,
          error: result.error
        });
      } else {
        throw new Error(`지원하지 않는 모드: ${mode}`);
      }
    }

    const totalDuration = Date.now() - startTime;
    const summary = {
      mode,
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalItems: results.reduce((sum, r) => sum + r.count, 0),
      totalSaved: results.reduce((sum, r) => sum + (r.saved || 0), 0),
      totalDuration
    };

    // console.log('✅ 다중 소스 크론 크롤링 완료:', summary);

    return NextResponse.json({
      success: summary.successful > 0,
      mode,
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 다중 소스 크론 크롤링 실패:', (error as Error).message);

    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const GET = withCronAuth(cronHandler);