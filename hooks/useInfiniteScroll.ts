'use client'
import { useEffect, useRef, useState } from 'react'

export function useInfiniteScroll(total: number, initial: number, increment: number) {
  const [visible, setVisible] = useState(initial)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const hasMore = visible < total

  useEffect(() => {
    setVisible(initial)
  }, [total, initial])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visible < total && !loading) {
          setLoading(true)
          setTimeout(() => {
            setVisible(v => Math.min(v + increment, total))
            setLoading(false)
          }, 400)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, total, loading, increment])

  return { visible, loading, hasMore, sentinelRef }
}
