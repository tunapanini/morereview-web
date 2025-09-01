'use client';

import Link from 'next/link';
import PageLayout from '@/components/layout/PageLayout';
import AdBannerFallback from '@/components/ui/AdBannerFallback';
import { useFavorites } from '@/hooks/useFavorites';
import { BRAND_INFO, PAGE_DESCRIPTIONS } from '@/lib/constants';

export default function Home() {
  // Favorites hook for header count
  const { favoriteCampaignsCount } = useFavorites();

  return (
    <PageLayout favoritesCount={favoriteCampaignsCount}>
      <div className="h-20"></div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          인플루언서 캠페인을
          <br />
          <span className="text-primary-600">{BRAND_INFO.tagline.replace('인플루언서 캠페인을 ', '')}</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          {PAGE_DESCRIPTIONS.home.hero}
        </p>

        {/* 메인 CTA 버튼 */}
        <div className="mb-8">
          <Link
            href="/campaigns"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-lg shadow-lg hover:bg-primary-700 hover:shadow-xl hover-lift transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-300"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            캠페인 탐색 시작하기
          </Link>
        </div>
      </div>

      <div className="mb-12 justify-center flex">
        <AdBannerFallback
          id="912036"
          template="banner"
          trackingCode="AF9686108"
          width="728"
          height="90"
          fallbackAdSlot="1234567890"
        />
      </div>
      <div className="h-4"></div>
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            흩어져 있는 캠페인 정보를 한 곳에서, 원하는 조건으로만 골라보세요
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">쉬운 검색</h3>
            <p className="text-gray-600">
              원하는 조건의 캠페인을 빠르게 찾아보세요
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">즐겨찾기</h3>
            <p className="text-gray-600">
              관심 있는 캠페인을 저장하고 관리하세요
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">실시간 업데이트</h3>
            <p className="text-gray-600">
              최신 캠페인 정보를 실시간으로 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* 간격 */}
      <div className="h-16"></div>

      {/* CTA 섹션 */}
      <div className="text-center bg-primary-50 rounded-2xl p-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          지금 바로 시작해보세요!
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {PAGE_DESCRIPTIONS.home.cta}
        </p>
        <Link
          href="/campaigns"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-lg shadow-lg hover:bg-primary-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-300"
        >
          캠페인 둘러보기
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      {/* 간격 */}
      <div className="h-16"></div>

      {/* <div className="mb-12">
        <CoupangStaticBanner tsource="home_footer" />
      </div> */}

      {/* 간격 */}
      <div className="h-16"></div>

    </PageLayout>
  );
}
