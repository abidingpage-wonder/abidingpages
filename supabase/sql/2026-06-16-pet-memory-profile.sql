-- Phase 4: 펫별 AI 메모리 요약 프로필
-- Supabase SQL Editor에서 실행

ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS memory_profile jsonb;

COMMENT ON COLUMN pets.memory_profile IS
  'AI 요약 메모리 프로필: {recurring_guilt, favorite_memory, pet_trait, guardian_pattern}';
