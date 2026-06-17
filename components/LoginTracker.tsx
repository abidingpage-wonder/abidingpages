'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { trackLoginCompleted } from '@/lib/analytics'

export default function LoginTracker({
  provider,
  isNew,
}: {
  provider?: string
  isNew?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!provider) return
    trackLoginCompleted({ provider, is_new_user: isNew === '1' })
    // URL에서 파라미터 제거
    router.replace(pathname)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
