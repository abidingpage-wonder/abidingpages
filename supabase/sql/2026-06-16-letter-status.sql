-- crisis_held 편지 상태 컬럼 추가
-- Supabase SQL Editor에서 수동 실행 (reply-safety-events.sql 이후에 실행)

ALTER TABLE letters
  ADD COLUMN IF NOT EXISTS letter_status text NOT NULL DEFAULT 'normal';

-- crisis_held 편지 조회용 인덱스 (홈·여정 카운트 제외 쿼리 최적화)
CREATE INDEX IF NOT EXISTS letters_crisis_held_idx
  ON letters (pet_id, letter_status)
  WHERE letter_status = 'crisis_held';

-- 테스트로 생성된 dev crisis 편지 정리 (적용 후 선택적 실행)
-- DELETE FROM letters WHERE letter_status = 'crisis_held';
