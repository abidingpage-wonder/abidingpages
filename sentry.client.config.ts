import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 프로덕션에서만 에러 전송, 개발 중에는 콘솔 확인
  enabled: process.env.NODE_ENV === 'production',

  // 샘플링: 에러는 100%, 성능은 베타 기간엔 10%
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  // crisis 관련 에러에 safety 태그 자동 부착
  beforeSend(event) {
    const isSafetyRelated =
      event.exception?.values?.some((ex) =>
        ['crisis', 'safety', 'suicid', 'self-harm'].some((kw) =>
          (ex.value ?? '').toLowerCase().includes(kw)
        )
      ) ||
      (event.tags?.safety === true)

    if (isSafetyRelated) {
      event.tags = { ...event.tags, safety: 'true' }
      event.level = 'fatal'
    }

    return event
  },
})
