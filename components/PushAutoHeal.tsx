'use client'

import { useEffect } from 'react'
import { ensureFreshPushSubscription } from '@/hooks/usePushSubscription'

// 앱 로드 시 1회: 알림 권한이 이미 허용돼 있는데 현재 origin 구독이 없거나
// VAPID 키가 바뀐 경우 무음으로 재구독한다(권한 팝업 없음).
// 도메인 이전(abiding.vercel.app→abidingpages.app)으로 옛 origin 구독이 끊긴
// 사용자를 별도 조작 없이 복구하기 위함.
export default function PushAutoHeal() {
  useEffect(() => {
    if (sessionStorage.getItem('push_heal_done')) return
    sessionStorage.setItem('push_heal_done', '1')
    ensureFreshPushSubscription()
  }, [])

  return null
}
