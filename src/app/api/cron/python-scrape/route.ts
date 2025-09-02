import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Vercel Cron Job - Python 스크래핑 통합 실행
 * 스케줄: 2시간마다 (vercel.json에서 설정)
 */
export async function GET(request: NextRequest) {
  // Vercel Cron의 보안 헤더 확인
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.warn(`[${timestamp}] Python 스크래핑 Cron 작업 시작`);

  try {
    // Python 스크래핑 실행
    const command = 'cd scraping && python main.py all --json';
    
    console.warn(`실행 명령: ${command}`);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 8 * 60 * 1000, // 8분 타임아웃 (Vercel 10분 제한 고려)
      maxBuffer: 1024 * 1024 * 10 // 10MB 버퍼
    });

    const duration = Date.now() - startTime;
    
    // Python 스크립트의 JSON 출력 파싱
    let result;
    try {
      // stdout에서 JSON 부분만 추출
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON 출력을 찾을 수 없습니다');
      }
    } catch (parseError) {
      console.warn('JSON 파싱 실패, 원본 출력 사용:', parseError);
      result = {
        success: true,
        raw_output: stdout,
        message: 'JSON 파싱 실패, 원본 출력 포함'
      };
    }

    // 성공 로그
    console.warn(`[${timestamp}] Python 스크래핑 완료 (${duration}ms)`);
    if (result.summary) {
      console.warn(`  - 소스: ${result.summary.successful_sources}/${result.summary.total_sources}`);
      console.warn(`  - 캠페인: ${result.summary.total_campaigns}개`);
      console.warn(`  - 저장: ${result.summary.total_saved}개`);
    }

    // stderr 경고 처리
    if (stderr) {
      console.warn('Python stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      timestamp,
      duration_ms: duration,
      result,
      python_stderr: stderr || null
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[${timestamp}] Python 스크래핑 실패 (${duration}ms):`, errorMessage);
    
    // 타임아웃 에러 특별 처리
    if (errorMessage.includes('timeout')) {
      return NextResponse.json({
        success: false,
        timestamp,
        duration_ms: duration,
        error: 'Python 스크래핑 타임아웃 (8분 초과)',
        error_type: 'timeout'
      }, { status: 408 });
    }

    return NextResponse.json({
      success: false,
      timestamp,
      duration_ms: duration,
      error: errorMessage,
      error_type: 'execution_error'
    }, { status: 500 });
  }
}

/**
 * 수동 트리거용 POST 엔드포인트
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const sources = body.sources || 'all';
  
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.warn(`[${timestamp}] 수동 Python 스크래핑 시작 (소스: ${sources})`);

  try {
    const command = `cd scraping && python main.py ${sources} --json`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 8 * 60 * 1000,
      maxBuffer: 1024 * 1024 * 10
    });

    const duration = Date.now() - startTime;
    
    let result;
    try {
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_output: stdout };
    } catch {
      result = { raw_output: stdout };
    }

    console.warn(`[${timestamp}] 수동 스크래핑 완료 (${duration}ms)`);

    return NextResponse.json({
      success: true,
      timestamp,
      duration_ms: duration,
      sources,
      result,
      python_stderr: stderr || null
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[${timestamp}] 수동 스크래핑 실패 (${duration}ms):`, errorMessage);
    
    return NextResponse.json({
      success: false,
      timestamp,
      duration_ms: duration,
      sources,
      error: errorMessage
    }, { status: 500 });
  }
}