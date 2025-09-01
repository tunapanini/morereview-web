'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// import { COMMON_MESSAGES } from '@/lib/constants';

interface HeaderProps {
  favoritesCount?: number;
}

export default function Header({ favoritesCount = 0 }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 하방 스크롤이고 100px 이상 스크롤한 경우 헤더 숨기기
        setIsVisible(false);
      } else {
        // 상방 스크롤 또는 상단 근처인 경우 헤더 보이기
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16 relative">
          {/* Desktop Navigation - Left */}
          <div className="hidden md:flex items-center space-x-8 absolute left-0">
            <Link
              href="/campaigns"
              className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors hover-scale"
              aria-label="전체 캠페인"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>
          </div>

          {/* Logo - Center */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 hover-scale transition-all duration-200 group"
              aria-label="홈으로 이동"
            >
              {/* Logo Icon - Heart in Magnifying Glass */}
              <svg 
                className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-200 group-hover:scale-110" 
                viewBox="0 0 32 32" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>모아리뷰 로고</title>
                {/* Search glass outline */}
                <circle cx="13" cy="13" r="8" stroke="#c084fc" strokeWidth="3" fill="none"/>
                {/* Search handle */}
                <path d="M19.5 19.5L26 26" stroke="#c084fc" strokeWidth="3" strokeLinecap="round"/>
                {/* Heart inside magnifying glass */}
                <path d="M13 17.6L17.2 12.36C17.7 11.86 17.7 10.86 17.2 10.36C16.7 9.86 15.7 9.86 15.2 10.36L13 12.6L10.8 10.36C10.3 9.86 9.3 9.86 8.8 10.36C8.3 10.86 8.3 11.86 8.8 12.36L13 17.6Z" fill="#EC4899"/>
              </svg>
              {/* Brand Name */}
              <div className="flex items-baseline">
                <span className="text-xl sm:text-2xl font-bold text-gray-800 transition-all duration-200 group-hover:text-gray-900">모아</span>
                <span className="text-xl sm:text-2xl font-bold text-primary-600 transition-all duration-200 group-hover:text-primary-700">리뷰</span>
              </div>
            </Link>
          </div>

          {/* Desktop Favorites Counter - Right */}
          <div className="hidden md:flex items-center space-x-2 absolute right-0">
            <Link href="/favorites" className="relative p-2 text-gray-500 hover:text-secondary-500 transition-colors hover-scale">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {favoritesCount > 0 && (
                <span className="absolute top-0 right-0 bg-secondary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center caption">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Navigation Icons - Left & Right */}
          <div className="md:hidden absolute left-0">
            <Link
              href="/campaigns"
              className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors hover-scale"
              aria-label="전체 캠페인"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>
          </div>

          <div className="md:hidden absolute right-0">
            <Link href="/favorites" className="relative p-2 text-gray-500 hover:text-secondary-500 transition-colors hover-scale" aria-label="즐겨찾기">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {favoritesCount > 0 && (
                <span className="absolute top-0 right-0 bg-secondary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center caption">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>
          </div>
        </div>

      </div>
    </header>
  );
}