// 브랜드 및 서비스 관련 상수들
export const BRAND_INFO = {
  name: '모아리뷰',
  tagline: '인플루언서 캠페인을 한눈에 모아보세요',
  description: '인플루언서 캠페인 정보를 효율적으로 탐색하고 관리하는 플랫폼',
} as const;

// 서비스 카테고리 관련
export const SERVICE_CATEGORIES = {
  list: ['뷰티', '건강식품', '패션'],
  displayText: '뷰티, 건강식품, 패션',
} as const;

// 페이지별 설명 텍스트
export const PAGE_DESCRIPTIONS = {
  home: {
    hero: '다양한 인플루언서 캠페인 정보를 효율적으로 탐색하고 관리할 수 있는 플랫폼입니다',
    cta: '수많은 인플루언서 캠페인 중에서 당신에게 맞는 기회를 찾아보세요',
  },
  campaigns: {
    subtitle: '다양한 인플루언서 캠페인 정보를 탐색하고 관리하세요',
  },
} as const;

// 서비스 특징
export const SERVICE_FEATURES = [
  {
    icon: 'search',
    title: '쉬운 검색',
    description: '원하는 조건의 캠페인을 빠르게 찾아보세요',
  },
  {
    icon: 'heart',
    title: '즐겨찾기',
    description: '관심 있는 캠페인을 저장하고 관리하세요',
  },
  {
    icon: 'lightning',
    title: '실시간 업데이트',
    description: '최신 캠페인 정보를 실시간으로 확인하세요',
  },
] as const;

// 공통 메시지
export const COMMON_MESSAGES = {
  loading: '실제 리뷰 캠페인 데이터 로딩 중...',
  noResults: '검색 결과가 없습니다',
  noResultsDescription: '다른 키워드로 검색하거나 필터를 조정해보세요',
  clearAllFilters: '모든 필터 제거',
  copyright: '© 2025 MoreReview. All rights reserved.',
} as const;

// 공통 설명 텍스트
export const COMMON_DESCRIPTIONS = {
  appDescription: '인플루언서 캠페인 정보를 효율적으로 탐색하고 관리할 수 있는 웹 애플리케이션',
} as const;