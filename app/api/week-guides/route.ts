import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const weekGuides = await prisma.weekGuide.findMany({ orderBy: { week: 'asc' } })
    return NextResponse.json(weekGuides, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    })
  } catch (e) {
    console.error('[GET /api/week-guides]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
