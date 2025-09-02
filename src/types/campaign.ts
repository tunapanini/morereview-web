export type CampaignCategory = 'beauty' | 'health' | 'fashion' | 'lifestyle';
export type CategoryFilter = 'all' | CampaignCategory;
export type CampaignPlatform = 'naverblog' | 'instagram' | 'youtube' | 'tiktok' | 'smartstore_review' | 'company_mall_review' | 'coupang_review';
export type CampaignStatus = 'active' | 'ending-soon' | 'closed';
export type CampaignVisitType = 'visit' | 'delivery';
export type CampaignSortBy = 'latest' | 'deadline';
export type CampaignSortOrder = 'asc' | 'desc';
export type CampaignSource =
  | 'reviewplace'      // 리뷰플레이스
  | 'reviewnote'       // 리뷰노트
  | 'reviewtiful'      // 리뷰티풀
  | 'revu'             // 레뷰
  | 'dinnerqueen'      // 디너의여왕
  | 'miso'             // 미소
  | 'chertian'         // 체르티안
  | 'covey'            // 코베이
  | 'ringble'          // 링블
  | 'seoulouba'        // 서울오빠

export interface Campaign {
  id: string;
  title: string;
  brand: string;
  category: CampaignCategory;
  platforms: CampaignPlatform[];
  reward: number;
  // 방문 유형 및 위치 정보
  visitType: CampaignVisitType;
  location?: string; // 방문형 캠페인의 위치 정보
  // 지역 정보 (기존)
  regionCode?: string; // 상위 지역 코드 (seoul, gyeonggi 등)
  subRegionCode?: string; // 하위 지역 코드 (seoul-gangnam, gyeonggi-seongnam 등)
  // 제공 내역 상세 정보
  additionalRewards?: {
    type: 'cashback' | 'delivery' | 'snack' | 'product' | 'other';
    amount: number;
    description: string;
  }[];
  additionalCosts?: {
    type: 'purchase' | 'shipping' | 'other';
    amount: number;
    description: string;
  }[];
  startDate: Date;
  deadline?: Date;
  status: CampaignStatus;
  createdDate: Date; // 등록일 추가
  source: CampaignSource; // 캠페인 소스 추가
  sourceUrl?: string; // 소스 링크 URL 추가
  description?: string;
  requirements?: string[];
  imageUrl?: string;
}

export interface CampaignFilters {
  searchQuery: string;
  platforms: CampaignPlatform[];
  visitType?: CampaignVisitType; // 방문형/제공형 필터
  regionCode?: string; // 선택된 상위 지역
  subRegionCode?: string; // 선택된 하위 지역
  sortBy: CampaignSortBy;
  sortOrder: CampaignSortOrder;
}

export interface FavoriteState {
  campaigns: Set<string>;
  filters: {
    platforms: CampaignPlatform[];
  };
}