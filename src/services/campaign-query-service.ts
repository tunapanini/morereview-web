// 캠페인 조회 및 필터링 서비스

import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export interface CampaignQueryParams {
  page?: number;
  limit?: number;
  source_site?: string;
  category?: string;
  sortBy?: import('@/types/campaign').CampaignSortBy;
  sortOrder?: import('@/types/campaign').CampaignSortOrder;
}

export interface CampaignQueryResult {
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CampaignQueryService {
  private supabase;

  constructor(useServerClient = false) {
    if (useServerClient) {
      this.supabase = createServerClient();
    } else {
      this.supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
  }

  /**
   * 고품질 캠페인 조회 (숨겨지지 않고 유효한 캠페인만)
   */
  /**
   * 고품질 캠페인 조회 (성능 최적화 버전)
   */
  /**
   * 고품질 캠페인 조회 (성능 최적화 버전)
   */
  async getQualityCampaigns(params: CampaignQueryParams): Promise<CampaignQueryResult> {
    const {
      page = 1,
      limit = 50,
      source_site,
      category,
      sortBy = 'latest',
      sortOrder = 'desc'
    } = params;

    // 📊 필요한 컬럼만 선택하여 네트워크 부하 감소
    const selectedColumns = [
      'id', 'source_site', 'campaign_id', 'title', 'description',
      'thumbnail_image', 'detail_url', 'applications_current',
      'applications_total', 'reward_points', 'category', 'location_type',
      'channels', 'extracted_at', 'created_at', 'deadline'
    ].join(', ');

    let query = this.supabase
      .from('campaigns')
      .select(selectedColumns, { count: 'exact' })
      // 🎯 핵심 필터링: 복합 인덱스 활용을 위해 순서 최적화
      .eq('is_hidden', false)
      .eq('is_invalid', false);

    // 🔍 추가 필터링: 인덱스 순서에 맞춰 배치
    if (source_site) {
      query = query.eq('source_site', source_site);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // ⚡ 정렬 로직 최적화: 인덱스 활용 극대화
    if (sortBy === 'latest') {
      // 복합 인덱스 (is_hidden, is_invalid, created_at DESC, id DESC) 활용
      query = query
        .order('created_at', { ascending: sortOrder === 'asc' })
        .order('id', { ascending: sortOrder === 'asc' }); // 동일 시간대 정렬 보장
    } else if (sortBy === 'deadline') {
      // 복합 인덱스 (is_hidden, is_invalid, deadline DESC, id DESC) 활용
      query = query
        .order('deadline', { ascending: sortOrder === 'asc', nullsFirst: false })
        .order('id', { ascending: false }); // 보조 정렬
    } else if (sortBy === 'reward') {
      query = query
        .order('reward_points', { ascending: sortOrder === 'asc', nullsFirst: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
    }

    // 📄 페이지네이션: OFFSET 기반 (차후 커서 기반으로 업그레이드 예정)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: campaigns, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`캠페인 조회 실패: ${error.message}`);
    }

    return {
      data: campaigns || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

}