import React from 'react';

interface CoupangStaticBannerProps {
  tsource?: string;
}

export default function CoupangStaticBanner({ tsource = '' }: CoupangStaticBannerProps) {
  return (
    <div className="p-4 text-center bg-gray-50">
      <div className="flex justify-center">
        <a
          href={`https://link.coupang.com/a/cMSqJt${tsource ? `?tsource=${tsource}` : ''}`}
          target="_blank"
          referrerPolicy="unsafe-url"
          className="hover:opacity-80 transition-opacity hover-scale"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://ads-partners.coupang.com/banners/911978?subId=morereview&traceId=V0-301-879dd1202e5c73b2-I911978&w=728&h=90${tsource ? `&tsource=${tsource}` : ''}`}
            alt="쿠팡 파트너스 광고"
            className="max-w-full h-auto rounded"
            width="728"
            height="90"
            loading="lazy"
          />
        </a>
      </div>
    </div>
  );
}