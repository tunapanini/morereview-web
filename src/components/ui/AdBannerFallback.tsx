'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerFallbackProps {
  id: string;
  template?: string;
  trackingCode?: string;
  width?: string;
  height?: string;
  fallbackAdSlot?: string;
}

declare global {
  interface Window {
    PartnersCoupang?: {
      G: new (config: {
        id: number;
        template: string;
        trackingCode: string;
        width: string;
        height: string;
      }) => void;
    };
    adsbygoogle?: any[];
  }
}

export default function AdBannerFallback({
  id = '912199',
  template = 'banner',
  trackingCode = 'AF9686108',
  width = '728',
  height = '90',
  fallbackAdSlot
}: AdBannerFallbackProps) {
  const [adStatus, setAdStatus] = useState<'loading' | 'coupang' | 'google' | 'error'>('loading');
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // 개발 환경에서는 광고 로딩을 건너뜁니다
    if (process.env.NODE_ENV === 'development') {
      setAdStatus('error'); // 에러 상태로 설정하여 광고를 숨김
      return;
    }

    const loadCoupangAd = () => {
      return new Promise<void>((resolve, reject) => {
        // 쿠팡 스크립트 로드
        const script = document.createElement('script');
        script.src = 'https://ads-partners.coupang.com/g.js';
        script.async = true;

        script.onload = () => {
          try {
            // 타임아웃으로 실패 케이스 처리
            const timeout = setTimeout(() => {
              reject(new Error('Coupang ad timeout'));
            }, 3000);

            // PartnersCoupang 객체 확인 및 실행
            const checkCoupang = () => {
              if (window.PartnersCoupang?.G) {
                clearTimeout(timeout);
                new window.PartnersCoupang.G({
                  id: parseInt(id),
                  template,
                  trackingCode,
                  width,
                  height
                });
                resolve();
              } else {
                // 100ms 후 재시도
                setTimeout(checkCoupang, 100);
              }
            };
            checkCoupang();
          } catch (error) {
            reject(error);
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load Coupang script'));
        };

        document.head.appendChild(script);
      });
    };

    const loadGoogleAd = () => {
      return new Promise<void>((resolve, reject) => {
        // 개발 환경에서는 Google AdSense를 건너뛰고 바로 실패 처리
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Google AdSense skipped in development environment');
          reject(new Error('AdSense not supported in development'));
          return;
        }

        // 구글 애드센스 스크립트 로드 (프로덕션만)
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6225662675575452`;
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
          try {
            // 광고 삽입 div 생성
            if (containerRef.current && fallbackAdSlot) {
              const adDiv = document.createElement('ins');
              adDiv.className = 'adsbygoogle';
              adDiv.style.display = 'block';
              adDiv.setAttribute('data-ad-client', 'ca-pub-6225662675575452');
              adDiv.setAttribute('data-ad-slot', fallbackAdSlot);
              adDiv.setAttribute('data-ad-format', 'auto');
              adDiv.setAttribute('data-full-width-responsive', 'true');

              containerRef.current.appendChild(adDiv);

              // adsbygoogle 초기화
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load Google AdSense script'));
        };

        document.head.appendChild(script);
      });
    };

    // 쿠팡 광고 먼저 시도
    loadCoupangAd()
      .then(() => {
        setAdStatus('coupang');
        console.warn('✅ Coupang ad loaded successfully');
      })
      .catch((error) => {
        console.warn('⚠️ Coupang ad failed, trying Google AdSense:', error);

        // 쿠팡 실패 시 구글 애드센스로 폴백
        if (fallbackAdSlot) {
          loadGoogleAd()
            .then(() => {
              setAdStatus('google');
              console.warn('✅ Google AdSense fallback loaded successfully');
            })
            .catch((googleError) => {
              console.error('❌ Both ad systems failed:', googleError);
              setAdStatus('error');
            });
        } else {
          console.warn('⚠️ No fallback ad slot provided');
          setAdStatus('error');
        }
      });

  }, [id, template, trackingCode, width, height, fallbackAdSlot]);

  return (
    <div
      ref={containerRef}
      className="ad-banner-container flex justify-center items-center"
      style={{
        minWidth: adStatus === 'error' ? '0px' : width + 'px',
        minHeight: adStatus === 'error' ? '0px' : height + 'px',
        backgroundColor: 'transparent',
        display: adStatus === 'error' ? 'none' : 'flex'
      }}
    >
      {/* 로딩 상태와 에러 상태 모두 숨김 처리 */}
    </div>
  );
}