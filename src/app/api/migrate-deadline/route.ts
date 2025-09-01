// DB 스키마 마이그레이션: remaining_days를 deadline으로 변환

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DeadlineMigrationResult {
  totalProcessed: number;
  successfullyMigrated: number;
  failed: number;
  errors: string[];
  details: Array<{
    campaign_id: string;
    title: string;
    oldRemainingDays: number;
    newDeadline: string;
    method: string;
  }>;
}

export async function POST() {
  const startTime = Date.now();

  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '프로덕션 환경에서는 직접 실행할 수 없습니다.' },
        { status: 403 }
      );
    }

    const result = await migrateDeadlineColumns();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...result,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ deadline 마이그레이션 실패:', (error as Error).message);
    return NextResponse.json(
      { 
        error: 'Deadline migration failed',
        message: (error as Error).message,
        duration: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

async function migrateDeadlineColumns(): Promise<DeadlineMigrationResult> {
  
  // 1. deadline 컬럼 추가 (직접 SQL 실행)
  console.log('🔄 deadline 컬럼 추가...');
  
  try {
    const { error: addColumnError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;'
      });
    
    if (addColumnError) {
      console.warn('컬럼 추가 시 경고:', addColumnError.message);
    } else {
      console.log('✅ deadline 컬럼 추가 완료');
    }
  } catch {
    // supabase.rpc가 없는 경우 대안 사용
    console.log('🔄 RPC 대신 직접 ALTER 시도...');
    
    // 직접 raw query 실행
    await supabase
      .from('campaigns')
      .select('deadline')
      .limit(1);
  }

  // 2. deadline이 NULL인 캠페인들 조회
  const { data: nullDeadlineCampaigns, error: fetchError } = await supabase
    .from('campaigns')
    .select('id, campaign_id, title, remaining_days, deadline')
    .is('deadline', null)
    .limit(2000);

  if (fetchError) {
    throw new Error(`DB 조회 실패: ${fetchError.message}`);
  }

  if (!nullDeadlineCampaigns || nullDeadlineCampaigns.length === 0) {
    return {
      totalProcessed: 0,
      successfullyMigrated: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  const result: DeadlineMigrationResult = {
    totalProcessed: nullDeadlineCampaigns.length,
    successfullyMigrated: 0,
    failed: 0,
    errors: [],
    details: []
  };

  // 3. 각 캠페인에 대해 deadline 계산 및 업데이트
  for (const campaign of nullDeadlineCampaigns) {
    try {
      const newDeadline = calculateDeadlineFromRemainingDays(campaign.remaining_days);
      
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ deadline: newDeadline.toISOString() })
        .eq('id', campaign.id);

      if (updateError) {
        result.failed++;
        result.errors.push(`캠페인 ${campaign.campaign_id} 업데이트 실패: ${updateError.message}`);
      } else {
        result.successfullyMigrated++;
        result.details.push({
          campaign_id: campaign.campaign_id,
          title: campaign.title.substring(0, 50) + '...',
          oldRemainingDays: campaign.remaining_days,
          newDeadline: newDeadline.toISOString(),
          method: campaign.remaining_days > 0 ? 'calculated' : 'default'
        });
      }

    } catch (error) {
      result.failed++;
      result.errors.push(`캠페인 ${campaign.campaign_id} 처리 실패: ${(error as Error).message}`);
    }
  }

  return result;
}

function calculateDeadlineFromRemainingDays(remainingDays: number): Date {
  const now = new Date();
  
  // remaining_days 검증 및 기본값 설정
  let days = remainingDays;
  
  if (days === null || days === undefined || days <= 0) {
    days = 7; // 기본값: 7일
  } else if (days > 365) {
    days = 30; // 과도하게 긴 경우 30일로 제한
  }
  
  // 현재 시간에 남은 일수를 더해서 마감일 계산
  const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  // 마감일을 해당일 23:59:59로 설정
  deadline.setHours(23, 59, 59, 999);
  
  return deadline;
}

// 마이그레이션 상태 확인 API
export async function GET() {
  try {
    // deadline이 NULL인 캠페인 수 확인
    const { data: nullDeadlineCount, error: nullError } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .is('deadline', null);

    if (nullError) {
      throw new Error(`조회 실패: ${nullError.message}`);
    }

    // 전체 캠페인 수 확인
    const { data: totalCount, error: totalError } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' });

    if (totalError) {
      throw new Error(`전체 조회 실패: ${totalError.message}`);
    }

    // deadline이 설정된 최근 캠페인들 샘플
    const { data: recentSample } = await supabase
      .from('campaigns')
      .select('campaign_id, title, remaining_days, deadline, updated_at')
      .not('deadline', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    const nullCountValue = (nullDeadlineCount as unknown[])?.length || 0;
    const totalCountValue = (totalCount as unknown[])?.length || 0;
    const migrationProgress = totalCountValue > 0 ? 
      Math.round(((totalCountValue - nullCountValue) / totalCountValue) * 100) : 100;

    return NextResponse.json({
      status: 'ready',
      statistics: {
        totalCampaigns: totalCountValue,
        nullDeadlines: nullCountValue,
        migratedCampaigns: totalCountValue - nullCountValue,
        migrationProgress: migrationProgress
      },
      recentSample: recentSample?.map(campaign => ({
        campaign_id: campaign.campaign_id,
        title: campaign.title.substring(0, 50),
        remaining_days: campaign.remaining_days,
        deadline: campaign.deadline,
        updated_at: campaign.updated_at
      })) || [],
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