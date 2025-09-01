// "30포" 등 잘못 파싱된 포인트 데이터 수정 마이그레이션 API

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RewardMigrationResult {
  totalProcessed: number;
  successfullyMigrated: number;
  failed: number;
  errors: string[];
  details: Array<{
    campaign_id: string;
    title: string;
    oldReward: number;
    newReward: number;
    reason: string;
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

    const result = await migrateRewardParsing();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...result,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 리워드 마이그레이션 실패:', (error as Error).message);
    return NextResponse.json(
      { 
        error: 'Reward migration failed',
        message: (error as Error).message,
        duration: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

async function migrateRewardParsing(): Promise<RewardMigrationResult> {
  
  // "포" 단위로 잘못 파싱된 데이터들 조회 (리뷰플레이스만)
  const { data: wronglyParsedCampaigns, error: fetchError } = await supabase
    .from('campaigns')
    .select('id, campaign_id, title, detail_url, source_site, reward_points, description')
    .eq('source_site', 'reviewplace.co.kr')
    .limit(2000);

  if (fetchError) {
    throw new Error(`DB 조회 실패: ${fetchError.message}`);
  }

  if (!wronglyParsedCampaigns || wronglyParsedCampaigns.length === 0) {
    return {
      totalProcessed: 0,
      successfullyMigrated: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  const result: RewardMigrationResult = {
    totalProcessed: 0,
    successfullyMigrated: 0,
    failed: 0,
    errors: [],
    details: []
  };

  // "포" 패턴으로 잘못 파싱된 캠페인들 필터링
  const toUpdate = wronglyParsedCampaigns.filter(campaign => {
    const hasPoPattern = campaign.description?.includes('포') || 
                        campaign.title?.includes('포');
    
    // 30포, 50포 등의 패턴이 있고 리워드가 30, 50인 경우
    if (hasPoPattern && campaign.reward_points > 0 && campaign.reward_points < 1000) {
      const poMatch = (campaign.description || campaign.title || '').match(/(\d+)\s*포/);
      if (poMatch && parseInt(poMatch[1]) === campaign.reward_points) {
        return true;
      }
    }
    return false;
  });

  result.totalProcessed = toUpdate.length;

  // 잘못 파싱된 데이터들을 0으로 수정 (포인트가 아니므로)
  for (const campaign of toUpdate) {
    try {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ reward_points: 0 })
        .eq('id', campaign.id);

      if (updateError) {
        result.failed++;
        result.errors.push(`캠페인 ${campaign.campaign_id} 업데이트 실패: ${updateError.message}`);
      } else {
        result.successfullyMigrated++;
        result.details.push({
          campaign_id: campaign.campaign_id,
          title: campaign.title.substring(0, 50) + '...',
          oldReward: campaign.reward_points,
          newReward: 0,
          reason: '"포" 단위는 포인트가 아님 (제품 개수)'
        });
      }

    } catch (error) {
      result.failed++;
      result.errors.push(`캠페인 ${campaign.campaign_id} 처리 실패: ${(error as Error).message}`);
    }
  }

  return result;
}

// 마이그레이션 상태 확인 API
export async function GET() {
  try {
    // 잘못 파싱된 "포" 데이터 개수 확인
    const { data: wrongCampaigns, error: wrongError } = await supabase
      .from('campaigns')
      .select('id, campaign_id, title, reward_points, description')
      .eq('source_site', 'reviewplace.co.kr')
      .gt('reward_points', 0)
      .lt('reward_points', 1000);

    if (wrongError) {
      throw new Error(`조회 실패: ${wrongError.message}`);
    }

    // "포" 패턴 필터링
    const suspiciousRewards = (wrongCampaigns || []).filter(campaign => {
      const hasPoPattern = campaign.description?.includes('포') || 
                          campaign.title?.includes('포');
      
      if (hasPoPattern && campaign.reward_points > 0 && campaign.reward_points < 1000) {
        const poMatch = (campaign.description || campaign.title || '').match(/(\d+)\s*포/);
        return poMatch && parseInt(poMatch[1]) === campaign.reward_points;
      }
      return false;
    });

    return NextResponse.json({
      status: 'ready',
      statistics: {
        suspiciousRewardCount: suspiciousRewards.length,
        sampleIssues: suspiciousRewards.slice(0, 5).map(c => ({
          campaign_id: c.campaign_id,
          title: c.title.substring(0, 50),
          reward: c.reward_points,
          description: c.description
        }))
      },
      needsMigration: suspiciousRewards.length > 0,
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