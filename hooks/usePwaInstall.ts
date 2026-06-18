'use client'

import { useEffect, useState, useCallback } from 'react'

type Platform = 'ios' | 'android' | 'other'

// beforeinstallprompt 이벤트 타입 (표준 미포함)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const mql = window.matchMedia?.('(display-mode: standalone)').matches
  // iOS Safari 설치 PWA 감지
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
  return !!mql || iosStandalone
}

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

/**
 * PWA 설치 상태 감지 + 설치 프롬프트 제어.
 * - isStandalone: 홈 화면에 설치된 앱으로 실행 중인지 (Web Push 가능 조건)
 * - platform: ios | android | other
 * - canPrompt: beforeinstallprompt(Android/Chrome) 사용 가능 → 원탭 설치 가능
 * - promptInstall: 네이티브 설치 프롬프트 호출 (Android/Chrome 한정)
 * - ready: 클라이언트 측정 완료 여부 (SSR 깜빡임 방지)
 */
export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(false)
  const [platform, setPlatform]         = useState<Platform>('other')
  const [deferred, setDeferred]         = useState<BeforeInstallPromptEvent | null>(null)
  const [ready, setReady]               = useState(false)

  useEffect(() => {
    setIsStandalone(detectStandalone())
    setPlatform(detectPlatform())
    setReady(true)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()  // 브라우저 기본 미니 배너 억제 → 커스텀 버튼에서 제어
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setIsStandalone(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // display-mode 변경 감지 (설치 직후 등)
    const mql = window.matchMedia?.('(display-mode: standalone)')
    const onChange = () => setIsStandalone(detectStandalone())
    mql?.addEventListener?.('change', onChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      mql?.removeEventListener?.('change', onChange)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    try {
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setIsStandalone(true)
    } finally {
      setDeferred(null)  // 프롬프트는 1회용
    }
  }, [deferred])

  return {
    isStandalone,
    platform,
    canPrompt: !!deferred,
    promptInstall,
    ready,
  }
}
