-- 캠페인 목록 API 성능 최적화를 위한 복합 인덱스 생성
-- 작성일: 2025-09-02
-- 설명: remaining_days 제거 후 deadline 기반 최적화된 인덱스 구성

-- 1. 최신순 정렬을 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_latest_optimized 
ON campaigns (is_hidden, is_invalid, created_at DESC, id DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 2. 마감순 정렬을 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_deadline_optimized 
ON campaigns (is_hidden, is_invalid, deadline DESC, id DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 3. 리워드순 정렬을 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_reward_optimized 
ON campaigns (is_hidden, is_invalid, reward_points DESC, created_at DESC, id DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 4. 카테고리별 필터링을 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_category_optimized 
ON campaigns (is_hidden, is_invalid, category, created_at DESC, id DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 5. 사이트별 필터링을 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_source_optimized 
ON campaigns (is_hidden, is_invalid, source_site, created_at DESC, id DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 인덱스 생성 확인 쿼리:
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'campaigns' AND indexname LIKE '%_optimized';