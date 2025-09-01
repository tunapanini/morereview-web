// 간단한 DB 저장 서비스 (null 방지 보장)

import { createClient } from '@supabase/supabase-js';
import { SimpleCampaign, CampaignForDB } from '@/types/simple-crawler';
import { DataValidator } from './data-validator';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SimpleDBSaver {
  async saveCampaigns(campaigns: SimpleCampaign[]): Promise<number> {
    if (campaigns.length === 0) return 0;


    // Supabase 저장용 데이터 변환 (null 방지)
    let campaignsToSave: CampaignForDB[] = campaigns.map((campaign, index) => {
      const remainingDays = this.parseDaysWithFallback(campaign.deadline, index);
      
      // 자동 데이터 품질 검증
      const isInvalid = DataValidator.isInvalidCampaign(campaign.title);
      
      return {
        source_site: campaign.source,
        campaign_id: this.generateId(campaign),
        title: campaign.title,
        description: campaign.description,
        reward_points: campaign.reward,
        remaining_days: remainingDays, // 하위 호환성을 위해 유지
        deadline: campaign.deadlineDate, // 실제 마감일
        detail_url: campaign.detailUrl || '',
        applications_current: 0,
        applications_total: 0,
        extracted_at: new Date().toISOString(),
        is_hidden: false,
        is_invalid: isInvalid
      };
    });

    // 🚨 중복 ID 제거 (같은 배치 내에서)
    const seenIds = new Set<string>();
    const originalLength = campaignsToSave.length;
    campaignsToSave = campaignsToSave.filter(campaign => {
      if (seenIds.has(campaign.campaign_id)) {
        console.warn(`🔄 배치 내 중복 제거: ${campaign.campaign_id}`);
        return false;
      }
      seenIds.add(campaign.campaign_id);
      return true;
    });

    if (originalLength !== campaignsToSave.length) {
    }

    // 저장 전 최종 검증
    this.validateBeforeSave(campaignsToSave);

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .upsert(campaignsToSave, { 
          onConflict: 'source_site,campaign_id',
          ignoreDuplicates: false
        })
        .select('id');

      if (error) {
        console.error('❌ DB 저장 실패:', error.message);
        return 0;
      }

      const savedCount = data?.length || 0;
      
      return savedCount;

    } catch (error) {
      console.error('❌ DB 저장 예외:', (error as Error).message);
      return 0;
    }
  }

  private generateId(campaign: SimpleCampaign): string {
    // URL 기반 고유 ID 생성 (URL은 항상 있어야 함)
    if (!campaign.detailUrl) {
      throw new Error(`detail_url이 없습니다: ${campaign.title}`);
    }
    
    // 리뷰플레이스: pr/?id=240529
    const reviewplaceMatch = campaign.detailUrl.match(/pr\/\?id=(\d+)/);
    if (reviewplaceMatch) {
      return `reviewplace-${reviewplaceMatch[1]}`;
    }
    
    // 리뷰노트: /campaign/123
    const reviewnoteMatch = campaign.detailUrl.match(/campaign[\/s]*(\d+)/);
    if (reviewnoteMatch) {
      return `reviewnote-${reviewnoteMatch[1]}`;
    }
    
    // Revu: /campaign/abc123  
    const revuMatch = campaign.detailUrl.match(/campaign[\/s]*([a-zA-Z0-9]+)/);
    if (revuMatch) {
      return `revu-${revuMatch[1]}`;
    }
    
    // 기타 URL 패턴에서 ID 추출
    const idMatch = campaign.detailUrl.match(/[?&]id=([a-zA-Z0-9]+)/);
    if (idMatch) {
      return `${campaign.source}-${idMatch[1]}`;
    }
    
    // URL이 있지만 패턴을 찾을 수 없는 경우 URL 전체를 해시화
    const hash = Buffer.from(`${campaign.source}-${campaign.detailUrl}`, 'utf8')
      .toString('base64')
      .replace(/[+/=]/g, 'x')
      .substring(0, 32);
    
    return hash;
  }

  // 🚨 핵심: null 방지가 보장된 날짜 파싱
  private parseDaysWithFallback(deadline: string, index?: number): number {
    if (!deadline) {
      console.warn(`⚠️ deadline 없음 (캠페인 ${index}), 기본값 7일 적용`);
      return 7; // null 대신 기본값
    }
    
    // D-X 패턴 추출
    const dMatch = deadline.match(/D-(\d+)/);
    if (dMatch) {
      const days = parseInt(dMatch[1], 10);
      if (days > 0 && days <= 365) {
        return days;
      }
      console.warn(`⚠️ D-day 값이 비정상 (${days}), 기본값 적용`);
      return 7;
    }
    
    // MM.DD 형태 처리
    const dateMatch = deadline.match(/(\d{1,2})\.(\d{1,2})/);
    if (dateMatch) {
      try {
        const month = parseInt(dateMatch[1], 10);
        const day = parseInt(dateMatch[2], 10);
        const currentYear = new Date().getFullYear();
        const targetDate = new Date(currentYear, month - 1, day);
        const today = new Date();
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays <= 365) {
          return diffDays;
        }
        
        console.warn(`⚠️ MM.DD 계산 결과가 비정상 (${diffDays}일), 기본값 적용`);
        return 7;
      } catch {
        console.warn(`⚠️ MM.DD 파싱 실패: ${deadline}, 기본값 적용`);
        return 7;
      }
    }
    
    // 기타 텍스트 패턴들
    const textPatterns = [
      { pattern: /(\d+)\s*일\s*남음/, weight: 1 },
      { pattern: /남은\s*(\d+)\s*일/, weight: 1 },
      { pattern: /마감\s*(\d+)\s*일/, weight: 1 },
    ];
    
    for (const { pattern } of textPatterns) {
      const match = deadline.match(pattern);
      if (match) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 90) {
          return days;
        }
      }
    }
    
    console.warn(`⚠️ 날짜 파싱 완전 실패 (캠페인 ${index}): ${deadline}, 기본값 7일 적용`);
    return 7; // 모든 경우에 기본값 반환 (절대 null 안됨)
  }
  
  // 저장 전 최종 검증
  private validateBeforeSave(campaigns: CampaignForDB[]): void {
    let issues = 0;
    const duplicateIds = new Set<string>();
    const seenIds = new Set<string>();
    
    campaigns.forEach((campaign, index) => {
      // 기본 검증
      if (campaign.remaining_days === null || campaign.remaining_days === undefined) {
        console.error(`🚨 CRITICAL: remaining_days가 null (캠페인 ${index})`);
        campaign.remaining_days = 7; // 강제 수정
        issues++;
      }
      
      if (campaign.remaining_days <= 0) {
        console.warn(`⚠️ remaining_days가 0 이하 (캠페인 ${index}): ${campaign.remaining_days}`);
        campaign.remaining_days = 1; // 최소 1일로 수정
        issues++;
      }
      
      if (!campaign.title || campaign.title.trim().length === 0) {
        console.error(`🚨 제목이 비어있음 (캠페인 ${index})`);
        campaign.title = '제목 없음';
        issues++;
      }
      
      // 제목 품질 검사
      if (campaign.title.length < 5) {
        console.warn(`⚠️ 제목이 너무 짧음 (캠페인 ${index}): "${campaign.title}"`);
        issues++;
      }
      
      // 중복 ID 검사
      if (seenIds.has(campaign.campaign_id)) {
        duplicateIds.add(campaign.campaign_id);
        console.warn(`⚠️ 중복 campaign_id 발견 (캠페인 ${index}): ${campaign.campaign_id}`);
      } else {
        seenIds.add(campaign.campaign_id);
      }
      
      // 소스 검증
      if (!['reviewplace.co.kr', 'reviewnote.co.kr', 'revu.net'].includes(campaign.source_site)) {
        console.warn(`⚠️ 알 수 없는 소스 (캠페인 ${index}): ${campaign.source_site}`);
        issues++;
      }
      
      // URL 유효성 검사
      if (campaign.detail_url && !campaign.detail_url.startsWith('http')) {
        console.warn(`⚠️ 유효하지 않은 URL (캠페인 ${index}): ${campaign.detail_url}`);
        issues++;
      }
    });
    
    if (duplicateIds.size > 0) {
      console.warn(`⚠️ ${duplicateIds.size}개의 고유 ID가 중복되었습니다. DB에서 자동 처리됩니다.`);
    }
    
    if (issues > 0) {
      console.warn(`⚠️ 총 ${issues}개 데이터 이슈를 감지했습니다.`);
    }
  }
}