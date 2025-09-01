'use client';

import { useState, useEffect } from 'react';
import { logCoupangError } from '@/lib/utils';

interface CoupangAdBannerProps {
    tsource?: string;
}

/**
 * 쿠팡 메인 배너 컴포넌트
 * - 고객 관심 기반 추천 / 다이나믹 Carousel
 * https://partners.coupang.com/#affiliate/ws/dynamic-widget/912039
 * @param tsource - 광고 소스 태그
 */
export default function CoupangAdBanner({ tsource = '' }: CoupangAdBannerProps) {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [iframeError, setIframeError] = useState(false);
    const [isAdBlocked, setIsAdBlocked] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // iframe src를 클라이언트에서 완성
    const iframeSrc = `https://ads-partners.coupang.com/widgets.html?id=912039&template=carousel&trackingCode=AF9686108&subId=morereview&width=1216&height=140&tsource=${encodeURIComponent(tsource)}`;

    useEffect(() => {
        // 광고 차단 감지
        const checkAdBlock = () => {
            const testAd = document.createElement('div');
            testAd.innerHTML = '&nbsp;';
            testAd.className = 'adsbox';
            document.body.appendChild(testAd);

            setTimeout(() => {
                const isBlocked = testAd.offsetHeight === 0 ||
                    testAd.style.display === 'none' ||
                    testAd.style.visibility === 'hidden';
                setIsAdBlocked(isBlocked);
                document.body.removeChild(testAd);
            }, 100);
        };

        checkAdBlock();
    }, []);

    const handleIframeLoad = () => {
        setIframeLoaded(true);
        setIframeError(false);
        setRetryCount(0);
        // iframe loaded successfully
    };

    const handleIframeError = () => {
        logCoupangError('AdBanner', 'Direct iframe failed', {
            src: iframeSrc,
            tsource,
            retryCount,
            isProduction: process.env.NODE_ENV === 'production'
        });

        // iframe 실패 시 에러 상태로 설정
        console.warn('[CoupangAdBanner] Direct iframe failed');
        setIframeError(true);
        setIframeLoaded(false);
    };

    // iframe이 차단되었거나 에러가 발생한 경우 대체 콘텐츠 표시
    if (isAdBlocked || iframeError) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm min-h-[140px] p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 text-sm mb-4">광고를 불러올 수 없습니다</p>
                    <a
                        href="https://link.coupang.com/a/cMXerJ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                        </svg>
                        쿠팡 쇼핑하러 가기
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm min-h-[140px]">
            {!iframeLoaded && (
                <div className="w-full h-[140px] bg-gray-100 rounded p-4 animate-pulse">
                    <div className="flex gap-3 h-full">
                        <div className="w-[140px] h-[140px] bg-gray-300 rounded"></div>
                        <div className="w-[140px] h-[140px] bg-gray-300 rounded"></div>
                        <div className="w-[140px] h-[140px] bg-gray-300 rounded"></div>
                        <div className="w-[140px] h-[140px] bg-gray-300 rounded"></div>
                        <div className="w-[140px] h-[140px] bg-gray-300 rounded"></div>
                        <div className="flex-1 h-[140px] bg-gray-300 rounded"></div>
                    </div>
                </div>
            )}

            <iframe
                key={retryCount} // 재시도시 새로운 iframe 생성
                src={`${iframeSrc}${retryCount > 0 ? `&retry=${retryCount}` : ''}`}
                width="1216"
                height="140"
                referrerPolicy="unsafe-url"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="payment; clipboard-write"
                className={`w-full h-[140px] ${iframeLoaded ? 'block' : 'hidden'}`}
                style={{
                    border: 'none',
                    overflow: 'hidden'
                }}
                title="쿠팡 파트너스 광고"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
            />
        </div>
    );
}

