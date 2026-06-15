-- 답장 예약 노출/예약 푸시용 컬럼 추가
-- Supabase SQL Editor에서 수동 실행 (Next 앱 배포 전에 먼저 실행할 것)

ALTER TABLE replies
  ADD COLUMN IF NOT EXISTS visible_at  timestamptz,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

-- 백필: 기존 답장은 계속 보이고, 재알림이 가지 않도록 처리 (필수!)
UPDATE replies SET visible_at = generated_at, notified_at = generated_at
WHERE visible_at IS NULL;

-- 발송 대기 답장 조회용 인덱스
CREATE INDEX IF NOT EXISTS replies_due_notify_idx
  ON replies (visible_at) WHERE notified_at IS NULL;
