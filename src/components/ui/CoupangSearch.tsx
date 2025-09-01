'use client';

import React, { useState, useEffect } from 'react';
import { logCoupangError } from '@/lib/utils';

const CoupangSearch: React.FC = () => {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [iframeError, setIframeError] = useState(false);
    const [isAdBlocked, setIsAdBlocked] = useState(false);
    const [loadAttempts, setLoadAttempts] = useState(0);
    const [retryCount, setRetryCount] = useState(0);

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
    };

    const handleIframeError = () => {
        const currentAttempt = loadAttempts + 1;
        setLoadAttempts(currentAttempt);

        logCoupangError('Search', 'Direct iframe failed', {
            src: 'https://coupa.ng/cjEpCR',
            attempt: currentAttempt,
            retryCount,
            isProduction: process.env.NODE_ENV === 'production',
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
        });

        // iframe 실패 시 에러 상태로 설정
        console.warn('[CoupangSearch] Direct iframe failed');
        setIframeError(true);
        setIframeLoaded(false);
    };

    // iframe이 차단되었거나 에러가 발생한 경우 대체 콘텐츠 표시
    if (isAdBlocked || iframeError) {
        return (
            <div className="p-4 border-b border-gray-100">
                <div className="flex justify-center">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-[600px] w-full">
                        <div className="text-center text-gray-600 mb-4">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">상품 검색</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                쿠팡에서 원하는 상품을 검색해보세요
                            </p>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
                                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-gray-500 text-sm">검색 기능을 사용할 수 없습니다</span>
                            </div>
                        </div>

                        <a
                            href="https://coupa.ng/cjEpCR"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            쿠팡에서 검색하기
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border-b border-gray-100">
            <div className="flex justify-center">
                {!iframeLoaded && (
                    <div className="w-full max-w-[600px] h-[75px] bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">검색 기능 로딩 중...</p>
                        </div>
                    </div>
                )}

                <iframe
                    key={retryCount} // 재시도시 새로운 iframe 생성
                    src={`https://coupa.ng/cjEzQQ${retryCount > 0 ? `?retry=${retryCount}` : ''}`}
                    width="100%"
                    height="75"
                    referrerPolicy="unsafe-url"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    allow="payment; clipboard-write"
                    style={{
                        maxWidth: '600px',
                        display: iframeLoaded ? 'block' : 'none',
                        border: 'none',
                        overflow: 'hidden'
                    }}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    title="쿠팡 검색"
                />
            </div>
        </div>
    );
};

export default CoupangSearch;


