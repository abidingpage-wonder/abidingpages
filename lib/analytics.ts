import * as amplitude from '@amplitude/analytics-browser'

// ─── 초기화 ────────────────────────────────────────────────

export function initAmplitude() {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_KEY
  if (!apiKey || typeof window === 'undefined') return

  amplitude.init(apiKey, {
    autocapture: {
      sessions: true,
      pageViews: true,
      formInteractions: false,
      fileDownloads: false,
    },
    defaultTracking: false,
  })
}

// ─── 유저 식별 ─────────────────────────────────────────────

export function identifyUser(
  userId: string,
  props: {
    species?: string
    farewell_type?: string
    signup_date?: string
    garden_public?: boolean
  }
) {
  if (typeof window === 'undefined') return

  amplitude.setUserId(userId)

  const identify = new amplitude.Identify()
  if (props.species) identify.set('species', props.species)
  if (props.farewell_type) identify.set('farewell_type', props.farewell_type)
  if (props.signup_date) identify.set('signup_date', props.signup_date)
  if (props.garden_public !== undefined) identify.set('garden_public', props.garden_public)

  amplitude.identify(identify)
}

// ─── GA4 헬퍼 ─────────────────────────────────────────────

declare function gtag(...args: unknown[]): void

function ga(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof gtag === 'undefined') return
  gtag('event', eventName, params)
}

// ─── 공통 track (Amplitude + GA4 동시 전송) ───────────────

function track(eventName: string, params?: Record<string, unknown>) {
  amplitude.track(eventName, params)
  ga(eventName, params)
}

// ─── 1순위 이벤트 ─────────────────────────────────────────

export function trackLoginCompleted(params: {
  provider: string
  is_new_user: boolean
}) {
  track('login_completed', params)
}

export function trackOnboardingCompleted(params: {
  species: string
  farewell_type: string
  garden_public: boolean
}) {
  track('onboarding_completed', params)
}

export function trackLetterSubmitted(params: {
  emotion_tag: string
  word_count: number
  has_photo: boolean
  week: number
  day: number
  time_spent_sec: number
  letter_type: string
}) {
  track('letter_submitted', params)
}

export function trackReplyViewed(params: {
  letter_id: string
  week: number
}) {
  track('reply_viewed', params)
}

// ─── 2순위 이벤트 ─────────────────────────────────────────

export function trackEmotionSelected(params: {
  emotion_tag: string
  week: number
  day: number
}) {
  track('emotion_selected', params)
}

export function trackNextStageEntered(params: {
  from_week: number
  to_week: number
}) {
  track('next_stage_entered', params)
}

export function trackStickerSent(params: {
  sticker_type: string
}) {
  track('sticker_sent', params)
}

export function trackGardenMessageSubmitted(params: {
  message_length: number
}) {
  track('garden_message_submitted', params)
}

export function trackLetterSubmitFailed(params: {
  error_code: string
}) {
  track('letter_submit_failed', params)
}

export function trackReplyViewedDuration(params: {
  read_duration_sec: number
}) {
  track('reply_viewed_duration', params)
}

// ─── 안전 / 베타 전용 이벤트 ──────────────────────────────

export function trackCrisisDetected(params: {
  week: number
  day: number
}) {
  // Amplitude만 전송 (GA4 제외 — PII 노출 방지)
  amplitude.track('crisis_detected', params)
}

export function trackBetaFeedbackSubmitted(params: {
  rating: number
  has_comment: boolean
}) {
  track('beta_feedback_submitted', params)
}
