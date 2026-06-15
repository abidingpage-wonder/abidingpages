-- ============================================================================
-- 답장 알림 주기 호출 — Supabase pg_cron + pg_net
-- ----------------------------------------------------------------------------
-- Vercel Hobby 플랜이 10분 cron을 못 돌려 vercel.json cron을 제거했으므로,
-- 그 역할을 Supabase pg_cron 이 대신한다.
-- pg_cron 이 10분마다 Next 엔드포인트(/api/cron/send-reply-notifications)를
-- pg_net 으로 HTTP 호출 → 기존 발송 로직을 그대로 재사용.
--
-- 사전 준비 (이 SQL 실행 전):
--   1) Vercel 환경변수에 CRON_SECRET 등록 (아래 Vault에 넣는 값과 동일해야 함)
--   2) Vercel 재배포 (env 반영)
--
-- 실행 위치: Supabase Dashboard → SQL Editor (postgres 권한)
-- 아래 'REPLACE_WITH_CRON_SECRET' 를 실제 CRON_SECRET 값으로 바꾼 뒤 실행할 것.
-- ============================================================================

-- 1) 확장 활성화 ------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Vault 에 호출 URL / 시크릿 저장 (idempotent upsert) ---------------------
--    URL 은 비밀은 아니지만 함수에서 한곳으로 읽기 위해 같이 보관.
do $$
declare
  v_url    text := 'https://abidingpages.com/api/cron/send-reply-notifications';
  v_secret text := 'REPLACE_WITH_CRON_SECRET';  -- ← Vercel CRON_SECRET 와 동일 값
  v_id     uuid;
begin
  -- URL
  select id into v_id from vault.secrets where name = 'reply_notify_url';
  if v_id is null then
    perform vault.create_secret(v_url, 'reply_notify_url', 'reply-notify cron 호출 URL');
  else
    perform vault.update_secret(v_id, v_url);
  end if;

  -- SECRET (Bearer 토큰)
  select id into v_id from vault.secrets where name = 'reply_notify_cron_secret';
  if v_id is null then
    perform vault.create_secret(v_secret, 'reply_notify_cron_secret', 'reply-notify Bearer 토큰');
  else
    perform vault.update_secret(v_id, v_secret);
  end if;
end $$;

-- 3) 호출 래퍼 함수 ----------------------------------------------------------
--    Vault 에서 URL/시크릿을 읽어 Authorization: Bearer 헤더로 GET 호출.
create or replace function public.trigger_reply_notifications()
returns void
language plpgsql
security definer
set search_path = public, vault, net, extensions
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'reply_notify_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'reply_notify_cron_secret';

  if v_url is null or v_secret is null then
    raise warning 'reply-notify: vault secret(reply_notify_url/reply_notify_cron_secret) 누락 — 호출 생략';
    return;
  end if;

  perform net.http_get(
    url     := v_url,
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || v_secret,
                 'Content-Type',  'application/json'
               ),
    timeout_milliseconds := 30000
  );
end $$;

-- 4) 10분마다 스케줄 (jobname 동일하면 upsert) --------------------------------
select cron.schedule(
  'reply-notifications',
  '*/10 * * * *',
  $cmd$ select public.trigger_reply_notifications(); $cmd$
);

-- ============================================================================
-- 확인 / 운영용 쿼리 (필요 시 개별 실행)
-- ============================================================================
-- 등록된 잡 확인:
--   select jobid, schedule, command, active from cron.job where jobname = 'reply-notifications';
--
-- 수동 1회 즉시 호출(테스트):
--   select public.trigger_reply_notifications();
--
-- 최근 HTTP 응답 확인 (200 이어야 정상; 401 이면 시크릿 불일치):
--   select id, status_code, content, created
--     from net._http_response order by created desc limit 5;
--
-- 잡 실행 이력:
--   select * from cron.job_run_details
--    where jobid = (select jobid from cron.job where jobname='reply-notifications')
--    order by start_time desc limit 10;
--
-- 잡 중지(되돌리기):
--   select cron.unschedule('reply-notifications');
-- ============================================================================
