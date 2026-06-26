'use client'

import { useEffect } from 'react'
import { trackLandingViewed } from '@/lib/analytics'

// 랜딩 진입을 퍼널 앵커 이벤트로 1회 기록(자동 page_view 와 별개).
export default function LandingAnalytics() {
  useEffect(() => {
    trackLandingViewed()
  }, [])
  return null
}
