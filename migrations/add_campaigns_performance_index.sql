-- Campaign List API 성능 최적화를 위한 인덱스 추가
-- 2025-01-01

-- 1. 데이터 품질 필터링과 정렬을 함께 최적화하는 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_quality_sort 
ON campaigns (is_hidden, is_invalid, created_at DESC, id DESC);

-- 2. source_site 필터링 + 품질 필터링 + 정렬을 위한 복합 인덱스  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_source_quality_sort
ON campaigns (source_site, is_hidden, is_invalid, created_at DESC, id DESC);

-- 3. category 필터링 + 품질 필터링 + 정렬을 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_category_quality_sort  
ON campaigns (category, is_hidden, is_invalid, created_at DESC, id DESC);

-- 4. deadline 정렬 최적화를 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_deadline_sort
ON campaigns (is_hidden, is_invalid, deadline DESC, id DESC);

-- 성능 통계 업데이트
ANALYZE campaigns;