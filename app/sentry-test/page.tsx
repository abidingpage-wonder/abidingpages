'use client'

import * as Sentry from '@sentry/nextjs'
import { trackLoginCompleted } from '@/lib/analytics'

export default function SentryTestPage() {
  function throwError() {
    throw new Error('Sentry 테스트 에러 — 정상 수신 확인용')
  }

  function throwSafetyError() {
    throw new Error('crisis detected — safety tag 테스트')
  }

  function sendSentryManual() {
    Sentry.captureMessage('Sentry 수동 전송 테스트', 'info')
    alert('Sentry에 메시지 전송 완료. Issues 확인하세요.')
  }

  function sendGAEvent() {
    trackLoginCompleted({ provider: 'test', is_new_user: false })
    alert('GA4 login_completed 이벤트 전송 완료. DebugView 확인하세요.')
  }

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>QA 테스트 페이지</h1>

      <button
        onClick={throwError}
        style={{ padding: '12px 16px', background: '#e53e3e', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
      >
        Sentry — 일반 에러 발생
      </button>

      <button
        onClick={throwSafetyError}
        style={{ padding: '12px 16px', background: '#744210', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
      >
        Sentry — safety 태그 에러 발생
      </button>

      <button
        onClick={sendSentryManual}
        style={{ padding: '12px 16px', background: '#6b6080', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
      >
        Sentry — 수동 메시지 전송 (에러 없이)
      </button>

      <button
        onClick={sendGAEvent}
        style={{ padding: '12px 16px', background: '#2b6cb0', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
      >
        GA4 — login_completed 이벤트 전송
      </button>
    </div>
  )
}
