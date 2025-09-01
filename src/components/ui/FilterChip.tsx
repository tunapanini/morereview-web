'use client';

import React from 'react';
import { CampaignPlatform } from '@/types/campaign';
import { platformLabels } from '@/lib/labels';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  count?: number;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'category' | 'platform';
  size?: 'sm' | 'md';
}

export default function FilterChip({
  label,
  isActive,
  count,
  onClick,
  icon,
  variant = 'default',
  size = 'md',
}: FilterChipProps) {
  const baseClasses = 'inline-flex items-center gap-2 border rounded-full font-medium transition-all duration-200 hover-scale';

  const sizeClasses = {
    sm: 'px-3 py-1 caption',
    md: 'px-4 py-2 body-sm',
  };

  const variantClasses = {
    default: isActive
      ? 'bg-primary-600 text-white border-primary-600 shadow-md'
      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
    category: isActive
      ? 'bg-secondary-500 text-white border-secondary-500 shadow-md'
      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
    platform: isActive
      ? 'bg-primary-700 text-white border-primary-700 shadow-md'
      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} group`}
      aria-pressed={isActive}
      type="button"
    >
      {icon && (
        <span className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-600'}`}>
          {icon}
        </span>
      )}

      <span>{label}</span>

      {count !== undefined && count > 0 && (
        <span className={`
          ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold transition-colors duration-200
          ${isActive
            ? 'bg-white/20 text-white'
            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
          }
        `}>
          {count > 999 ? '999+' : count}
        </span>
      )}
    </button>
  );
}

// Filter section component for organized display
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterSection({ title, children, className = '' }: FilterSectionProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="body-sm font-medium text-gray-700">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

// Category filter chips with icons
export function CategoryFilterChip({
  category,
  isActive,
  count,
  onClick
}: {
  category: 'all' | 'beauty' | 'health' | 'fashion';
  isActive: boolean;
  count?: number;
  onClick: () => void;
}) {
  const categoryConfig = {
    all: {
      label: '전체',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    beauty: {
      label: '뷰티',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
        </svg>
      ),
    },
    health: {
      label: '건강식품',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    fashion: {
      label: '패션',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  };

  const config = categoryConfig[category];

  if (!config) {
    console.error('Unknown category:', category);
    return null;
  }

  return (
    <FilterChip
      label={config.label}
      isActive={isActive}
      count={count}
      onClick={onClick}
      icon={config.icon}
      variant="category"
    />
  );
}

// Platform filter chips with platform icons
export function PlatformFilterChip({
  platform,
  isActive,
  count,
  onClick
}: {
  platform: CampaignPlatform;
  isActive: boolean;
  count?: number;
  onClick: () => void;
}) {
  const platformConfig: Record<CampaignPlatform, { label: string; icon: React.ReactNode }> = {
    naverblog: {
      label: platformLabels.naverblog,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      ),
    },
    instagram: {
      label: platformLabels.instagram,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.40z" />
        </svg>
      ),
    },
    youtube: {
      label: platformLabels.youtube,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    tiktok: {
      label: platformLabels.tiktok,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
    smartstore_review: {
      label: platformLabels.smartstore_review,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
        </svg>
      ),
    },
    company_mall_review: {
      label: platformLabels.company_mall_review,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
        </svg>
      ),
    },
    coupang_review: {
      label: platformLabels.coupang_review,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
        </svg>
      ),
    },
  };

  const config = platformConfig[platform];
  if (!config) {
    console.error('Unknown platform:', platform);
    return null;
  }

  return (
    <FilterChip
      label={config.label}
      isActive={isActive}
      count={count}
      onClick={onClick}
      icon={config.icon}
      variant="platform"
      size="sm"
    />
  );
}