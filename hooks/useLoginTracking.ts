'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { trackLoginCompleted, identifyUser } from '@/lib/analytics'

export function useLoginTracking(userId?: string) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const provider = searchParams.get('_lp')
    const isNew = searchParams.get('_ln')
    if (!provider) return

    trackLoginCompleted({ provider, is_new_user: isNew === '1' })

    if (userId) {
      identifyUser(userId, { signup_date: new Date().toISOString().slice(0, 10) })
    }

    // 파라미터 제거 (뒤로가기 시 재발송 방지)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('_lp')
    params.delete('_ln')
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
