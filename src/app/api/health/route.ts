// 헬스체크 API

import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();

  try {
    // 기본 시스템 상태 확인
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      version: '1.0.0',
      services: {
        crawler: 'operational',
        api: 'operational'
      },
      responseTime: Date.now() - startTime
    };

    // 메모리 사용률이 높으면 경고
    if (health.memory.percentage > 80) {
      health.status = 'warning';
    }

    return NextResponse.json(health);

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}