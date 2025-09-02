'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/layout/PageLayout';
import SearchBar from '@/components/ui/SearchBar';
import { PlatformFilterChip, FilterSection } from '@/components/ui/FilterChip';
import SortDropdown from '@/components/ui/SortDropdown';
import CompactTableView from '@/components/ui/CompactTableView';
import { loadRealCampaignData } from '@/lib/campaignDataTransformer';
import { filterCampaigns } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { Campaign, CampaignFilters, CampaignPlatform } from '@/types/campaign';
import CoupangEventBanner from '@/components/ui/CoupangEventBanner';
// import { COMMON_MESSAGES } from '@/lib/constants';

export default function FavoritesPage() {
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

  // Favorites hook
  const {
    favoriteCampaignsCount,
    favoriteCampaignIds,
    toggleCampaignFavorite,
    isCampaignFavorited,
    clearAllFavorites,
  } = useFavorites();

  // Get favorite campaigns
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    loadRealCampaignData().then(result => {
      setAllCampaigns(result.campaigns);
    });
  }, []);

  const favoriteCampaigns = useMemo(() => {
    return allCampaigns.filter(campaign => favoriteCampaignIds.includes(campaign.id));
  }, [allCampaigns, favoriteCampaignIds]);

  // Filter and sort favorite campaigns
  const filteredAndSortedCampaigns = useMemo(() => {
    const filtered = filterCampaigns(favoriteCampaigns, filters);
    // 즐겨찾기는 클라이언트에서 간단 정렬 (데이터양 적음)
    return filtered.sort((a, b) => {
      if (filters.sortBy === 'latest') {
        return b.createdDate.getTime() - a.createdDate.getTime();
      } else {
        return a.endDate.getTime() - b.endDate.getTime();
      }
    });
  }, [favoriteCampaigns, filters]);

  // Update search query
  const handleSearchChange = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, []);


  // Toggle platform filter
  const handlePlatformToggle = useCallback((platform: CampaignPlatform) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
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
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="heading-lg text-gray-900 mb-4">
          즐겨찾기 캠페인
        </h1>
        <p className="body-lg text-gray-600 max-w-2xl mx-auto">
          관심있는 캠페인들을 모아서 한번에 확인하고 관리하세요
        </p>
      </div>

      {favoriteCampaignsCount === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="max-w-sm mx-auto">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="heading-md text-gray-900 mb-3">
              아직 즐겨찾기한 캠페인이 없어요
            </h3>
            <p className="body-md text-gray-500 mb-6">
              관심있는 캠페인의 하트 버튼을 클릭하여<br />
              즐겨찾기에 추가해보세요
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors body-md font-medium hover-lift"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              캠페인 둘러보기
            </Link>
            <div className='h-2'></div>
            <div className='max-w-2xl mx-auto'>
              <CoupangEventBanner />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search Section */}
          <div className="mb-6">
            <SearchBar
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="즐겨찾기한 캠페인에서 검색..."
            />
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left side - Filters */}
              <div className="flex-1 space-y-4">
                <FilterSection title="플랫폼">
                  <PlatformFilterChip
                    platform="naverblog"
                    isActive={filters.platforms.includes('naverblog')}
                    onClick={() => handlePlatformToggle('naverblog')}
                  />
                  <PlatformFilterChip
                    platform="instagram"
                    isActive={filters.platforms.includes('instagram')}
                    onClick={() => handlePlatformToggle('instagram')}
                  />
                  <PlatformFilterChip
                    platform="youtube"
                    isActive={filters.platforms.includes('youtube')}
                    onClick={() => handlePlatformToggle('youtube')}
                  />
                  <PlatformFilterChip
                    platform="tiktok"
                    isActive={filters.platforms.includes('tiktok')}
                    onClick={() => handlePlatformToggle('tiktok')}
                  />
                </FilterSection>
              </div>

              {/* Right side - Sort & Clear */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <SortDropdown
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  onSortChange={handleSortChange}
                />

                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 body-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    필터 초기화
                  </button>
                )}

                <button
                  onClick={clearAllFavorites}
                  className="px-4 py-2 body-sm text-error border border-error rounded-lg hover:bg-red-50 transition-colors"
                >
                  모두 삭제
                </button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="heading-sm text-gray-900">
                즐겨찾기 목록
              </h2>
              <span className="body-sm text-gray-500">
                총 {filteredAndSortedCampaigns.length}개 (전체 {favoriteCampaignsCount}개 중)
              </span>
            </div>

            {/* Back to all campaigns */}
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 body-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              전체 캠페인 보기
            </Link>
          </div>

          {/* Campaign Table */}
          {filteredAndSortedCampaigns.length > 0 ? (
            <CompactTableView
              campaigns={filteredAndSortedCampaigns}
              isFavorited={isCampaignFavorited}
              onFavoriteToggle={toggleCampaignFavorite}
            />
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
                필터 조건에 맞는 캠페인이 없습니다
              </h3>
              <p className="body-md text-gray-500 mb-4">
                다른 키워드로 검색하거나 필터를 조정해보세요
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors body-md hover-lift"
                >
                  모든 필터 제거
                </button>
              )}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}