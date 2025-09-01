// detail_url 중복 데이터 확인 및 정리 API

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // detail_url 중복 현황 확인
    const { data: duplicates, error } = await supabase
      .rpc('find_duplicate_detail_urls')
      .select();

    if (error) {
      // 함수가 없는 경우 직접 쿼리
      const { data: allCampaigns, error: fetchError } = await supabase
        .from('campaigns')
        .select('id, campaign_id, title, detail_url, source_site, created_at')
        .not('detail_url', 'is', null)
        .neq('detail_url', '');

      if (fetchError) {
        throw new Error(`캠페인 조회 실패: ${fetchError.message}`);
      }

      // 중복 URL 그룹핑  
      const urlGroups = new Map<string, typeof allCampaigns>();
      allCampaigns?.forEach(campaign => {
        if (!campaign.detail_url) return;
        
        const key = campaign.detail_url;
        if (!urlGroups.has(key)) {
          urlGroups.set(key, []);
        }
        urlGroups.get(key)!.push(campaign);
      });

      // 중복된 URL들만 필터링
      const duplicateGroups = Array.from(urlGroups.entries())
        .filter(([, campaigns]) => campaigns.length > 1)
        .map(([url, campaigns]) => ({
          detail_url: url,
          count: campaigns.length,
          campaigns: campaigns.map(c => ({
            id: c.id,
            campaign_id: c.campaign_id,
            title: c.title.substring(0, 50) + '...',
            source_site: c.source_site,
            created_at: c.created_at
          }))
        }));

      return NextResponse.json({
        status: 'success',
        duplicateCount: duplicateGroups.length,
        totalDuplicateRows: duplicateGroups.reduce((sum, group) => sum + group.count, 0),
        duplicateGroups: duplicateGroups.slice(0, 10), // 최대 10개 그룹만 표시
        needsCleanup: duplicateGroups.length > 0
      });
    }

    return NextResponse.json({
      status: 'success',
      duplicates: duplicates || []
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Duplicate check failed',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '프로덕션 환경에서는 직접 실행할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 중복 데이터 정리 실행
    const result = await cleanupDuplicateUrls();
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}

async function cleanupDuplicateUrls() {
  // detail_url로 그룹핑하여 중복 찾기
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, campaign_id, title, detail_url, source_site, created_at')
    .not('detail_url', 'is', null)
    .neq('detail_url', '')
    .order('created_at', { ascending: false }); // 최신 것을 우선

  if (error) {
    throw new Error(`캠페인 조회 실패: ${error.message}`);
  }

  if (!campaigns) {
    return { cleaned: 0, kept: 0 };
  }

  // URL별로 그룹핑
  const urlGroups = new Map<string, typeof campaigns>();
  campaigns.forEach(campaign => {
    const key = campaign.detail_url!;
    if (!urlGroups.has(key)) {
      urlGroups.set(key, []);
    }
    urlGroups.get(key)!.push(campaign);
  });

  let totalCleaned = 0;
  let totalKept = 0;

  // 중복된 URL들만 처리
  for (const [url, duplicateCampaigns] of urlGroups) {
    if (duplicateCampaigns.length <= 1) {
      totalKept += duplicateCampaigns.length;
      continue;
    }

    // 가장 최신 것 1개를 남기고 나머지 삭제
    const toDelete = duplicateCampaigns.slice(1);

    console.warn(`🔄 중복 URL 정리: ${url} (${duplicateCampaigns.length}개 중 ${toDelete.length}개 삭제)`);

    // 중복 데이터 삭제
    const idsToDelete = toDelete.map(c => c.id);
    
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error(`❌ 삭제 실패 (${url}):`, deleteError.message);
      } else {
        totalCleaned += idsToDelete.length;
        totalKept += 1; // 유지한 것
      }
    }
  }

  return {
    cleaned: totalCleaned,
    kept: totalKept,
    duplicateUrls: Array.from(urlGroups.keys()).filter(url => urlGroups.get(url)!.length > 1).length
  };
}