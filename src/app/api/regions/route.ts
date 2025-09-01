import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database, DbRegion, DbSubRegion } from '@/types/database';
import { logger } from '@/utils/logger';
import { createErrorResponse } from '@/utils/error-handler';
import { ErrorCode } from '@/types/api-response';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('*')
      .order('name');

    if (regionsError) {
      throw regionsError;
    }

    const { data: subRegions, error: subRegionsError } = await supabase
      .from('sub_regions')
      .select('*')
      .order('name');

    if (subRegionsError) {
      throw subRegionsError;
    }

    if (!regions || !subRegions) {
      return NextResponse.json([]);
    }

    const regionsWithSubRegions = regions.map((region: DbRegion) => ({
      code: region.code,
      name: region.name,
      subRegions: subRegions
        .filter((sub: DbSubRegion) => sub.parent_code === region.code)
        .map((sub: DbSubRegion) => ({
          code: sub.code,
          name: sub.name,
          parentCode: sub.parent_code
        }))
    }));

    return NextResponse.json(regionsWithSubRegions);

  } catch (error) {
    logger.error('Failed to fetch regions', error);
    return createErrorResponse(error, {
      code: ErrorCode.DATABASE_ERROR,
      message: '지역 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'
    });
  }
}