import { NextRequest, NextResponse } from 'next/server';
import { withCronAuth } from '@/middleware/cron-auth';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { logger } from '@/utils/logger';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting을 위한 메모리 스토어
const syncAttempts = new Map<string, number>();

// Rate limit 체크 함수 (1시간 제한)
function checkRateLimit(identifier: string): { allowed: boolean; nextAllowedTime?: number } {
  const now = Date.now();
  const lastAttempt = syncAttempts.get(identifier);
  
  if (lastAttempt) {
    const timeSinceLastAttempt = now - lastAttempt;
    const oneHour = 60 * 60 * 1000; // 1시간
    
    if (timeSinceLastAttempt < oneHour) {
      return {
        allowed: false,
        nextAllowedTime: lastAttempt + oneHour
      };
    }
  }
  
  syncAttempts.set(identifier, now);
  return { allowed: true };
}

// 동기화 로그 상세 기록 함수
async function logSyncAttempt(
  status: 'success' | 'error',
  details: {
    totalRegions?: number;
    totalSubRegions?: number;
    errorMessage?: string;
    requestInfo?: {
      ip?: string;
      userAgent?: string;
      isVercelCron?: boolean;
    };
    apiResponse?: {
      statusCode?: number;
      dataCount?: number;
    };
    duration?: number;
  }
) {
  try {
    const logData: any = {
      status,
      total_regions: details.totalRegions || 0,
      total_sub_regions: details.totalSubRegions || 0,
      error_message: details.errorMessage || null,
      last_sync_at: new Date().toISOString()
    };

    // metadata 컬럼이 있다면 추가 정보 저장
    // 없으면 기본 컬럼만 사용
    const metadata = {
      request_info: details.requestInfo,
      api_response: details.apiResponse,
      duration_ms: details.duration
    };

    // 상세 로그 출력
    logger.info('Recording sync attempt', { logData, metadata });

    await supabase.from('region_sync_logs').insert(logData);
  } catch (error) {
    logger.error('Failed to log sync attempt', error);
  }
}

// juso.dev API 응답 형식
interface JusoApiResponse {
  regcodes?: Array<{
    code: string;
    name: string;
  }>;
}

interface RegionCodeData {
  code: string;
  name: string;
  level: number;
  parentCode?: string;
}

// 지역 코드 레벨 판별 함수
function getRegionLevel(code: string): number {
  // 10자리 코드 기준
  // 뒤 8자리가 0: 시/도 (레벨 1)
  // 뒤 5자리가 0: 시/군/구 (레벨 2)
  // 그 외: 동/읍/면 (레벨 3)
  if (code.endsWith('00000000')) return 1;
  if (code.endsWith('00000')) return 2;
  return 3;
}

// 부모 코드 추출 함수
function getParentCode(code: string, level: number): string | undefined {
  if (level === 1) return undefined;
  if (level === 2) return code.substring(0, 2) + '00000000';
  if (level === 3) return code.substring(0, 5) + '00000';
  return undefined;
}

// 특정 패턴으로 지역 코드 가져오기
async function fetchRegionsByPattern(pattern: string, isIgnoreZero: boolean = false): Promise<RegionCodeData[]> {
  try {
    const params = new URLSearchParams({
      regcode_pattern: pattern,
      ...(isIgnoreZero && { is_ignore_zero: 'true' })
    });
    
    const url = `https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes?${params.toString()}`;
    logger.info('Fetching regions', { pattern, url });
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status}`);
    }
    
    const data: JusoApiResponse = await response.json();
    
    if (!data.regcodes || !Array.isArray(data.regcodes)) {
      logger.warn('API returned empty or invalid data', { pattern });
      return [];
    }

    return data.regcodes.map(item => {
      const level = getRegionLevel(item.code);
      return {
        code: item.code,
        name: item.name,
        level,
        parentCode: getParentCode(item.code, level)
      };
    });
    
  } catch (error) {
    logger.error('Failed to fetch region codes', { pattern, error });
    return [];
  }
}

// 모든 지역 코드 가져오기 (시/도 및 하위 지역)
async function fetchRegionCodes(): Promise<RegionCodeData[]> {
  try {
    const allRegions: RegionCodeData[] = [];
    
    // 1. 먼저 모든 시/도 데이터 가져오기
    const provinces = await fetchRegionsByPattern('*00000000');
    allRegions.push(...provinces);
    
    logger.info(`Fetched ${provinces.length} provinces`);
    
    // 2. 각 시/도별로 하위 시/군/구 데이터 가져오기
    const fetchPromises = provinces.map(async (province) => {
      const provinceCode = province.code.substring(0, 2);
      const pattern = `${provinceCode}*`;
      
      // 하위 지역 가져오기 (is_ignore_zero=true로 상위 지역 제외)
      const subRegions = await fetchRegionsByPattern(pattern, true);
      
      // 시/군/구 레벨(레벨 2)만 필터링
      const cityCountyRegions = subRegions.filter(r => r.level === 2);
      
      logger.info(`Fetched ${cityCountyRegions.length} sub-regions for ${province.name}`);
      return cityCountyRegions;
    });
    
    // 모든 하위 지역 데이터 병렬로 가져오기
    const subRegionsArrays = await Promise.allSettled(fetchPromises);
    
    // 성공한 결과만 수집
    for (const result of subRegionsArrays) {
      if (result.status === 'fulfilled' && result.value) {
        allRegions.push(...result.value);
      } else if (result.status === 'rejected') {
        logger.error('Failed to fetch sub-regions', result.reason);
      }
    }
    
    logger.info(`Total regions fetched: ${allRegions.length}`);
    return allRegions;
    
  } catch (error) {
    logger.error('Failed to fetch all region codes', error);
    return [];
  }
}

async function syncRegionsToDatabase(
  regionData: RegionCodeData[], 
  requestInfo?: { ip?: string; userAgent?: string; isVercelCron?: boolean }
) {
  const regions = regionData.filter(item => item.level === 1);
  const subRegions = regionData.filter(item => item.level === 2 && item.parentCode);
  
  let totalRegions = 0;
  let totalSubRegions = 0;
  let errorMessage = null;
  const startTime = Date.now();

  try {
    if (regions.length > 0) {
      const regionInserts: Database['public']['Tables']['regions']['Insert'][] = regions.map(region => ({
        code: region.code,
        name: region.name,
        official_code: region.code,
        level: region.level
      }));

      const { error: regionsError } = await (supabase
        .from('regions') as any)
        .upsert(regionInserts, { 
          onConflict: 'code',
          ignoreDuplicates: false 
        });

      if (regionsError) {
        throw new Error(`Failed to sync regions: ${regionsError.message}`);
      }
      
      totalRegions = regions.length;
    }

    if (subRegions.length > 0) {
      const { data: regionLookup } = await (supabase
        .from('regions') as any)
        .select('id, code');

      if (regionLookup) {
        const regionCodeToId = Object.fromEntries(
          (regionLookup as any[]).map((r: any) => [r.code, r.id])
        );

        const subRegionInserts: Database['public']['Tables']['sub_regions']['Insert'][] = subRegions
          .filter(subRegion => regionCodeToId[subRegion.parentCode!])
          .map(subRegion => {
            // 상위 지역명 찾기
            const parentRegion = regions.find(r => r.code === subRegion.parentCode);
            let cleanName = subRegion.name;
            
            // 하위 지역명에서 상위 지역명 제거
            if (parentRegion && cleanName.startsWith(parentRegion.name)) {
              cleanName = cleanName.replace(parentRegion.name, '').trim();
            }
            
            return {
              code: subRegion.code,
              name: cleanName,
              parent_code: subRegion.parentCode!,
              official_code: subRegion.code,
              region_id: regionCodeToId[subRegion.parentCode!]
            };
          });

        if (subRegionInserts.length > 0) {
          const { error: subRegionsError } = await (supabase
            .from('sub_regions') as any)
            .upsert(subRegionInserts, { 
              onConflict: 'code',
              ignoreDuplicates: false 
            });

          if (subRegionsError) {
            throw new Error(`Failed to sync sub-regions: ${subRegionsError.message}`);
          }
          
          totalSubRegions = subRegionInserts.length;
        }
      }
    }

    // 성공 로그 상세 기록
    const duration = Date.now() - startTime;
    await logSyncAttempt('success', {
      totalRegions,
      totalSubRegions,
      requestInfo,
      apiResponse: {
        dataCount: regionData.length
      },
      duration
    });

    return {
      success: true,
      totalRegions,
      totalSubRegions,
      message: `Successfully synced ${totalRegions} regions and ${totalSubRegions} sub-regions`,
      duration: `${duration}ms`
    };

  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 에러 로그 상세 기록
    const duration = Date.now() - startTime;
    await logSyncAttempt('error', {
      totalRegions,
      totalSubRegions,
      errorMessage,
      requestInfo,
      apiResponse: {
        dataCount: regionData.length
      },
      duration
    });

    throw error;
  }
}

async function cronHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Rate limiting 체크 (Vercel Cron용)
  const rateLimitKey = 'vercel-cron';
  const { allowed, nextAllowedTime } = checkRateLimit(rateLimitKey);
  
  if (!allowed) {
    const waitTime = Math.ceil((nextAllowedTime! - Date.now()) / 1000 / 60); // 분 단위
    
    logger.warn('Rate limit exceeded', {
      identifier: rateLimitKey,
      waitTimeMinutes: waitTime,
      timestamp: new Date().toISOString()
    });
    
    await logSyncAttempt('error', {
      errorMessage: `Rate limit exceeded. Try again in ${waitTime} minutes.`,
      requestInfo: { ip, userAgent, isVercelCron: true }
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: `Rate limit exceeded. Please wait ${waitTime} minutes before next sync.`,
        nextAllowedAt: new Date(nextAllowedTime!).toISOString()
      },
      { status: 429 }
    );
  }
  
  try {
    logger.info('Starting region synchronization', {
      triggeredBy: 'Vercel Cron',
      ip: 'N/A',
      timestamp: new Date().toISOString()
    });
    
    const regionData = await fetchRegionCodes();
    
    if (regionData.length === 0) {
      logger.warn('No region data retrieved from API, keeping existing data');
      
      const duration = Date.now() - startTime;
      await logSyncAttempt('error', {
        errorMessage: 'No data retrieved from external API',
        requestInfo: { ip, userAgent, isVercelCron: true },
        apiResponse: { dataCount: 0 },
        duration
      });
      
      return NextResponse.json({
        success: true,
        message: 'No new data available, existing data preserved',
        totalRegions: 0,
        totalSubRegions: 0,
        syncDuration: `${duration}ms`
      });
    }
    
    const requestInfo = { ip, userAgent, isVercelCron: true };
    const result = await syncRegionsToDatabase(regionData, requestInfo);
    const totalDuration = Date.now() - startTime;
    
    logger.info('Region synchronization completed', {
      ...result,
      totalDuration: `${totalDuration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      ...result,
      syncedAt: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Region synchronization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
    
    await logSyncAttempt('error', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      requestInfo: { ip, userAgent, isVercelCron: true },
      duration
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export const GET = withCronAuth(cronHandler);
export const POST = withCronAuth(cronHandler);