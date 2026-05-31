import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    // 파일 크기 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${user.id}-${Date.now()}.${ext}`
    const filePath = `pets/profile/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from('abiding-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error('[upload pet-photo]', error)
      return NextResponse.json({ error: '업로드 실패' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('abiding-media')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[upload pet-photo]', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
