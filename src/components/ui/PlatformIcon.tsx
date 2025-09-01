import React from 'react';
import { CampaignPlatform } from '@/types/campaign';
import { platformColors } from '@/lib/utils';

interface PlatformIconProps {
    platform: CampaignPlatform;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showTooltip?: boolean;
}

export function PlatformIcon({
    platform,
    size = 'md',
    className = '',
    showTooltip = true
}: PlatformIconProps) {
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const platformConfig = {
        naverblog: {
            icon: (
                <div className={`${sizeClasses[size]} flex items-center justify-center font-bold text-sm`}>
                    B
                </div>
            ),
            label: '네이버블로그',
            color: platformColors.naverblog,
        },
        instagram: {
            icon: (
                <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
            ),
            label: '인스타그램',
            color: platformColors.instagram,
        },
        youtube: {
            icon: (
                <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            ),
            label: '유튜브',
            color: platformColors.youtube,
        },
        tiktok: {
            icon: (
                <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
            ),
            label: '틱톡',
            color: platformColors.tiktok,
        },
        smartstore_review: {
            icon: (
                <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                </svg>
            ),
            label: '스마트스토어 구매평',
            color: platformColors.smartstore_review,
        },
        company_mall_review: {
            icon: (
                <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                </svg>
            ),
            label: '자사몰 구매평',
            color: platformColors.company_mall_review,
        },
        coupang_review: {
            icon: (
                <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
                </svg>
            ),
            label: '쿠팡 구매평',
            color: platformColors.coupang_review,
        },
    };

    const config = platformConfig[platform];
    if (!config) return null;

    return (
        <div
            className={`inline-flex items-center justify-center ${className}`}
            style={{ color: config.color }}
            title={showTooltip ? config.label : undefined}
        >
            {config.icon}
        </div>
    );
}

// Platform list component for displaying multiple platforms
interface PlatformListProps {
    platforms: CampaignPlatform[];
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    maxDisplay?: number;
    showTooltip?: boolean;
}

export function PlatformList({
    platforms,
    size = 'md',
    className = '',
    maxDisplay,
    showTooltip = true
}: PlatformListProps) {
    const displayPlatforms = maxDisplay ? platforms.slice(0, maxDisplay) : platforms;
    const remainingCount = maxDisplay ? platforms.length - maxDisplay : 0;



    return (
        <div className={`flex flex-wrap gap-1 ${className}`}>
            {displayPlatforms.map((platform) => {
                const config = platformColors[platform];
                if (!config) return null;
                return (
                    <div
                        key={platform}
                        className="inline-flex items-center justify-center rounded-md p-2 transition-all hover:opacity-80"
                        style={{ 
                            backgroundColor: `${config}15`,
                            border: `1px solid ${config}30`
                        }}
                    >
                        <PlatformIcon
                            platform={platform}
                            size={size}
                            showTooltip={showTooltip}
                        />
                    </div>
                );
            })}
            {remainingCount > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 rounded-md px-2 py-2 flex items-center">
                    +{remainingCount}
                </span>
            )}
        </div>
    );
}
