import { CampaignCategory, CampaignPlatform, CampaignSource } from '@/types/campaign';

// 카테고리별 한국어 라벨
export const categoryLabels: Record<CampaignCategory, string> = {
  beauty: '뷰티',
  health: '건강식품',
  fashion: '패션',
  lifestyle: '라이프스타일',
};

// 플랫폼별 한국어 라벨
export const platformLabels: Record<CampaignPlatform, string> = {
  naverblog: '네이버블로그',
  instagram: '인스타그램',
  youtube: '유튜브',
  tiktok: '틱톡',
  smartstore_review: '스마트스토어 구매평',
  company_mall_review: '자사몰 구매평',
  coupang_review: '쿠팡 구매평',
};

// 소스별 한국어 라벨
export const sourceLabels: Record<CampaignSource, string> = {
  reviewplace: '리뷰플레이스',
  reviewnote: '리뷰노트',
  reviewtiful: '리뷰티풀',
  revu: '레뷰',
  dinnerqueen: '디너의여왕',
  miso: '미소',
  chertian: '체르티안',
  covey: '코베이',
  ringble: '링블',
  seoulouba: '서울오빠',
};

// 테이블 헤더 및 관련 라벨
export const tableLabels = {
  headers: {
    action: '액션',
    campaignInfo: '캠페인 정보',
    platform: '플랫폼',
    reward: '제공내역', // 보상금액 -> 제공내역으로 변경
    endDate: '신청마감일',
  },
  mobile: {
    daysLeft: '일 남음',
  },
  visitType: {
    location: '방문',
  },
} as const;

// 정렬 옵션 라벨
export const sortLabels = {
  latest: '최신순',
  deadline: '신청마감 임박순',
  reward: '제공내역순', // 보상금액 -> 제공내역으로 변경
} as const;