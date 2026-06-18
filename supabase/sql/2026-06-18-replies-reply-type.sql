-- replies: reply_type 컬럼 추가
-- normal = 아이의 답장, crisis = 위기 안내 답장 (자해·자살 신호 감지 시)
ALTER TABLE replies
  ADD COLUMN IF NOT EXISTS reply_type text NOT NULL DEFAULT 'normal';
