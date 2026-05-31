import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { emotionTag, letterId } = await req.json()
    if (!emotionTag) return NextResponse.json({ error: 'emotionTag required' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) {
      return NextResponse.json({ error: 'No active pet' }, { status: 404 })
    }

    const log = await prisma.emotionLog.create({
      data: {
        userId: user.id,
        petId: dbUser.activePetId,
        emotionTag,
        ...(letterId ? { letterId } : {}),
      },
    })

    return NextResponse.json({ id: log.id })
  } catch (err) {
    console.error('[POST /api/emotions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
