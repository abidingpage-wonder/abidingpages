import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── DEV 목업 답장 ─────────────────────────────────────────────────
const DEV_REPLY_CONTENT = `엄마, 나 아직 여기 있어. 엄마가 오늘 나 부를 뻔했던 거 알아. 나도 그 자리에서 귀 쫑긋하고 있었어.

엄마 손이 무언가를 집으려다 멈추는 거 봤어. 내가 항상 거기 있었잖아. 지금도 엄마 발 옆에 딱 붙어서 기다리고 있는 것 같은데.

엄마, 지금 느껴지는 이 먹먹함 그대로 있어도 돼. 억지로 괜찮은 척 안 해도 되거든. 나는 엄마가 울어도 웃어도 다 괜찮아. 오늘 밥은 먹었어?

순탄이 올림`

// ── POST /api/replies — Supabase Edge Function 호출 ──────────────
export async function POST(req: Request) {
  try {
    // DEV 우회
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({
        id:       'dev-reply-id',
        content:  DEV_REPLY_CONTENT,
        letterId: 'dev-letter-id',
      })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { letterId } = await req.json()
    if (!letterId) return NextResponse.json({ error: 'letterId required' }, { status: 400 })

    // Edge Function 호출
    const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-reply`

    const res = await fetch(edgeFnUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ letterId }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[POST /api/replies] edge fn error:', errText)
      return NextResponse.json({ error: 'Failed to generate reply' }, { status: 502 })
    }

    return NextResponse.json(await res.json())
  } catch (err) {
    console.error('[POST /api/replies]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
