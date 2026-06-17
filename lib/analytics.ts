declare function gtag(...args: unknown[]): void

function sendEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof gtag === 'undefined') return
  gtag('event', eventName, params)
}

export function trackLoginCompleted(params: {
  provider: string
  is_new_user: boolean
}) {
  sendEvent('login_completed', params)
}

export function trackOnboardingCompleted(params: {
  species: string
  farewell_type: string
  garden_public: boolean
}) {
  sendEvent('onboarding_completed', params)
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
  sendEvent('letter_submitted', params)
}
