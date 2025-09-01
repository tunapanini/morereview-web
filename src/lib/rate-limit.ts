/**
 * Rate Limiting 유틸리티
 * IP 기반으로 API 요청을 제한합니다.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

// Rate limit 데이터 저장
interface RateLimitData {
  requests: number[];  // 요청 시간 배열
  blocked?: number;    // 차단된 시간
}

// 메모리 저장소 (프로덕션에서는 Redis 권장)
const rateLimitStore = new Map<string, RateLimitData>();

// Rate limit 설정
export interface RateLimitConfig {
  limit: number;        // 최대 요청 수
  windowMs: number;     // 시간 창 (밀리초)
  skipSuccessfulRequests?: boolean;  // 성공한 요청만 카운트
  skipFailedRequests?: boolean;      // 실패한 요청은 제외
  message?: string;     // 커스텀 에러 메시지
}

// 기본 설정
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 60,           // 분당 60회
  windowMs: 60 * 1000, // 1분
  message: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
};

// API별 Rate Limit 설정
export const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/sync-regions': {
    limit: 1,
    windowMs: 60 * 60 * 1000, // 1시간에 1회
    message: '지역 동기화는 1시간에 한 번만 가능합니다.'
  },
  '/api/regions': {
    limit: 100,
    windowMs: 60 * 1000, // 분당 100회
  },
  '/api/dev': {
    limit: 10,
    windowMs: 60 * 1000, // 개발 API는 분당 10회
  }
};

/**
 * Rate limit 체크
 */
export function checkRateLimit(
  identifier: string,
  pathname: string,
  config?: RateLimitConfig
): NextResponse | null {
  const now = Date.now();
  
  // API별 설정 또는 기본 설정 사용
  const rateLimitConfig = config || API_RATE_LIMITS[pathname] || DEFAULT_RATE_LIMIT;
  const { limit, windowMs, message } = rateLimitConfig;
  
  // 식별자별 데이터 가져오기
  const key = `${identifier}:${pathname}`;
  const data = rateLimitStore.get(key) || { requests: [] };
  
  // 차단된 경우 체크
  if (data.blocked && now - data.blocked < windowMs) {
    const retryAfter = Math.ceil((data.blocked + windowMs - now) / 1000);
    
    logger.warn('Rate limit blocked', {
      identifier,
      pathname,
      retryAfter
    });
    
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || DEFAULT_RATE_LIMIT.message,
          retryAfter
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(data.blocked + windowMs).toISOString(),
          'Retry-After': retryAfter.toString()
        }
      }
    );
  }
  
  // 시간 창 내의 요청만 필터링
  const validRequests = data.requests.filter(time => now - time < windowMs);
  
  // 제한 초과 체크
  if (validRequests.length >= limit) {
    data.blocked = now;
    rateLimitStore.set(key, data);
    
    const retryAfter = Math.ceil(windowMs / 1000);
    
    logger.warn('Rate limit exceeded', {
      identifier,
      pathname,
      requests: validRequests.length,
      limit
    });
    
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || DEFAULT_RATE_LIMIT.message,
          retryAfter
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
          'Retry-After': retryAfter.toString()
        }
      }
    );
  }
  
  // 요청 기록
  validRequests.push(now);
  rateLimitStore.set(key, { requests: validRequests });
  
  // Rate limit 헤더 추가 (정보 제공용)
  const remaining = limit - validRequests.length;
  
  logger.dev('Rate limit check passed', {
    identifier,
    pathname,
    used: validRequests.length,
    limit,
    remaining
  });
  
  // null 반환시 요청 계속 진행
  return null;
}

/**
 * 정리 함수 (오래된 데이터 제거)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24시간
  
  for (const [key, data] of rateLimitStore.entries()) {
    const lastRequest = Math.max(...data.requests, data.blocked || 0);
    
    if (now - lastRequest > maxAge) {
      rateLimitStore.delete(key);
    }
  }
  
  logger.dev('Rate limit store cleanup completed', {
    remainingKeys: rateLimitStore.size
  });
}

// 주기적 정리 (1시간마다)
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}