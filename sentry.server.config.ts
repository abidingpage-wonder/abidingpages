import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,

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
