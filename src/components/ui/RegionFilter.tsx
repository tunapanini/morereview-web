'use client';

import { useState, useEffect } from 'react';
import { Region, SubRegion } from '@/lib/regions';

interface RegionFilterProps {
  selectedRegion?: string;
  selectedSubRegion?: string;
  onRegionChange: (regionCode?: string) => void;
  onSubRegionChange: (subRegionCode?: string) => void;
}

export default function RegionFilter({
  selectedRegion,
  selectedSubRegion,
  onRegionChange,
  onSubRegionChange,
}: RegionFilterProps) {
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isSubRegionOpen, setIsSubRegionOpen] = useState(false);

  // DB 데이터 상태
  const [regions, setRegions] = useState<Region[]>([]);
  const [allSubRegions, setAllSubRegions] = useState<Record<string, SubRegion[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubRegionLoading, setIsSubRegionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 선택된 상위 지역의 하위 지역들
  const subRegions = selectedRegion ? (allSubRegions[selectedRegion] || []) : [];

  // API에서 지역 데이터 로딩 (캐싱 포함)
  useEffect(() => {
    async function loadRegions() {
      // 캐시 확인
      const cacheKey = 'regions_data';
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24시간
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > cacheExpiry;

          if (!isExpired && data.regions && data.subRegions) {
            setRegions(data.regions);
            setAllSubRegions(data.subRegions);
            return; // 캐시 데이터 사용
          }
        } catch {
          // 캐시 파싱 실패 시 새로 로드
        }
      }

      // 새로 데이터 로드
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/regions');
        if (!response.ok) {
          throw new Error('Failed to fetch regions');
        }
        const regionsWithSub = await response.json();

        // 데이터 구조 변환
        const regionsList: Region[] = regionsWithSub.map((r: any) => ({
          code: r.code,
          name: r.name
        }));

        const subRegionMap: Record<string, SubRegion[]> = {};
        regionsWithSub.forEach((r: any) => {
          if (r.subRegions) {
            subRegionMap[r.code] = r.subRegions;
          }
        });

        setRegions(regionsList);
        setAllSubRegions(subRegionMap);

        // 캐시 저장
        localStorage.setItem(cacheKey, JSON.stringify({
          data: { regions: regionsList, subRegions: subRegionMap },
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to load regions:', err);
        setError('지역 데이터를 불러오는데 실패했습니다.');
        setRegions([]);
        setAllSubRegions({});
      } finally {
        setIsLoading(false);
      }
    }

    loadRegions();
  }, []);

  // 선택된 지역이 변경되면 로딩 상태 표시 (실제 데이터는 이미 로드됨)
  useEffect(() => {
    if (selectedRegion && subRegions.length === 0 && !allSubRegions[selectedRegion]) {
      // 데이터가 아직 없으면 잠시 로딩 표시
      setIsSubRegionLoading(true);
      setTimeout(() => setIsSubRegionLoading(false), 100);
    }
  }, [selectedRegion, subRegions.length, allSubRegions]);

  const handleRegionSelect = (regionCode?: string) => {
    onRegionChange(regionCode);
    onSubRegionChange(undefined); // 상위 지역 변경시 하위 지역 초기화
    setIsRegionOpen(false);
  };

  const handleSubRegionSelect = (subRegionCode?: string) => {
    onSubRegionChange(subRegionCode);
    setIsSubRegionOpen(false);
  };

  const selectedRegionData = regions.find(r => r.code === selectedRegion);
  const selectedSubRegionData = subRegions.find(sr => sr.code === selectedSubRegion);

  // 하위 지역명에서 상위 지역명 중복 제거
  const formatSubRegionName = (subRegion: SubRegion) => {
    const parentRegion = regions.find(r => r.code === selectedRegion);
    if (parentRegion && subRegion.name.startsWith(parentRegion.name)) {
      // "경기도 성남시" -> "성남시"
      return subRegion.name.replace(parentRegion.name, '').trim();
    }
    return subRegion.name;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* 상위 지역 선택 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsRegionOpen(!isRegionOpen)}
          className="inline-flex items-center justify-between w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          disabled={isLoading}
        >
          <span>
            {selectedRegionData?.name || '전체'}
          </span>
          <svg
            className={`ml-2 h-4 w-4 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isRegionOpen && !isLoading && (
          <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="py-1">
              {error && (
                <div className="px-4 py-2 text-xs text-red-600 bg-red-50">
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRegionSelect(undefined)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                전체
              </button>
              {regions.map((region) => (
                <button
                  key={region.code}
                  type="button"
                  onClick={() => handleRegionSelect(region.code)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedRegion === region.code ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                    }`}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하위 지역 선택 */}
      {selectedRegion && (subRegions.length > 0 || isSubRegionLoading) && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSubRegionOpen(!isSubRegionOpen)}
            className="inline-flex items-center justify-between w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            disabled={isSubRegionLoading}
          >
            <span>
              {isSubRegionLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로딩 중...
                </span>
              ) : (
                selectedSubRegionData ? formatSubRegionName(selectedSubRegionData) : '전체'
              )}
            </span>
            <svg
              className={`ml-2 h-4 w-4 transition-transform ${isSubRegionOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isSubRegionOpen && (
            <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="py-1">
                {subRegions.map((subRegion) => (
                  <button
                    key={subRegion.code}
                    type="button"
                    onClick={() => handleSubRegionSelect(subRegion.code)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedSubRegion === subRegion.code ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                      }`}
                  >
                    {formatSubRegionName(subRegion)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}