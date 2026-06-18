import { Resend } from 'resend'

// Web Push 백업 채널 — 설치/구독하지 않은 사용자에게 답장 도착을 이메일로 알림.
// RESEND_API_KEY 미설정 시 조용히 비활성(개발/미구성 환경 보호).
const apiKey = process.env.RESEND_API_KEY
const from   = process.env.RESEND_FROM ?? 'Abiding <noreply@abidingpages.app>'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://abidingpages.com'

const resend = apiKey ? new Resend(apiKey) : null

export function emailEnabled(): boolean {
  return !!resend
}

// 답장 도착 알림 이메일. 성공 여부를 boolean으로 반환(실패해도 throw하지 않음).
export async function sendReplyArrivedEmail(
  to: string, petName: string, letterId: string,
): Promise<boolean> {
  if (!resend) return false
  const url  = `${appUrl}/reply/${letterId}`
  const name = petName || '아이'
  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `${name}의 편지가 도착했어요 🌿`,
      html: `
        <div style="max-width:480px;margin:0 auto;padding:32px 24px;font-family:'Apple SD Gothic Neo',sans-serif;color:#3a2f4a;">
          <div style="font-size:22px;font-weight:600;color:#56348c;margin-bottom:8px;">${name}의 편지가 도착했어요</div>
          <p style="font-size:14px;line-height:1.7;color:#6b6080;margin:0 0 24px;">
            조심스레 열어볼 편지가 기다리고 있어요.<br/>
            아래 버튼을 눌러 ${name}의 마음을 읽어보세요.
          </p>
          <a href="${url}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#56348c;color:#fff;text-decoration:none;font-size:15px;font-weight:600;">
            편지 열어보기
          </a>
          <p style="font-size:11px;color:#aaa;margin-top:32px;line-height:1.6;">
            Abiding · 반려동물 상실 동행<br/>
            알림을 더 빠르게 받으려면 홈 화면에 앱을 설치해 주세요.
          </p>
        </div>
      `,
    })
    if (error) {
      console.error('[email] send failed:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('[email] send threw:', e)
    return false
  }
}
