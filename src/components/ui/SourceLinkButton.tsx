'use client';

import { Campaign } from '@/types/campaign';

interface SourceLinkButtonProps {
  campaign: Campaign;
  className?: string;
}

export default function SourceLinkButton({ campaign, className = '' }: SourceLinkButtonProps) {
  const handleSourceLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (campaign.sourceUrl) {
      window.open(campaign.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.error('Source URL is not available for this campaign');
    }
  };

  return (
    <button
      onClick={handleSourceLinkClick}
      className={`p-2 rounded-full transition-all duration-200 hover:scale-110 text-gray-400 hover:text-blue-500 hover:bg-gray-50 ${className}`}
      aria-label="새 탭에서 소스 페이지 열기"
      title="새 탭에서 소스 페이지 열기"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </button>
  );
}
