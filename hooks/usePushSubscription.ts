import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushSubscription() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [subscribed, setSubscribed]  = useState(false)
  const [loading, setLoading]        = useState(false)

  // 현재 상태 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)

    // 기존 구독 여부 확인
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub)
      })
    })
  }, [])

  // SW 등록 + 구독 요청
  async function subscribe(settings?: {
    notifHour?: number
    notifMinute?: number
    notifAmpm?: string
    notifDays?: string
  }): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')
      return false
    }
    setLoading(true)
    try {
      // 1. SW 등록
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // 2. 알림 권한 요청
      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionState)
      if (perm !== 'granted') {
        setLoading(false)
        return false
      }

      // 3. Push 구독 (이미 구독 중이면 기존 구독 반환)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      })

      const key = sub.getKey('p256dh')
      const authKey = sub.getKey('auth')
      if (!key || !authKey) throw new Error('Invalid subscription keys')

      // 4. 서버에 저장 (시간 설정 포함)
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
          ...settings,
        }),
      })

      setSubscribed(true)
      setLoading(false)
      return true
    } catch (err) {
      console.error('[Push] subscribe error:', err)
      setLoading(false)
      return false
    }
  }

  // 구독 해제
  async function unsubscribe(): Promise<void> {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('[Push] unsubscribe error:', err)
    }
    setLoading(false)
  }

  return { permission, subscribed, loading, subscribe, unsubscribe }
}
