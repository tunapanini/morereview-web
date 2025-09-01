import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';

// API 라우트 체크
function isAPIRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

// 관리자 API 체크 (cron 제외)
function isAdminAPIRoute(pathname: string): boolean {
  return pathname.startsWith('/api/sync-regions') || 
         pathname.startsWith('/api/dev/');
}

// Cron API 체크
function isCronAPIRoute(pathname: string): boolean {
  return pathname.startsWith('/api/cron/');
}

// IP 주소 추출
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // API 라우트만 처리
  if (!isAPIRoute(pathname)) {
    return NextResponse.next();
  }
  
  const ip = getClientIp(request);
  
  // Cron API는 자체 미들웨어에서 처리하므로 여기서는 제외
  if (isCronAPIRoute(pathname)) {
    return NextResponse.next();
  }
  
  // 관리자 API 인증 체크
  if (isAdminAPIRoute(pathname)) {
    const adminApiKey = request.headers.get('x-api-key');
    
    // Admin API 키 인증
    const hasValidApiKey = adminApiKey === process.env.ADMIN_API_KEY;
    
    // 프로덕션 환경에서는 인증 필수
    if (process.env.NODE_ENV === 'production' && !hasValidApiKey) {
      logger.warn('Unauthorized admin API access attempt', {
        pathname,
        ip,
        userAgent: request.headers.get('user-agent')
      });
      
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '권한이 없습니다.'
          }
        },
        { status: 401 }
      );
    }
  }
  
  // Rate limiting 체크
  const rateLimitResult = checkRateLimit(ip, pathname);
  
  if (rateLimitResult) {
    // Rate limit 초과시 에러 응답 반환
    return rateLimitResult;
  }
  
  // 정상 처리
  const response = NextResponse.next();
  
  // CORS 헤더 추가 (필요시)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*'
};