'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * 쿠팡 이벤트 배너 컴포넌트
 * - 2025년 8월 이벤트 배너
 * - 행사기간: ~ 2025. 08. 31.
 */
export default function CoupangEventBanner() {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    // 이미지 로드 실패 시 대체 콘텐츠
    if (imageError) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mx-auto p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 text-sm mb-4">이벤트 배너를 불러올 수 없습니다</p>
                    <a
                        href="https://link.coupang.com/a/cMXeZy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                        </svg>
                        쿠팡 이벤트 보러가기~~
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mx-auto">
            <a
                href="https://link.coupang.com/a/cMXeZy"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-90 transition-opacity duration-200"
            >
                <div className="relative">
                    <Image
                        src="https://static.coupangcdn.com/image/affiliate/event/promotion/2025/08/26/700720f3b37a0099019e08073dce100d.png"
                        alt="쿠팡 이벤트 배너 - 행사기간: ~ 2025. 08. 31."
                        width={800}
                        height={800}
                        onError={handleImageError}
                        priority
                    />

                    {/* 이벤트 기간 표시 오버레이 */}
                    <div className="absolute top-2 right-2 bg-gray-600 bg-opacity-30 text-white text-xs px-2 py-1 rounded">
                        행사기간: ~ 2025. 08. 31.
                    </div>
                </div>
            </a>
        </div>
    );
}