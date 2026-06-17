-- push_subscriptions: updated_at 컬럼 추가
-- 알림 시간 변경 시 updated_at 기준으로 최신 구독을 읽기 위함
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 기존 row: created_at으로 초기화
UPDATE push_subscriptions
  SET updated_at = created_at
  WHERE updated_at IS NULL;
