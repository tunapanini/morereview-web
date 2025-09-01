// Vercel Cron 인증 미들웨어

import { NextRequest, NextResponse } from 'next/server';

export function withCronAuth(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 프로덕션 환경이 아니면 인증 bypass
    if (process.env.NODE_ENV !== 'production') {
      return handler(request);
    }
    
    // CRON_SECRET 인증 확인
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      console.warn('❌ Unauthorized cron request', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'This endpoint can only be triggered by Vercel Cron'
        },
        { status: 401 }
      );
    }
    
    // 인증 성공 시 실제 핸들러 실행
    return handler(request);
  };
}