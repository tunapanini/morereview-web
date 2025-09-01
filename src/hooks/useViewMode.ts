'use client';

import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'table';

const VIEW_MODE_STORAGE_KEY = 'morereview-view-mode';
const DEFAULT_VIEW_MODE: ViewMode = 'table';

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load view mode from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY) as ViewMode | null;
      if (saved && saved === 'table') {
        setViewModeState(saved);
      }
    } catch (error) {
      console.warn('Failed to load view mode from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage and update state
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save view mode to localStorage:', error);
    }
  }, []);

  return {
    viewMode,
    setViewMode,
    isLoaded,
  };
}