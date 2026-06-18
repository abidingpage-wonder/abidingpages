import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const WEEK_KEYWORDS: Record<number, string> = {
  1: '머무름', 2: '쏟아냄', 3: '기억함',
  4: '고백함', 5: '놓아줌', 6: '받아들임', 7: '이어감',
}

// GET /api/archive/timeline — 편지+답장 타임라인
export async function GET() {
  try {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devPet = await prisma.pet.findFirst({ select: { id: true, name: true } })
      return NextResponse.json({
        isPro: false,   // DEV: free 유저 테스트
        items: [
          {
            week: 1, weekKeyword: '머무름',
            entries: [
              {
                type: 'letter',
                id: 'l1', letterId: 'l1',
                date: '2024.05.21', time: '22:47',
                content: '오늘 네가 생각났어. 밥 먹으러 가던 그 길에서 네 발자국이 생각나더라.',
                imageUrls: ['https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&q=80'],
                emotionTag: 'missing',
                category: '감각의 기억',
              },
              {
                type: 'reply',
                id: 'r1', letterId: 'l1',
                date: '2024.05.22', time: '09:18',
                content: '엄마, 나 거기서 항상 냄새 맡던 거 기억해? 너랑 같이 걷던 그 길, 정말 좋았어.',
                imageUrls: [],
              },
              {
                type: 'letter',
                id: 'l2', letterId: 'l2',
                date: '2024.05.23', time: '21:10',
                content: '요즘 날씨가 참 좋아. 네가 좋아하던 봄이야.',
                imageUrls: [],
                emotionTag: 'missing',
                category: '감각의 기억',
              },
              {
                type: 'reply',
                id: 'r2', letterId: 'l2',
                date: '2024.05.24', time: '08:36',
                content: '맞아, 나도 봄 제일 좋아했지!',
                imageUrls: [],
              },
              {
                type: 'letter',
                id: 'l3', letterId: 'l3',
                date: '2024.05.25', time: '21:30',
                content: '바람이 솔솔 불어서 네가 더 생각나는 저녁이야.',
                imageUrls: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80'],
                emotionTag: 'sad',
                category: '감각의 기억',
              },
              {
                type: 'reply',
                id: 'r3', letterId: 'l3',
                date: '2024.05.26', time: '07:45',
                content: '나랑 같이 바다 보던 거 기억나?',
                imageUrls: [],
              },
              {
                type: 'letter',
                id: 'l4', letterId: 'l4',
                date: '2024.05.27', time: '19:02',
                content: '오늘은 유난히 네 빈자리가 크게 느껴져.',
                imageUrls: [],
                emotionTag: 'lonely',
                category: '존재의 무게',
              },
              {
                type: 'reply',
                id: 'r4', letterId: 'l4',
                date: '2024.05.28', time: '06:22',
                content: '엄마, 너무 슬퍼하지 마. 나는 항상 여기 있을게.',
                imageUrls: [],
              },
            ],
          },
        ],
        petName: devPet?.name ?? '순탄이',
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activePetId: true, plan: true, planExpires: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No pet' }, { status: 404 })

    const pet = await prisma.pet.findUnique({
      where: { id: dbUser.activePetId },
      select: { name: true },
    })

    // 편지 + 답장 조회
    const letters = await prisma.letter.findMany({
      where: { petId: dbUser.activePetId, userId: user.id },
      include: { reply: { select: { id: true, content: true, generatedAt: true, visibleAt: true, replyType: true } } },
      orderBy: { createdAt: 'asc' },
    })
    const now = new Date()

    // 주차별 그룹핑
    const weekMap = new Map<number, {
      week: number; weekKeyword: string; entries: object[]
    }>()

    for (const letter of letters) {
      const week = letter.week
      if (!weekMap.has(week)) {
        weekMap.set(week, {
          week,
          weekKeyword: WEEK_KEYWORDS[week] ?? `${week}주차`,
          entries: [],
        })
      }
      const group = weekMap.get(week)!

      const toKST = (d: Date) => new Date(d.getTime() + 9 * 60 * 60 * 1000)
      const fmtDate = (d: Date) => {
        const k = toKST(d)
        const y = k.getUTCFullYear(), m = String(k.getUTCMonth()+1).padStart(2,'0'), dd = String(k.getUTCDate()).padStart(2,'0')
        return `${y}.${m}.${dd}`
      }
      const fmtTime = (d: Date) => {
        const k = toKST(d)
        return `${String(k.getUTCHours()).padStart(2,'0')}:${String(k.getUTCMinutes()).padStart(2,'0')}`
      }

      group.entries.push({
        type: 'letter',
        id: letter.id,
        letterId: letter.id,
        date: fmtDate(letter.createdAt),
        time: fmtTime(letter.createdAt),
        content: letter.content,
        imageUrls: letter.imageUrls,
        emotionTag: letter.emotionTag,
      })

      // 노출 시각 도래 전 답장은 타임라인에서 숨김 (visibleAt null = 즉시 노출)
      if (letter.reply && (!letter.reply.visibleAt || letter.reply.visibleAt <= now)) {
        group.entries.push({
          type: 'reply',
          id: letter.reply.id,
          letterId: letter.id,
          date: fmtDate(letter.reply.generatedAt),
          time: fmtTime(letter.reply.generatedAt),
          content: letter.reply.content,
          replyType: letter.reply.replyType,
          imageUrls: [],
        })
      }
    }

    const isPro = dbUser?.plan === 'pro' &&
      (!dbUser.planExpires || new Date(dbUser.planExpires) > new Date())

    return NextResponse.json({
      isPro,
      items: Array.from(weekMap.values()),
      petName: pet?.name ?? '',
    }, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (err) {
    console.error('[GET /api/archive/timeline]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
