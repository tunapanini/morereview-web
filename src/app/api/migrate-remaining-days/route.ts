// 기존 remaining_days: null 데이터 마이그레이션 API

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MigrationResult {
  totalProcessed: number;
  successfullyMigrated: number;
  failed: number;
  errors: string[];
  details: Array<{
    campaign_id: string;
    title: string;
    oldValue: string | null;
    newValue: number;
    method: string;
  }>;
}

export async function POST() {
  const startTime = Date.now();

  try {
    // 환경 확인 (개발 환경에서만 실행 가능)
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '프로덕션 환경에서는 직접 실행할 수 없습니다.' },
        { status: 403 }
      );
    }

    const result = await migrateRemainingDays();
    const duration = Date.now() - startTime;


    return NextResponse.json({
      success: true,
      ...result,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', (error as Error).message);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        message: (error as Error).message,
        duration: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

async function migrateRemainingDays(): Promise<MigrationResult> {
  
  // 1. remaining_days가 null인 캠페인들 조회
  const { data: nullCampaigns, error: fetchError } = await supabase
    .from('campaigns')
    .select('id, campaign_id, title, detail_url, source_site, remaining_days')
    .is('remaining_days', null)
    .limit(1000); // 한 번에 1000개씩 처리

  if (fetchError) {
    throw new Error(`DB 조회 실패: ${fetchError.message}`);
  }

  if (!nullCampaigns || nullCampaigns.length === 0) {
    return {
      totalProcessed: 0,
      successfullyMigrated: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }


  const result: MigrationResult = {
    totalProcessed: nullCampaigns.length,
    successfullyMigrated: 0,
    failed: 0,
    errors: [],
    details: []
  };

  // 2. 각 캠페인에 대해 날짜 추출 시도
  for (const campaign of nullCampaigns) {
    try {
      const newRemainingDays = await extractRemainingDays(campaign);

      // 3. DB 업데이트
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ remaining_days: newRemainingDays })
        .eq('id', campaign.id);

      if (updateError) {
        result.failed++;
        result.errors.push(`캠페인 ${campaign.campaign_id} 업데이트 실패: ${updateError.message}`);
      } else {
        result.successfullyMigrated++;
        result.details.push({
          campaign_id: campaign.campaign_id,
          title: campaign.title.substring(0, 50) + '...',
          oldValue: null,
          newValue: newRemainingDays,
          method: newRemainingDays === 7 ? 'fallback' : 'extracted'
        });
      }

    } catch (error) {
      result.failed++;
      result.errors.push(`캠페인 ${campaign.campaign_id} 처리 실패: ${(error as Error).message}`);
    }
  }

  return result;
}

async function extractRemainingDays(
  campaign: {
    campaign_id: string;
    title: string;
    detail_url?: string;
    source_site?: string;
    deadline?: string;
  }
): Promise<number> {

  // 간단한 날짜 추출 헬퍼 함수
  function extractDeadlineFromUrl(url: string, source: string): string {
    // URL이나 제목에서 간단한 패턴 매칭
    const patterns = [
      /D-(\d+)/i,
      /(\d+)\s*일\s*남음/,
      /마감\s*(\d+)\s*일/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 365) {
          return `D-${days}`;
        }
      }
    }

    // 소스별 기본값
    switch (source) {
      case 'reviewnote.co.kr': return 'D-14';
      case 'revu.net': return 'D-10';
      default: return 'D-7';
    }
  }
  
  // Method 1: 간단한 패턴 매칭으로 추출 시도
  if (campaign.detail_url && campaign.source_site) {
    try {
      // 마이그레이션에서는 상세 페이지만 사용하므로 간단한 패턴 매칭으로 대체
      const deadline = extractDeadlineFromUrl(campaign.detail_url || '', campaign.source_site || 'reviewplace.co.kr');
      const days = parseInt(deadline.replace('D-', ''), 10);
      if (days > 0 && days <= 365) {
        return days;
      }
    } catch (error) {
      console.warn(`⚠️ 상세 페이지 추출 실패 (${campaign.campaign_id}):`, (error as Error).message);
    }
  }

  // Method 2: 제목에서 패턴 추출 시도
  if (campaign.title) {
    const titlePatterns = [
      /D-(\d+)/i,
      /(\d+)\s*일\s*남음/,
      /남은\s*(\d+)\s*일/,
      /마감\s*(\d+)\s*일/,
      /(\d{1,2})\.(\d{1,2})\s*마감/ // MM.DD 마감 형태
    ];

    for (const pattern of titlePatterns) {
      const match = campaign.title.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 90) {
          return days;
        }
      }
    }
  }

  // Method 3: 소스별 합리적 기본값
  let defaultDays = 7;
  if (campaign.source_site === 'reviewnote.co.kr') {
    defaultDays = 14; // 리뷰노트는 보통 더 긴 기간
  } else if (campaign.source_site === 'revu.net') {
    defaultDays = 10; // Revu는 중간 정도
  }

  return defaultDays;
}

// 마이그레이션 상태 확인 API
export async function GET() {
  try {
    // null remaining_days 개수 확인
    const { data: nullCount, error: nullError } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .is('remaining_days', null);

    if (nullError) {
      throw new Error(`조회 실패: ${nullError.message}`);
    }

    // 전체 캠페인 개수 확인
    const { data: totalCount, error: totalError } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' });

    if (totalError) {
      throw new Error(`전체 조회 실패: ${totalError.message}`);
    }

    // 최근 업데이트된 캠페인들 샘플
    const { data: recentSample } = await supabase
      .from('campaigns')
      .select('campaign_id, title, remaining_days, source_site, updated_at')
      .not('remaining_days', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    const nullCountValue = (nullCount as unknown[])?.length || 0;
    const totalCountValue = (totalCount as unknown[])?.length || 0;
    const migrationProgress = totalCountValue > 0 ? 
      Math.round(((totalCountValue - nullCountValue) / totalCountValue) * 100) : 100;

    return NextResponse.json({
      status: 'ready',
      statistics: {
        totalCampaigns: totalCountValue,
        nullRemainingDays: nullCountValue,
        migratedCampaigns: totalCountValue - nullCountValue,
        migrationProgress: migrationProgress
      },
      recentSample: recentSample || [],
      needsMigration: nullCountValue > 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Status check failed',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}