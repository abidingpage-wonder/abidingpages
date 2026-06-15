import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 50

// GET /api/cron/send-reply-notifications — Vercel Cron (10분 간격)
// visible_at이 도래했지만 아직 알림을 보내지 않은 답장에 푸시 발송
export async function GET(req: Request) {
  // Vercel Cron은 CRON_SECRET을 Bearer 토큰으로 전달
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const due = await prisma.reply.findMany({
      where: { notifiedAt: null, visibleAt: { lte: now } },
      select: { id: true, letterId: true, userId: true, petId: true },
      orderBy: { visibleAt: 'asc' },
      take: BATCH_LIMIT,
    })
    if (due.length === 0) return NextResponse.json({ sent: 0 })

    const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY
    const vapidEmail   = process.env.VAPID_EMAIL ?? 'mailto:abiding.pages26@gmail.com'
    const canPush      = !!vapidPublic && !!vapidPrivate
    if (canPush) webpush.setVapidDetails(vapidEmail, vapidPublic!, vapidPrivate!)

    const [subscriptions, pets] = await Promise.all([
      prisma.pushSubscription.findMany({
        where: { userId: { in: [...new Set(due.map(r => r.userId))] } },
        select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
      }),
      prisma.pet.findMany({
        where: { id: { in: [...new Set(due.map(r => r.petId))] } },
        select: { id: true, name: true },
      }),
    ])
    const subsByUser = new Map<string, typeof subscriptions>()
    for (const sub of subscriptions) {
      const list = subsByUser.get(sub.userId) ?? []
      list.push(sub)
      subsByUser.set(sub.userId, list)
    }
    const petNameById = new Map(pets.map(p => [p.id, p.name]))

    let pushed = 0
    for (const reply of due) {
      const subs = subsByUser.get(reply.userId) ?? []
      if (canPush && subs.length > 0) {
        const payload = JSON.stringify({
          title: `${petNameById.get(reply.petId) ?? '아이'}의 편지가 도착했어요 🌿`,
          body:  '지금 확인해보세요',
          url:   `/reply/${reply.letterId}`,
        })
        const results = await Promise.allSettled(
          subs.map(sub =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            )
          )
        )
        // 만료된 구독(404/410) 정리
        const expiredIds = subs.filter((_, i) => {
          const r = results[i]
          if (r.status !== 'rejected') return false
          const code = (r.reason as { statusCode?: number })?.statusCode
          return code === 404 || code === 410
        }).map(s => s.id)
        if (expiredIds.length > 0) {
          await prisma.pushSubscription.deleteMany({ where: { id: { in: expiredIds } } })
        }
        if (results.some(r => r.status === 'fulfilled')) pushed++
      }
    }

    // 푸시 성공 여부와 무관하게 발송 처리 (구독 없는 유저도 답장은 노출됨, 재시도 무한루프 방지)
    await prisma.reply.updateMany({
      where: { id: { in: due.map(r => r.id) } },
      data: { notifiedAt: now },
    })

    return NextResponse.json({ sent: due.length, pushed })
  } catch (err) {
    console.error('[GET /api/cron/send-reply-notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
