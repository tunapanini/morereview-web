import React from 'react';
import { FilterSection, PlatformFilterChip } from '@/components/ui/FilterChip';
import RegionFilter from '@/components/ui/RegionFilter';
import SortDropdown from '@/components/ui/SortDropdown';
import { CampaignFilters, CampaignPlatform } from '@/types/campaign';

interface CampaignFiltersProps {
    filters: CampaignFilters;
    hasActiveFilters: boolean;
    onVisitTypeToggle: (type: 'visit' | 'delivery' | undefined) => void;
    onRegionChange: (regionCode: string | undefined) => void;
    onSubRegionChange: (subRegionCode: string | undefined) => void;
    onPlatformToggle: (platform: CampaignPlatform) => void;
    onSortChange: (sortBy: 'latest' | 'deadline', sortOrder: 'asc' | 'desc') => void;
    onClearAllFilters: () => void;
}

const CampaignFiltersComponent: React.FC<CampaignFiltersProps> = ({
    filters,
    hasActiveFilters,
    onVisitTypeToggle,
    onRegionChange,
    onSubRegionChange,
    onPlatformToggle,
    onSortChange,
    onClearAllFilters,
}) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left side - Filters */}
                <div className="flex-1 space-y-4">
                    <FilterSection title="캠페인 유형">
                        <button
                            onClick={() => onVisitTypeToggle(undefined)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.visitType === undefined
                                    ? 'bg-primary-200 text-primary-800 border border-primary-300'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                }`}
                        >
                            전체
                        </button>
                        <button
                            onClick={() => onVisitTypeToggle('visit')}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.visitType === 'visit'
                                ? 'bg-primary-200 text-primary-800 border border-primary-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11 -6 0 3 3 0 016 0z" />
                            </svg>
                            방문형
                        </button>
                        <button
                            onClick={() => onVisitTypeToggle('delivery')}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.visitType === 'delivery'
                                ? 'bg-primary-200 text-primary-800 border border-primary-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            제공형
                        </button>
                    </FilterSection>

                    {/* 지역 필터는 방문형일 때만 표시 */}
                    {filters.visitType !== 'delivery' && (
                        <FilterSection title="지역">
                            <RegionFilter
                                selectedRegion={filters.regionCode}
                                selectedSubRegion={filters.subRegionCode}
                                onRegionChange={onRegionChange}
                                onSubRegionChange={onSubRegionChange}
                            />
                        </FilterSection>
                    )}

                    <FilterSection title="플랫폼">
                        <PlatformFilterChip
                            platform="naverblog"
                            isActive={filters.platforms.includes('naverblog')}
                            onClick={() => onPlatformToggle('naverblog')}
                        />
                        <PlatformFilterChip
                            platform="instagram"
                            isActive={filters.platforms.includes('instagram')}
                            onClick={() => onPlatformToggle('instagram')}
                        />
                        <PlatformFilterChip
                            platform="youtube"
                            isActive={filters.platforms.includes('youtube')}
                            onClick={() => onPlatformToggle('youtube')}
                        />
                        <PlatformFilterChip
                            platform="tiktok"
                            isActive={filters.platforms.includes('tiktok')}
                            onClick={() => onPlatformToggle('tiktok')}
                        />
                        <PlatformFilterChip
                            platform="smartstore_review"
                            isActive={filters.platforms.includes('smartstore_review')}
                            onClick={() => onPlatformToggle('smartstore_review')}
                        />
                        <PlatformFilterChip
                            platform="company_mall_review"
                            isActive={filters.platforms.includes('company_mall_review')}
                            onClick={() => onPlatformToggle('company_mall_review')}
                        />
                        <PlatformFilterChip
                            platform="coupang_review"
                            isActive={filters.platforms.includes('coupang_review')}
                            onClick={() => onPlatformToggle('coupang_review')}
                        />
                    </FilterSection>
                </div>

                {/* Right side - Sort & Clear */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <SortDropdown
                        sortBy={filters.sortBy}
                        sortOrder={filters.sortOrder}
                        onSortChange={onSortChange}
                    />

                    {hasActiveFilters && (
                        <button
                            onClick={onClearAllFilters}
                            className="px-4 py-2 body-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            필터 초기화
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignFiltersComponent;
