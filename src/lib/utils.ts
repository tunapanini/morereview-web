import { Campaign, CampaignFilters, CampaignSource, CampaignPlatform } from '@/types/campaign';

// Platform brand colors
export const platformColors: Record<CampaignPlatform, string> = {
  naverblog: '#03C75A',  // Naver green
  instagram: '#E4405F',  // Instagram gradient primary
  youtube: '#FF0000',    // YouTube red
  tiktok: '#000000',     // TikTok black
  smartstore_review: '#FF6600',  // Review orange (unified)
  company_mall_review: '#FF6600',  // Review orange (unified)
  coupang_review: '#FF6600',  // Review orange (unified)
};

export function filterCampaigns(campaigns: Campaign[], filters: CampaignFilters): Campaign[] {
  let filtered = [...campaigns];

  // Search query filter
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(query) ||
        campaign.brand.toLowerCase().includes(query) ||
        campaign.description?.toLowerCase().includes(query)
    );
  }


  // Platform filter
  if (filters.platforms.length > 0) {
    filtered = filtered.filter((campaign) => {
      // 선택된 플랫폼 중 하나라도 포함된 캠페인을 표시
      // 예: 네이버블로그 선택 시 -> 네이버블로그만 있는 캠페인
      // 네이버블로그+인스타그램 선택 시 -> 네이버블로그만, 인스타그램만, 둘 다 있는 캠페인 모두 표시
      return filters.platforms.some((selectedPlatform) =>
        campaign.platforms.includes(selectedPlatform)
      );
    });
  }

  // Visit type filter
  if (filters.visitType) {
    filtered = filtered.filter((campaign) => {
      return campaign.visitType === filters.visitType;
    });
  }

  // Region filter
  if (filters.regionCode) {
    filtered = filtered.filter((campaign) => {
      // 하위 지역이 선택된 경우 정확히 일치하는 캠페인만
      if (filters.subRegionCode) {
        return campaign.subRegionCode === filters.subRegionCode;
      }
      // 상위 지역만 선택된 경우 해당 지역의 모든 캠페인
      return campaign.regionCode === filters.regionCode;
    });
  }


  return filtered;
}

// 클라이언트 사이드 정렬 함수 제거됨
// 이제 서버 사이드에서만 정렬 수행

export function getCampaignCounts(
  campaigns: Campaign[],
  currentFilters: CampaignFilters
) {
  const categoryCounts = {
    beauty: 0,
    health: 0,
    fashion: 0,
    lifestyle: 0,
  };

  const platformCounts: Record<CampaignPlatform, number> = {
    naverblog: 0,
    instagram: 0,
    youtube: 0,
    tiktok: 0,
    smartstore_review: 0,
    company_mall_review: 0,
    coupang_review: 0,
  };

  const sourceCounts: Record<CampaignSource, number> = {
    reviewplace: 0,
    reviewnote: 0,
    reviewtiful: 0,
    revu: 0,
    dinnerqueen: 0,
    miso: 0,
    chertian: 0,
    covey: 0,
    ringble: 0,
    seoulouba: 0,
  };

  // Apply current search and platform/category filters to get relevant counts
  const searchFiltered = campaigns.filter((campaign) => {
    const query = currentFilters.searchQuery.toLowerCase().trim();
    return !query ||
      campaign.title.toLowerCase().includes(query) ||
      campaign.brand.toLowerCase().includes(query) ||
      campaign.description?.toLowerCase().includes(query);
  });

  // Count categories (with current platform filters applied)
  const platformFilteredForCategories = currentFilters.platforms.length > 0
    ? searchFiltered.filter((campaign) => {
      // 선택된 플랫폼 중 하나라도 포함된 캠페인을 표시
      return currentFilters.platforms.some((selectedPlatform) =>
        campaign.platforms.includes(selectedPlatform)
      );
    })
    : searchFiltered;

  platformFilteredForCategories.forEach((campaign) => {
    categoryCounts[campaign.category]++;
  });

  // Count platforms (no category filter anymore)
  const categoryFilteredForPlatforms = searchFiltered;

  categoryFilteredForPlatforms.forEach((campaign) => {
    campaign.platforms.forEach((platform) => {
      platformCounts[platform]++;
    });
  });

  // Count sources (with current category and platform filters applied, excluding already excluded sources)
  const baseFilteredForSources = campaigns.filter((campaign) => {
    const query = currentFilters.searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      campaign.title.toLowerCase().includes(query) ||
      campaign.brand.toLowerCase().includes(query) ||
      campaign.description?.toLowerCase().includes(query);


    const matchesPlatforms = currentFilters.platforms.length === 0 ||
      currentFilters.platforms.some((selectedPlatform) =>
        campaign.platforms.includes(selectedPlatform)
      );

    return matchesSearch && matchesPlatforms;
  });

  baseFilteredForSources.forEach((campaign) => {
    sourceCounts[campaign.source]++;
  });

  return { categoryCounts, platformCounts, sourceCounts };
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

// Format date for display
export function formatDate(date: Date | undefined): string {
  if (!date) return '날짜 없음';
  return `${date.getMonth() + 1}/${date.getDate()} 마감`;
}

// Check if campaign is ending soon
export function isEndingSoon(endDate: Date | undefined, days: number = 2): boolean {
  if (!endDate) return false;
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays > 0;
}

// Check if deadline badge should be shown (consistent with DeadlineBadge component)
export function shouldShowDeadlineBadge(endDate: Date | undefined): boolean {
  if (!endDate) return false;
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysUntilEnd = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return daysUntilEnd > 0 && daysUntilEnd <= 2;
}

// Get days until end
export function getDaysUntilEnd(endDate: Date | undefined): number {
  if (!endDate) return 0;
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}


// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Local storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle quota exceeded or other errors
      console.warn('Failed to save to localStorage');
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

/**
 * 쿠팡 리소스 로드 에러를 로깅하는 함수
 */
export const logCoupangError = (component: string, error: string, details?: unknown) => {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션에서는 콘솔 로그 대신 에러 추적 서비스로 전송
    console.warn(`[Coupang Error] ${component}: ${error}`, details);

    // 여기에 Sentry나 다른 에러 추적 서비스로 전송하는 로직을 추가할 수 있습니다
    // 예: Sentry.captureException(new Error(`Coupang ${component} Error: ${error}`));
  } else {
    // 개발 환경에서는 상세한 로그 출력
    console.error(`[Coupang Error] ${component}:`, error, details);
  }
};

