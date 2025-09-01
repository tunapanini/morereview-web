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
    
    // 📊 파라미터 기반 캐싱 준비 (향후 Redis 캐시 구현시 사용)
    
    const campaignService = new CampaignQueryService(true) // 서버 클라이언트 사용
    
    // 🚀 성능 향상을 위한 캐싱 (개발 환경에서는 1분, 프로덕션에서는 5분)
    const result = await campaignService.getQualityCampaigns({
      page,
      limit,
      source_site,
      category,
      sortBy,
      sortOrder
    })

    // ⚡ 응답 헤더 최적화
    const response = NextResponse.json(result)
    
    // 캐시 헤더 설정: 1분간 브라우저 캐싱, 5분간 CDN 캐싱
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60, stale-while-revalidate=600')
    response.headers.set('CDN-Cache-Control', 'max-age=300')
    response.headers.set('Vercel-CDN-Cache-Control', 'max-age=300')
    
    return response
    
  } catch (error) {
    console.error('Campaign API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}