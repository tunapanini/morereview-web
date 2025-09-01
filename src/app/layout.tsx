import type { Metadata } from "next";
import { Noto_Sans_KR, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorLogger from './error-logger';
import { COMMON_DESCRIPTIONS } from '@/lib/constants';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
  fallback: ["Malgun Gothic", "Apple SD Gothic Neo", "system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "모아리뷰 - 인플루언서 캠페인 모음",
  description: COMMON_DESCRIPTIONS.appDescription,
  keywords: "인플루언서, 캠페인, 마케팅, 체험단, 리뷰",
  other: {
    'google-adsense-account': 'ca-pub-6225662675575452',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "모아리뷰",
    description: COMMON_DESCRIPTIONS.appDescription,
    url: "https://morereview.vercel.app",
    siteName: "모아리뷰",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '모아리뷰 - 인플루언서 캠페인 모음',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "모아리뷰",
    description: COMMON_DESCRIPTIONS.appDescription,
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKR.variable} ${geistMono.variable} antialiased font-optimized`}
      >
        <ErrorLogger />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
