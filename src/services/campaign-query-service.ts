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
  async getQualityCampaigns(params: CampaignQueryParams): Promise<CampaignQueryResult> {
    const {
      page = 1,
      limit = 50,
      source_site,
      category,
      sortBy = 'latest',
      sortOrder = 'desc'
    } = params;

    let query = this.supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      // 데이터 품질 필터링: 숨겨지지 않고 유효한 캠페인만
      .eq('is_hidden', false)
      .eq('is_invalid', false);

    // 추가 필터링
    if (source_site) {
      query = query.eq('source_site', source_site);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // 정렬 적용
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
        .order('id', { ascending: false }); // 보조 정렬
    } else if (sortBy === 'deadline') {
      // deadline 컬럼이 있으면 우선 사용, 없으면 remaining_days 폴백
      query = query.order('deadline', { ascending: sortOrder === 'asc', nullsFirst: false })
        .order('remaining_days', { ascending: sortOrder === 'asc', nullsFirst: false })
        .order('id', { ascending: false }); // 보조 정렬
    }

    // 페이지네이션
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