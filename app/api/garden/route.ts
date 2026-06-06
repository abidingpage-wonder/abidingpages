import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/garden — 공개 펫 목록 + 스티커 집계 + 메시지 수
export async function GET() {
  try {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const [pets, messageCount] = await Promise.all([
        prisma.pet.findMany({
          where: { gardenPublic: true },
          select: { id: true, name: true, birthDate: true, deathDate: true, profileImageUrl: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.gardenMessage.count({ where: { isHidden: false } }),
      ])

      const petCards = await Promise.all(pets.map(async (pet) => {
        const stickers = await prisma.gardenSticker.groupBy({
          by: ['stickerType'],
          where: { toPetId: pet.id },
          _count: { stickerType: true },
        })
        const stickerMap: Record<string, number> = {}
        for (const s of stickers) stickerMap[s.stickerType] = s._count.stickerType

        const birth = pet.birthDate ? new Date(pet.birthDate).toLocaleDateString('ko', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : ''
        const death = pet.deathDate ? new Date(pet.deathDate).toLocaleDateString('ko', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : ''

        return {
          id: pet.id,
          name: pet.name,
          span: birth && death ? `${birth} — ${death}` : '',
          quote: '오늘도 보고 싶어, 사랑해',
          tone: '#dcc6ee',
          face: '🐾',
          heartColor: '#b787e0',
          candle: stickerMap['candle'] ?? 0,
          flower: stickerMap['flower'] ?? 0,
          heart: stickerMap['heart'] ?? 0,
          supports: Object.values(stickerMap).reduce((a, b) => a + b, 0),
        }
      }))

      return NextResponse.json({ pets: petCards, messageCount })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [pets, messageCount] = await Promise.all([
      prisma.pet.findMany({
        where: { gardenPublic: true },
        select: { id: true, name: true, birthDate: true, deathDate: true, profileImageUrl: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.gardenMessage.count({ where: { isHidden: false } }),
    ])

    const petCards = await Promise.all(pets.map(async (pet) => {
      const stickers = await prisma.gardenSticker.groupBy({
        by: ['stickerType'],
        where: { toPetId: pet.id },
        _count: { stickerType: true },
      })
      const stickerMap: Record<string, number> = {}
      for (const s of stickers) stickerMap[s.stickerType] = s._count.stickerType

      const birth = pet.birthDate ? new Date(pet.birthDate).toLocaleDateString('ko', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : ''
      const death = pet.deathDate ? new Date(pet.deathDate).toLocaleDateString('ko', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '') : ''

      return {
        id: pet.id,
        name: pet.name,
        span: birth && death ? `${birth} — ${death}` : '',
        quote: '오늘도 보고 싶어, 사랑해',
        tone: '#dcc6ee',
        face: '🐾',
        heartColor: '#b787e0',
        candle: stickerMap['candle'] ?? 0,
        flower: stickerMap['flower'] ?? 0,
        heart: stickerMap['heart'] ?? 0,
        supports: Object.values(stickerMap).reduce((a, b) => a + b, 0),
      }
    }))

    return NextResponse.json({ pets: petCards, messageCount })
  } catch (e) {
    console.error('[GET /api/garden]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
