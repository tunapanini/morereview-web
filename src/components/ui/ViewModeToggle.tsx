'use client';

import { ViewMode } from '@/hooks/useViewMode';

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

export default function ViewModeToggle({
  currentMode,
  onModeChange,
  className = ''
}: ViewModeToggleProps) {
  const modes = [
    {
      id: 'table' as ViewMode,
      label: '테이블',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6m6 0v10a2 2 0 01-2 2H9m8-12a2 2 0 012 2v8a2 2 0 01-2 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`flex items-center bg-white border border-gray-200 rounded-lg p-1 ${className}`}>
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${currentMode === mode.id
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          title={`${mode.label} 보기로 전환`}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}