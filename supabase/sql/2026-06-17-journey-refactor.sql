-- Journey 진행 로직 재설계 마이그레이션
-- 실행 위치: Supabase SQL Editor
-- 실행 전 확인: journey_progress, letters 테이블 존재 여부

-- ── 1. journey_progress 컬럼 변경 ─────────────────────────────────────────

-- nextStageAvailable 제거 (코드에서 미사용, weekUnlocked로 대체)
ALTER TABLE journey_progress
  DROP COLUMN IF EXISTS next_stage_available;

-- weekUnlocked 추가: 비쉼표 질문 3개 완료 시 true → 다음 주차 접근 가능
ALTER TABLE journey_progress
  ADD COLUMN IF NOT EXISTS week_unlocked BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN journey_progress.week_unlocked IS
  '현재 주차에서 비쉼표 질문 3개 완료 시 true — 다음 주차 카드 잠금 해제 상태';

-- ── 2. letters 중복 작성 방지 인덱스 ──────────────────────────────────────

-- 같은 질문에 두 번 답변 불가 (정상 편지 기준)
-- crisis_held 상태 편지는 예외 — 질문 재작성 허용
-- question_id IS NULL (자유 편지)은 중복 허용 — 여러 번 자유 작성 가능
CREATE UNIQUE INDEX IF NOT EXISTS letters_pet_question_unique
  ON letters (pet_id, question_id)
  WHERE question_id IS NOT NULL
    AND letter_status = 'normal';

-- ── 확인 쿼리 (실행 후 검증용) ────────────────────────────────────────────
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'journey_progress'
-- ORDER BY ordinal_position;

-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'letters' AND indexname = 'letters_pet_question_unique';
