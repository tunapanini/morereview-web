'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import PageLayout from '@/components/layout/PageLayout';
import CampaignFiltersComponent from '@/components/ui/CampaignFilters';

import CompactTableView from '@/components/ui/CompactTableView';
import CampaignTableSkeleton from '@/components/ui/CampaignTableSkeleton';
import { loadRealCampaignData } from '@/lib/campaignDataTransformer';
import { filterCampaigns, filterActiveCampaigns } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';

import { CampaignFilters, CampaignPlatform, CampaignVisitType, Campaign } from '@/types/campaign';
import { PAGE_DESCRIPTIONS, COMMON_MESSAGES } from '@/lib/constants';
import CoupangAdBanner from '@/components/ui/CoupangAdBanner';

// Constants
const AUTO_LOAD_DELAY_MS = 1500;

export default function CampaignsPage() {
  // Campaign data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(20);
  const [autoLoadProgress, setAutoLoadProgress] = useState(0);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const autoLoadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);

  // Filters state
  const [filters, setFilters] = useState<CampaignFilters>({
    searchQuery: '',
    platforms: [],
    visitType: undefined,
    regionCode: undefined,
    subRegionCode: undefined,
    sortBy: 'latest',
    sortOrder: 'desc',
  });

  // Load real campaign data
  useEffect(() => {
    async function loadCampaigns() {
      try {
        setIsLoading(true);
        const realCampaigns = await loadRealCampaignData(filters.sortBy, filters.sortOrder);

        // 추가 유효성 검사
        const validCampaigns = realCampaigns.filter(campaign =>
          campaign &&
          campaign.id &&
          campaign.title &&
          campaign.createdDate &&
          campaign.endDate &&
          campaign.startDate &&
          !isNaN(campaign.createdDate.getTime()) &&
          !isNaN(campaign.endDate.getTime()) &&
          !isNaN(campaign.startDate.getTime())
        );

        // 중복 ID 제거
        const uniqueCampaigns = validCampaigns.reduce((acc, campaign) => {
          acc.set(campaign.id, campaign);
          return acc;
        }, new Map<string, Campaign>());

        // 🚨 만료된 캠페인 자동 제외 및 상태 업데이트
        const activeCampaigns = filterActiveCampaigns(Array.from(uniqueCampaigns.values()));
        const finalCampaigns = activeCampaigns;

        logger.dev(`Loaded ${finalCampaigns.length} active campaigns out of ${validCampaigns.length} valid campaigns (expired campaigns filtered out)`);
        setCampaigns(finalCampaigns);
      } catch (error) {
        logger.error('Failed to load campaigns', error);
        setCampaigns([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCampaigns();
  }, [filters.sortBy, filters.sortOrder]);

  // Favorites hook
  const {
    favoriteCampaignsCount,
    toggleCampaignFavorite,
    isCampaignFavorited,
  } = useFavorites();

  // Filter campaigns (정렬은 서버에서 수행)
  const filteredCampaigns = useMemo(() => {
    try {
      if (!campaigns || campaigns.length === 0) return [];

      // Filter out campaigns with invalid dates
      const validCampaigns = campaigns.filter(campaign =>
        campaign &&
        campaign.createdDate &&
        campaign.endDate &&
        campaign.startDate &&
        !isNaN(campaign.createdDate.getTime()) &&
        !isNaN(campaign.endDate.getTime()) &&
        !isNaN(campaign.startDate.getTime())
      );

      if (validCampaigns.length === 0) return [];

      // 필터링만 수행 (정렬은 서버에서 이미 완료됨)
      return filterCampaigns(validCampaigns, filters);
    } catch (error) {
      console.error('Error filtering campaigns:', error);
      return [];
    }
  }, [campaigns, filters]);

  // Display campaigns (limited by displayCount)
  const displayedCampaigns = useMemo(() => {
    return filteredCampaigns.slice(0, displayCount);
  }, [filteredCampaigns, displayCount]);

  // Check if there are more campaigns to load
  const hasMoreCampaigns = displayCount < filteredCampaigns.length;

  // Load more handler
  const loadMoreCampaigns = useCallback(() => {
    setDisplayCount(prev => prev + 20);
    // Reset auto-loading state
    setIsAutoLoading(false);
    setAutoLoadProgress(0);
    if (autoLoadTimerRef.current) {
      clearTimeout(autoLoadTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
    // Reset auto-loading state when filters change
    setIsAutoLoading(false);
    setAutoLoadProgress(0);
    if (autoLoadTimerRef.current) {
      clearTimeout(autoLoadTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, [filters]);

  // Start auto-loading timer when button becomes visible
  const startAutoLoadTimer = useCallback(() => {
    // Clear any existing timers
    if (autoLoadTimerRef.current) {
      clearTimeout(autoLoadTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setIsAutoLoading(true);
    setAutoLoadProgress(0);

    // Progress animation (matches AUTO_LOAD_DELAY_MS)
    let progress = 0;
    const totalSteps = AUTO_LOAD_DELAY_MS / 100; // 15 steps for 1500ms
    progressIntervalRef.current = setInterval(() => {
      progress += 100 / totalSteps; // ~6.67% every 100ms = 100% in 1.5 seconds
      setAutoLoadProgress(progress);
      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, 100);

    // Auto-click after N seconds
    autoLoadTimerRef.current = setTimeout(() => {
      setDisplayCount(prev => prev + 20);
      setIsAutoLoading(false);
      setAutoLoadProgress(0);
    }, AUTO_LOAD_DELAY_MS);
  }, []);

  // Intersection Observer to detect when button is visible
  useEffect(() => {

    if (!hasMoreCampaigns) {
      setIsAutoLoading(false);
      setAutoLoadProgress(0);
      return;
    }

    // Small delay to ensure button is rendered
    const timer = setTimeout(() => {
      if (!loadMoreButtonRef.current) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMoreCampaigns && !isAutoLoading) {
              startAutoLoadTimer();
            }
          });
        },
        { threshold: 0.1 } // Trigger when 10% of the button is visible
      );

      observer.observe(loadMoreButtonRef.current);

      // Cleanup function
      return () => {
        observer.disconnect();
        if (autoLoadTimerRef.current) {
          clearTimeout(autoLoadTimerRef.current);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [hasMoreCampaigns, startAutoLoadTimer, displayCount, isAutoLoading]);


  // Update search query (currently disabled)
  // const handleSearchChange = useCallback((searchQuery: string) => {
  //   setFilters(prev => ({ ...prev, searchQuery }));
  // }, []);


  // Toggle platform filter
  const handlePlatformToggle = useCallback((platform: CampaignPlatform) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  }, []);

  // Visit type filter handler
  const handleVisitTypeToggle = useCallback((visitType: CampaignVisitType | undefined) => {
    setFilters(prev => ({
      ...prev,
      visitType: visitType,
      // 제공형 선택 시 지역 필터 초기화
      regionCode: visitType === 'delivery' ? undefined : prev.regionCode,
      subRegionCode: visitType === 'delivery' ? undefined : prev.subRegionCode,
    }));
  }, []);

  // Region filter handlers
  const handleRegionChange = useCallback((regionCode?: string) => {
    setFilters(prev => ({
      ...prev,
      regionCode,
      subRegionCode: undefined, // 상위 지역 변경시 하위 지역 초기화
    }));
  }, []);

  const handleSubRegionChange = useCallback((subRegionCode?: string) => {
    setFilters(prev => ({
      ...prev,
      subRegionCode,
    }));
  }, []);


  // Handle sort change
  const handleSortChange = useCallback((sortBy: CampaignFilters['sortBy'], sortOrder: CampaignFilters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      platforms: [],
      visitType: undefined,
      regionCode: undefined,
      subRegionCode: undefined,
      sortBy: 'latest',
      sortOrder: 'desc',
    });
  }, []);

  const hasActiveFilters = filters.searchQuery || filters.platforms.length > 0 || filters.visitType || filters.regionCode;

  return (
    <PageLayout favoritesCount={favoriteCampaignsCount}>

      {/* Page Title */}
      <div className="text-center">
        <p className="body-lg text-gray-600 max-w-2xl mx-auto">
          {PAGE_DESCRIPTIONS.campaigns.subtitle}
        </p>
      </div>

      <div className="h-8"></div>

      {/* Search Section */}
      {/* TODO: 페이지네이션과 기본 기능 구현한 뒤에 검색 추가하기 */}
      {/* <SearchBar
        value={filters.searchQuery}
        // TODO: submit 할 때만 검색 결과 조회
        onChange={handleSearchChange}
        onSubmit={handleSearchChange}
      /> */}
      {/* Filters Section */}
      <CampaignFiltersComponent
        filters={filters}
        hasActiveFilters={!!hasActiveFilters}
        onVisitTypeToggle={handleVisitTypeToggle}
        onRegionChange={handleRegionChange}
        onSubRegionChange={handleSubRegionChange}
        onPlatformToggle={handlePlatformToggle}
        onSortChange={handleSortChange}
        onClearAllFilters={clearAllFilters}
      />
      <div className="h-4"></div>

      {/* 캠페인 리스트 중간 광고 - 다이나믹 배너 */}

      <div className='h-2'></div>
      <div className='max-w-6xl mx-auto'>
        <CoupangAdBanner tsource="campaigns_main" />
      </div>

      {/* Height 12 div */}
      <div className="h-12"></div>

      {/* Results Info and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="heading-sm text-gray-900">
            캠페인 목록
          </h2>
          <span className="body-sm text-gray-500">
            {isLoading ? '로딩 중...' : `${displayedCampaigns.length}/${filteredCampaigns.length}개 표시`}
          </span>
        </div>


      </div>


      {/* Loading State */}
      {isLoading ? (
        <CampaignTableSkeleton />
      ) : (
        /* Campaign Display */
        filteredCampaigns.length > 0 ? (
          <div>
            <CompactTableView
              campaigns={displayedCampaigns}
              onFavoriteToggle={toggleCampaignFavorite}
              isFavorited={isCampaignFavorited}
            />

            {/* Load More Button or End Message */}
            <div className="mt-8 text-center">
              {hasMoreCampaigns ? (
                <div className="relative">
                  <button
                    ref={loadMoreButtonRef}
                    onClick={loadMoreCampaigns}
                    className="relative overflow-hidden bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors body-md hover-lift"
                  >
                    {/* Progress bar background */}
                    {isAutoLoading && (
                      <div
                        className="absolute inset-0 bg-primary-800 rounded-lg transition-all duration-100 ease-linear"
                        style={{ width: `${autoLoadProgress}%` }}
                      />
                    )}
                    <span className="relative z-10">
                      더보기 ({filteredCampaigns.length - displayedCampaigns.length}개 남음)
                    </span>
                  </button>
                </div>
              ) : (
                displayedCampaigns.length > 0 && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-gray-600 body-md">
                      모든 캠페인을 확인했습니다
                    </p>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors body-md hover-lift"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      맨 위로
                    </button>
                  </div>
                )
              )}
            </div>

            {/* 리스트 하단 추가 광고 - 정적 배너 */}
            {/* <div className="mt-8">
                <CoupangStaticBanner tsource="campaigns_footer" />
              </div> */}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="heading-sm text-gray-900 mb-2">
              {COMMON_MESSAGES.noResults}
            </h3>
            <p className="body-md text-gray-500 mb-4">
              {COMMON_MESSAGES.noResultsDescription}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors body-md hover-lift"
              >
                {COMMON_MESSAGES.clearAllFilters}
              </button>
            )}
          </div>
        )
      )}
    </PageLayout>
  );
}