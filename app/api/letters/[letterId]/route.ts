import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const WEEK_KEYWORDS: Record<number, string> = {
  1: '머무름', 2: '쏟아냄', 3: '기억함',
  4: '고백함', 5: '놓아줌', 6: '받아들임', 7: '이어감',
}

// GET /api/letters/[letterId] — 내가 쓴 편지 조회
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const { letterId } = await params

    // DEV 목업
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const mockData: Record<string, object> = {
        l1: {
          id: 'l1',
          content: '오늘 네가 생각났어. 밥 먹으러 가던 그 길에서 네 발자국이 생각나더라.',
          imageUrls: [
            'https://picsum.photos/seed/dog1/600/600',
            'https://picsum.photos/seed/dog2/600/600',
            'https://picsum.photos/seed/dog3/600/600',
          ],
          sentAt: '2024-05-21T22:47:00.000Z',
          week: 1, weekKeyword: WEEK_KEYWORDS[1],
          category: '감각의 기억',
          questionContent: '오늘 하루 중 아이가 가장 먼저 떠오른 순간은 언제였나요?',
          petName: '순탄이',
          ownerNickname: '엄마',
        },
        l2: {
          id: 'l2',
          content: '요즘 날씨가 참 좋아. 네가 좋아하던 봄이야.',
          imageUrls: [],
          sentAt: '2024-05-23T21:10:00.000Z',
          week: 1, weekKeyword: WEEK_KEYWORDS[1],
          category: '감각의 기억',
          questionContent: '아이와 함께했던 계절의 기억을 떠올려보세요.',
          petName: '순탄이',
          ownerNickname: '엄마',
        },
        l3: {
          id: 'l3',
          content: '바람이 솔솔 불어서 네가 더 생각나는 저녁이야.',
          imageUrls: ['https://picsum.photos/seed/cat1/600/600'],
          sentAt: '2024-05-25T21:30:00.000Z',
          week: 1, weekKeyword: WEEK_KEYWORDS[1],
          category: '감각의 기억',
          questionContent: null,
          petName: '순탄이',
          ownerNickname: '엄마',
        },
        l5: {
          id: 'l5',
          content: '오늘 같이 걷던 공원 벤치에 앉아봤어. 네가 항상 옆에 있던 자리.',
          imageUrls: [
            'https://picsum.photos/seed/park1/600/600',
            'https://picsum.photos/seed/park2/600/600',
          ],
          sentAt: '2024-05-26T14:00:00.000Z',
          week: 1, weekKeyword: WEEK_KEYWORDS[1],
          category: '감각의 기억',
          questionContent: '아이와 함께 자주 가던 장소가 있나요?',
          petName: '순탄이',
          ownerNickname: '엄마',
        },
        l4: {
          id: 'l4',
          content: '오늘은 유난히 네 빈자리가 크게 느껴져.',
          imageUrls: [],
          sentAt: '2024-05-27T19:02:00.000Z',
          week: 1, weekKeyword: WEEK_KEYWORDS[1],
          category: '존재의 무게',
          questionContent: '아이가 없는 자리가 가장 크게 느껴지는 순간은 어떤 때인가요?',
          petName: '순탄이',
          ownerNickname: '엄마',
        },
      }
      const data = mockData[letterId] ?? mockData['l1']
      return NextResponse.json(data)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      include: {
        question: { select: { content: true, category: true } },
      },
    })

    if (!letter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (letter.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const pet = await prisma.pet.findUnique({
      where: { id: letter.petId },
      select: { name: true, ownerNickname: true },
    })

    return NextResponse.json({
      id: letter.id,
      content: letter.content,
      imageUrls: letter.imageUrls ?? [],
      sentAt: letter.createdAt.toISOString(),
      week: letter.week,
      weekKeyword: WEEK_KEYWORDS[letter.week] ?? null,
      category: letter.question?.category ?? null,
      questionContent: letter.question?.content ?? null,
      petName: pet?.name ?? '',
      ownerNickname: pet?.ownerNickname ?? '보호자님',
    })
  } catch (err) {
    console.error('[GET /api/letters/[letterId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
