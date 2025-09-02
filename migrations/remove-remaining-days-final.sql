-- remaining_days 컬럼 완전 삭제 마이그레이션
-- 작성일: 2025-09-02
-- 설명: public_campaigns 뷰 의존성 해결 후 remaining_days 컬럼 완전 제거

-- ==== 1단계: 의존성 있는 뷰 제거 ====
BEGIN;

-- 1.1. public_campaigns 뷰가 존재하면 삭제
DROP VIEW IF EXISTS public_campaigns;

-- 1.2. 다른 뷰들도 확인 (혹시 모를 의존성)
-- (Supabase 콘솔에서 추가 뷰 확인 필요)

COMMIT;

-- ==== 2단계: remaining_days 컬럼 완전 제거 ====
BEGIN;

-- 2.1. remaining_days 관련 인덱스 제거
DROP INDEX IF EXISTS idx_campaigns_remaining_days;

-- 2.2. remaining_days 컬럼 제거 (CASCADE 사용)
ALTER TABLE campaigns DROP COLUMN IF EXISTS remaining_days CASCADE;

COMMIT;

-- ==== 3단계: 대체 뷰 생성 (필요시) ====
BEGIN;

-- 3.1. deadline 기반 public_campaigns 뷰 재생성 (필요한 경우만)
CREATE OR REPLACE VIEW public_campaigns AS
SELECT 
  id,
  source_site,
  campaign_id,
  title,
  description,
  thumbnail_image,
  detail_url,
  applications_current,
  applications_total,
  reward_points,
  category,
  location_type,
  channels,
  extracted_at,
  created_at,
  updated_at,
  is_hidden,
  is_invalid,
  deadline,
  -- remaining_days를 deadline에서 실시간 계산 (하위 호환성용)
  CASE 
    WHEN deadline IS NOT NULL 
    THEN GREATEST(0, EXTRACT(days FROM (deadline - NOW())))::int
    ELSE NULL
  END as computed_remaining_days
FROM campaigns
WHERE is_hidden = false AND is_invalid = false;

COMMIT;

-- ==== 4단계: 성능 최적화 인덱스 생성 ====
BEGIN;

-- 4.1. 최신순 정렬 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_latest_optimized 
ON campaigns (is_hidden, is_invalid, created_at DESC, id DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 4.2. 마감순 정렬 최적화  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_deadline_optimized 
ON campaigns (is_hidden, is_invalid, deadline DESC, id DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 4.3. 리워드순 정렬 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_reward_optimized 
ON campaigns (is_hidden, is_invalid, reward_points DESC, created_at DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 4.4. 카테고리 필터링 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_category_filter 
ON campaigns (is_hidden, is_invalid, category, created_at DESC)
WHERE is_hidden = false AND is_invalid = false;

-- 4.5. 소스 사이트 필터링 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_source_filter 
ON campaigns (is_hidden, is_invalid, source_site, created_at DESC)
WHERE is_hidden = false AND is_invalid = false;

COMMIT;

-- ==== 5단계: 마이그레이션 검증 ====

-- 5.1. remaining_days 컬럼이 존재하지 않는지 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'campaigns' AND column_name = 'remaining_days';
-- (결과가 없어야 함)

-- 5.2. 새로운 인덱스들이 생성되었는지 확인
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'campaigns' AND indexname LIKE '%_optimized';

-- 5.3. 샘플 쿼리 성능 테스트
EXPLAIN ANALYZE 
SELECT id, title, deadline, created_at 
FROM campaigns 
WHERE is_hidden = false AND is_invalid = false 
ORDER BY created_at DESC, id DESC 
LIMIT 20;

-- 실행 완료 후 이 파일 삭제 권장