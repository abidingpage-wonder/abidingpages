import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // 기본값
  let petName = '아이'
  let dayCount = 1

  // ── 개발용 인증 우회 ──────────────────────────────────────────────
  // 배포 전 .env.local 에서 DEV_BYPASS_AUTH=false 로 변경 (또는 삭제)
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    petName = '순탄이'   // 목업 펫 이름
    dayCount = 22       // 목업 일차 (별이된 날 = 1일째)
  } else {
  // ────────────────────────────────────────────────────────────────
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { activePetId: true },
      })

      if (dbUser?.activePetId) {
        const pet = await prisma.pet.findUnique({
          where: { id: dbUser.activePetId },
          select: { name: true, diedAt: true },
        })

        if (pet) {
          petName = pet.name
          if (pet.diedAt) {
            const diffMs = Date.now() - new Date(pet.diedAt).getTime()
            dayCount = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1)
          }
        }
      }
    }
  } catch {
    // fallback — 기본값 사용
  }
  } // end DEV_BYPASS_AUTH else

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <TopBar petName={petName} dayCount={dayCount} />

      {/* 콘텐츠 영역: 상단 헤더(64px) + 하단 네비(80px) 여백 */}
      <main
        style={{
          flex: 1,
          paddingTop: 72,
          paddingBottom: 96,
          overflowY: 'auto',
        }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
