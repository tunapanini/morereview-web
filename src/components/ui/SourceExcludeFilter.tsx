'use client';

import { useState } from 'react';
import { CampaignSource } from '@/types/campaign';
import { sourceLabels } from '@/lib/labels';

interface SourceExcludeFilterProps {
  excludedSources: CampaignSource[];
  onSourceToggle: (source: CampaignSource) => void;
  campaignCounts?: Record<CampaignSource, number>;
}

export default function SourceExcludeFilter({
  excludedSources,
  onSourceToggle,
  campaignCounts
}: SourceExcludeFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const allSources = Object.keys(sourceLabels) as CampaignSource[];
  const visibleSources = isExpanded ? allSources : allSources.slice(0, 6);
  const hasMore = allSources.length > 6;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          캠페인 소스 제외
        </h3>
        <div className="text-xs text-gray-500">
          {excludedSources.length}개 제외됨
        </div>
      </div>

      <div className="space-y-3">
        {visibleSources.map((source) => {
          const isExcluded = excludedSources.includes(source);
          const count = campaignCounts?.[source] || 0;
          
          return (
            <label
              key={source}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                isExcluded 
                  ? 'bg-red-50 border border-red-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isExcluded}
                  onChange={() => onSourceToggle(source)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${
                    isExcluded ? 'text-red-700 line-through' : 'text-gray-900'
                  }`}>
                    {sourceLabels[source]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {source}
                  </span>
                </div>
              </div>
              
              {count > 0 && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isExcluded 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </div>
              )}
            </label>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              접기
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {allSources.length - 6}개 더 보기
            </>
          )}
        </button>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => {
            // 모두 제외
            allSources.forEach(source => {
              if (!excludedSources.includes(source)) {
                onSourceToggle(source);
              }
            });
          }}
          className="flex-1 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
        >
          모두 제외
        </button>
        <button
          onClick={() => {
            // 모두 포함
            excludedSources.forEach(source => {
              onSourceToggle(source);
            });
          }}
          className="flex-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          모두 포함
        </button>
      </div>
    </div>
  );
}