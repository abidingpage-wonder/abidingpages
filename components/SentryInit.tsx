'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function SentryInit() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.05,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: false,
        }),
      ],
      beforeSend(event) {
        const isSafetyRelated =
          event.exception?.values?.some((ex) =>
            ['crisis', 'safety', 'suicid', 'self-harm'].some((kw) =>
              (ex.value ?? '').toLowerCase().includes(kw)
            )
          ) || event.tags?.safety === true

        if (isSafetyRelated) {
          event.tags = { ...event.tags, safety: 'true' }
          event.level = 'fatal'
        }

        return event
      },
    })
  }, [])

  return null
}
