import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      select: { id: true, week: true, day: true, orderIndex: true, category: true, isRest: true },
      orderBy: { orderIndex: 'asc' },
    })
    return NextResponse.json(questions, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    })
  } catch (e) {
    console.error('[GET /api/questions/all]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
