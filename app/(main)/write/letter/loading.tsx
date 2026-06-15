import { FullPageSpinner } from '@/components/ui/Spinner'

const NIGHT_BG = 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)'

export default function Loading() {
  return (
    <div style={{ minHeight: '100dvh', background: NIGHT_BG }}>
      <FullPageSpinner dark minHeight="100dvh" />
    </div>
  )
}
