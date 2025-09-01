'use client';

import { useState, useRef, useEffect } from 'react';
import { CampaignFilters } from '@/types/campaign';
import { sortLabels } from '@/lib/labels';

interface SortOption {
  value: CampaignFilters['sortBy'];
  label: string;
  icon: React.ReactNode;
}

interface SortDropdownProps {
  sortBy: CampaignFilters['sortBy'];
  sortOrder: CampaignFilters['sortOrder'];
  onSortChange: (sortBy: CampaignFilters['sortBy'], sortOrder: CampaignFilters['sortOrder']) => void;
  className?: string;
}

const sortOptions: SortOption[] = [
  {
    value: 'latest',
    label: sortLabels.latest,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: 'deadline',
    label: sortLabels.deadline,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3l1.5 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function SortDropdown({
  sortBy,
  onSortChange,
  className = '',
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSortOptionClick = (option: SortOption) => {
    // 정렬 기준에 따른 적절한 순서 설정
    const sortOrder = option.value === 'deadline' ? 'asc' : 'desc'; // 마감 임박순은 오름차순, 최신순은 내림차순
    onSortChange(option.value, sortOrder);
    setIsOpen(false);
  };

  // Arrow icon removed - sort order info is already included in the sort option names

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Sort Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 
          bg-white border border-gray-300 rounded-lg 
          body-sm font-medium text-gray-700
          hover:border-gray-400 hover:bg-gray-50
          transition-all duration-200
          ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <span className="text-gray-500">{currentOption.icon}</span>
        <span>{currentOption.label}</span>

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-10 md:hidden" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="caption text-gray-500 font-medium">정렬 기준</p>
            </div>

            {sortOptions.map((option) => {
              const isActive = option.value === sortBy;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSortOptionClick(option)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2
                    body-sm text-left
                    hover:bg-gray-50 transition-colors
                    ${isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-700'}
                  `}
                  role="option"
                  aria-selected={isActive}
                >
                  <div className="flex items-center gap-2">
                    <span className={isActive ? 'text-primary-500' : 'text-gray-400'}>
                      {option.icon}
                    </span>
                    <span>{option.label}</span>
                  </div>
                </button>
              );
            })}


          </div>
        </>
      )}
    </div>
  );
}