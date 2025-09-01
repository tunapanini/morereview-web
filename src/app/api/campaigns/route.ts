import { NextRequest, NextResponse } from 'next/server'
import { CampaignQueryService } from '@/services/campaign-query-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const source_site = searchParams.get('source_site') || undefined
    const category = searchParams.get('category') || undefined
    const sortBy = (searchParams.get('sortBy') || 'latest') as import('@/types/campaign').CampaignSortBy
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as import('@/types/campaign').CampaignSortOrder
    
    const campaignService = new CampaignQueryService(true) // 서버 클라이언트 사용
    
    const result = await campaignService.getQualityCampaigns({
      page,
      limit,
      source_site,
      category,
      sortBy,
      sortOrder
    })
    
    return NextResponse.json(result)
    
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}