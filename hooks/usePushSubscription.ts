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

// 현재 origin 구독을 VAPID 키와 일치하도록 보정(auto-heal).
// 권한이 이미 'granted'일 때만 동작 — 권한 팝업을 띄우지 않는 무음 함수.
// 도메인 이전(구독은 origin 종속) / VAPID 키 교체로 구독이 끊긴 경우를 사용자 조작 없이 복구한다.
// 반환: 'healed'(재구독함) | 'ok'(이미 유효) | 'skip'(대상 아님/미지원)
export async function ensureFreshPushSubscription(): Promise<'healed' | 'ok' | 'skip'> {
  if (typeof window === 'undefined') return 'skip'
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'skip'
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return 'skip'
  if (!VAPID_PUBLIC_KEY) return 'skip'

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const desired = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    const existing = await reg.pushManager.getSubscription()

    let needNew = !existing
    if (existing) {
      const cur = existing.options.applicationServerKey
      const curArr = cur ? new Uint8Array(cur as ArrayBuffer) : new Uint8Array()
      const match = curArr.length === desired.length && curArr.every((b, i) => b === desired[i])
      if (!match) {
        await existing.unsubscribe()   // VAPID 키 불일치 — 옛 구독 폐기
        needNew = true
      }
    }
    // 유효 구독이 이미 있으면 그대로 둔다(서버에 저장돼 있다고 가정) → 매 로드마다 쓰기 방지
    if (!needNew) return 'ok'

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: desired.buffer as ArrayBuffer,
    })
    const key = sub.getKey('p256dh')
    const authKey = sub.getKey('auth')
    if (!key || !authKey) return 'skip'

    // 기존 알림 시간 설정(옛 origin 구독 행)을 보존해 새 구독에 그대로 적용
    let settings: Record<string, unknown> = {}
    try {
      const r = await fetch('/api/push/subscribe')
      if (r.ok) {
        const j = await r.json()
        if (j?.subscription) settings = j.subscription
      }
    } catch {
      /* 설정 조회 실패 시 서버 기본값(오전 9시) 사용 */
    }

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
    return 'healed'
  } catch (err) {
    console.error('[Push] ensureFreshPushSubscription error:', err)
    return 'skip'
  }
}
