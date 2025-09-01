'use client';

import { useState, useCallback, useEffect } from 'react';
import { FavoriteState, CampaignPlatform } from '@/types/campaign';
import { storage } from '@/lib/utils';

const FAVORITES_STORAGE_KEY = 'morereview-favorites';

export function useFavorites() {
  const [favoriteState, setFavoriteState] = useState<FavoriteState>({
    campaigns: new Set<string>(),
    filters: {
      platforms: [],
    },
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = storage.get(FAVORITES_STORAGE_KEY, {
      campaigns: [],
      filters: {
        platforms: [],
      },
    });

    setFavoriteState({
      campaigns: new Set(saved.campaigns),
      filters: {
        platforms: saved.filters.platforms || [],
      },
    });
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever favorites change
  const saveFavorites = useCallback((newState: FavoriteState) => {
    const toSave = {
      campaigns: Array.from(newState.campaigns),
      filters: newState.filters,
    };
    storage.set(FAVORITES_STORAGE_KEY, toSave);
  }, []);

  // Toggle campaign favorite
  const toggleCampaignFavorite = useCallback((campaignId: string) => {
    setFavoriteState((prev) => {
      const newCampaigns = new Set(prev.campaigns);
      
      if (newCampaigns.has(campaignId)) {
        newCampaigns.delete(campaignId);
      } else {
        newCampaigns.add(campaignId);
      }

      const newState = {
        ...prev,
        campaigns: newCampaigns,
      };

      saveFavorites(newState);
      return newState;
    });
  }, [saveFavorites]);

  // Check if campaign is favorited
  const isCampaignFavorited = useCallback(
    (campaignId: string) => favoriteState.campaigns.has(campaignId),
    [favoriteState.campaigns]
  );

  // Toggle platform favorite
  const togglePlatformFavorite = useCallback((platform: CampaignPlatform) => {
    setFavoriteState((prev) => {
      const newPlatforms = prev.filters.platforms.includes(platform)
        ? prev.filters.platforms.filter(p => p !== platform)
        : [...prev.filters.platforms, platform];

      const newState = {
        ...prev,
        filters: {
          ...prev.filters,
          platforms: newPlatforms,
        },
      };

      saveFavorites(newState);
      return newState;
    });
  }, [saveFavorites]);

  // Check if platform is favorited
  const isPlatformFavorited = useCallback(
    (platform: CampaignPlatform) => favoriteState.filters.platforms.includes(platform),
    [favoriteState.filters.platforms]
  );

  // Get favorite campaigns count
  const favoriteCampaignsCount = favoriteState.campaigns.size;

  // Get favorite campaigns list
  const favoriteCampaignIds = Array.from(favoriteState.campaigns);

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    const newState: FavoriteState = {
      campaigns: new Set(),
      filters: {
        platforms: [],
      },
    };
    setFavoriteState(newState);
    saveFavorites(newState);
  }, [saveFavorites]);

  return {
    // State
    favoriteState,
    favoriteCampaignsCount,
    favoriteCampaignIds,
    isLoaded,
    
    // Campaign favorites
    toggleCampaignFavorite,
    isCampaignFavorited,
    
    // Filter favorites
    togglePlatformFavorite,
    isPlatformFavorited,
    
    // Utils
    clearAllFavorites,
  };
}