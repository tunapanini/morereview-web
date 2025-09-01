import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database, DbSubRegion } from '@/types/database';
import { logger } from '@/utils/logger';
import { createErrorResponse } from '@/utils/error-handler';
import { ErrorCode } from '@/types/api-response';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const parentCode = resolvedParams.code;

    const { data: subRegions, error } = await supabase
      .from('sub_regions')
      .select('*')
      .eq('parent_code', parentCode)
      .order('name');

    if (error) {
      throw error;
    }

    if (!subRegions) {
      return NextResponse.json([]);
    }

    const formattedSubRegions = subRegions.map((sub: DbSubRegion) => ({
      code: sub.code,
      name: sub.name,
      parentCode: sub.parent_code
    }));

    return NextResponse.json(formattedSubRegions);

  } catch (error) {
    logger.error('Failed to fetch sub-regions', error);
    return createErrorResponse(error, {
      code: ErrorCode.DATABASE_ERROR,
      message: '하위 지역 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'
    });
  }
}