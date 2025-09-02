-- public_campaigns 뷰 수정 및 remaining_days 컬럼 제거
-- 작성일: 2025-09-02

-- 1. 기존 뷰 삭제
DROP VIEW IF EXISTS public_campaigns;

-- 2. remaining_days 없이 뷰 재생성 (deadline 기반)
CREATE VIEW public_campaigns AS
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
  -- remaining_days를 deadline에서 실시간 계산
  CASE 
    WHEN deadline IS NOT NULL 
    THEN GREATEST(0, EXTRACT(days FROM (deadline - NOW())))::int
    ELSE 7
  END as calculated_remaining_days
FROM campaigns
WHERE is_hidden = false AND is_invalid = false;

-- 3. 이제 remaining_days 컬럼 제거 가능
ALTER TABLE campaigns DROP COLUMN IF EXISTS remaining_days;

-- 4. remaining_days 관련 인덱스 제거  
DROP INDEX IF EXISTS idx_campaigns_remaining_days;