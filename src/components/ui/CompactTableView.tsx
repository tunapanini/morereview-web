'use client';

import { Campaign } from '@/types/campaign';
import { tableLabels } from '@/lib/labels';
import { formatCurrency, formatDate } from '@/lib/utils';
import SourceLabel from './SourceLabel';
import FavoriteButton from './FavoriteButton';
import { PlatformList } from './PlatformIcon';
import DeadlineBadge from './DeadlineBadge';

interface CompactTableViewProps {
  campaigns: Campaign[];
  onFavoriteToggle: (campaignId: string) => void;
  isFavorited: (campaignId: string) => boolean;
}

export default function CompactTableView({
  campaigns,
  onFavoriteToggle,
  isFavorited,
}: CompactTableViewProps) {

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
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
          검색 결과가 없습니다
        </h3>
        <p className="body-md text-gray-500">
          다른 키워드로 검색하거나 필터를 조정해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-4 hidden sm:block">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
            <div className="col-span-1 text-center">{tableLabels.headers.action}</div>
            <div className="col-span-5">{tableLabels.headers.campaignInfo}</div>
            <div className="col-span-2">{tableLabels.headers.platform}</div>
            <div className="col-span-2">{tableLabels.headers.reward}</div>
            <div className="col-span-2">{tableLabels.headers.endDate}</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {campaigns.map((campaign) => {

            return (
              <div
                key={campaign.id}
                className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                {/* Action Buttons */}
                <div className="col-span-1 flex items-center justify-center">
                  {/* Favorite Button */}
                  <FavoriteButton
                    isFavorited={isFavorited(campaign.id)}
                    onToggle={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onFavoriteToggle(campaign.id);
                    }}
                    size="sm"
                  />
                </div>

                {/* Campaign Info */}
                <div className="col-span-8 sm:col-span-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Category, Source and Platforms */}
                      <div className="flex items-center gap-1 sm:gap-2 mb-2 flex-wrap">
                        <SourceLabel source={campaign.source} className="text-xs" />

                        {/* Location for visit type */}
                        {campaign.visitType === 'visit' && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11 -6 0 3 3 0 6 16 0z" />
                            </svg>
                            {campaign.location || ''}
                          </span>
                        )}

                        {/* Mobile: Show platforms inline */}
                        <div className="sm:hidden">
                          <PlatformList
                            platforms={campaign.platforms}
                            size="sm"
                            showTooltip={true}
                          />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold line-clamp-2 mb-2 leading-tight">
                        {campaign.sourceUrl ? (
                          <a
                            href={campaign.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 hover:text-primary-600 visited:text-gray-500 visited:underline transition-colors cursor-pointer clickable"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {campaign.title}
                          </a>
                        ) : (
                          <span className="text-gray-900">{campaign.title}</span>
                        )}
                      </h3>

                      {/* Mobile: Show end date */}
                      <div className="sm:hidden mb-2">
                        <span className="text-xs font-medium text-gray-900">
                          {formatDate(campaign.endDate)}
                        </span>
                        <DeadlineBadge 
                          endDate={campaign.endDate} 
                          className="ml-1" 
                          showParens={true}
                        />
                      </div>

                    </div>
                  </div>
                </div>

                {/* Platforms (Desktop only) */}
                <div className="col-span-2 hidden sm:flex items-center">
                  <PlatformList
                    platforms={campaign.platforms}
                    size="md"
                    showTooltip={true}
                  />
                </div>

                {/* Reward */}
                <div className="col-span-3 sm:col-span-2 flex flex-col items-end justify-center">
                  {campaign.reward > 0 ? (
                    <>
                      <span className="text-base sm:text-lg font-bold text-primary-600">
                        {formatCurrency(campaign.reward)}P
                      </span>
                      {campaign.description && (
                        <span className="text-xs text-gray-500 text-right mt-1">
                          {campaign.description}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-gray-700 text-right">
                      {campaign.description || '제공내역 확인'}
                    </span>
                  )}
                </div>

                {/* End Date (Desktop only) */}
                <div className="col-span-2 hidden sm:flex items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(campaign.endDate)}
                    </span>
                    <DeadlineBadge 
                      endDate={campaign.endDate}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}