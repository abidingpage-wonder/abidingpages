import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import { sendReplyArrivedEmail, emailEnabled } from '@/lib/email'

export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 50

// GET /api/cron/send-reply-notifications — Supabase pg_cron 이 10분 간격 호출
// (Vercel Hobby cron 제약으로 vercel.json cron 제거 → Supabase pg_cron+pg_net 으로 대체.
//  supabase/sql/2026-06-15-reply-notify-cron.sql 참고)
// visible_at이 도래했지만 아직 알림을 보내지 않은 답장에 푸시 발송
export async function GET(req: Request) {
  // 호출자는 CRON_SECRET을 Bearer 토큰으로 전달 (Supabase Vault 에 동일 값 보관)
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

    const userIds = [...new Set(due.map(r => r.userId))]
    const [subscriptions, pets, users] = await Promise.all([
      prisma.pushSubscription.findMany({
        where: { userId: { in: userIds } },
        select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
      }),
      prisma.pet.findMany({
        where: { id: { in: [...new Set(due.map(r => r.petId))] } },
        select: { id: true, name: true },
      }),
      // 이메일 백업용 — 푸시 구독이 없거나 실패한 유저에게 메일 발송
      prisma.user.findMany({
        where: { id: { in: userIds }, deletedAt: null },
        select: { id: true, email: true },
      }),
    ])
    const subsByUser = new Map<string, typeof subscriptions>()
    for (const sub of subscriptions) {
      const list = subsByUser.get(sub.userId) ?? []
      list.push(sub)
      subsByUser.set(sub.userId, list)
    }
    const petNameById = new Map(pets.map(p => [p.id, p.name]))
    const emailByUser = new Map(users.map(u => [u.id, u.email]))

    let pushed = 0
    let mailed = 0
    for (const reply of due) {
      const subs = subsByUser.get(reply.userId) ?? []
      const petName = petNameById.get(reply.petId) ?? '아이'
      let pushOk = false

      if (canPush && subs.length > 0) {
        const payload = JSON.stringify({
          title: `${petName}의 편지가 도착했어요 🌿`,
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
        pushOk = results.some(r => r.status === 'fulfilled')
        if (pushOk) pushed++
      }

      // 백업: 푸시가 안 갔고(미구독 또는 전부 실패) 이메일이 있으면 메일 발송
      if (!pushOk && emailEnabled()) {
        const email = emailByUser.get(reply.userId)
        if (email) {
          const ok = await sendReplyArrivedEmail(email, petName, reply.letterId)
          if (ok) mailed++
        }
      }
    }

    // 푸시/메일 성공 여부와 무관하게 발송 처리 (재시도 무한루프 방지)
    await prisma.reply.updateMany({
      where: { id: { in: due.map(r => r.id) } },
      data: { notifiedAt: now },
    })

    return NextResponse.json({ sent: due.length, pushed, mailed })
  } catch (err) {
    console.error('[GET /api/cron/send-reply-notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
