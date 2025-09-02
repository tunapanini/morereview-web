// 간단한 크롤링 시스템용 타입 정의

export interface SimpleCampaign {
  title: string;
  reward: number;
  deadline: string; // 호환성을 위해 유지 (D-X 형태)
  deadlineDate?: Date; // 실제 마감일
  detailUrl?: string; // TODO: 이것도 null 허용 안함 이어야함. 서버에서 데이터 검증 처리 필요.
  source: string;
  description?: string; // 제공내역 텍스트
}

export interface CrawlResult {
  success: boolean;
  data: SimpleCampaign[];
  duration: number;
  saved?: number;
  error?: string;
  validation?: ValidationResult;
}

export interface CrawlRequest {
  site: string;
  category?: string;
}

// 날짜 정보 추출 결과
export interface DateInfo {
  recruitmentStart?: Date;
  recruitmentEnd: Date;
  reviewStart?: Date;
  reviewEnd?: Date;
}

// 데이터 검증 결과
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  totalProcessed: number;
  validCount: number;
}

// DB 저장용 타입 (null 방지)
export interface CampaignForDB {
  source_site: string;
  campaign_id: string;
  title: string;
  description?: string;
  reward_points: number;
  deadline?: Date; // 실제 마감일
  detail_url?: string;
  applications_current: number;
  applications_total: number;
  extracted_at: string;
  is_hidden?: boolean;
  is_invalid?: boolean;
}