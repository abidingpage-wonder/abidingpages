-- 답장 안전 이벤트 로그 테이블 (crisis 감지 / fallback 대체 / 검증 실패)
-- Supabase SQL Editor에서 수동 실행 (Next 앱 배포 전에 먼저 실행할 것)

CREATE TABLE IF NOT EXISTS reply_safety_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id  uuid,
  user_id    uuid        NOT NULL,
  pet_id     uuid        NOT NULL,
  event_type text        NOT NULL,  -- crisis_detected | fallback_used | validation_failed
  detail     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 이벤트 유형별 최신순 조회용 인덱스
CREATE INDEX IF NOT EXISTS reply_safety_events_type_created_idx
  ON reply_safety_events (event_type, created_at DESC);
