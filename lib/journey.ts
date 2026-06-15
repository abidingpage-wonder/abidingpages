import { prisma } from '@/lib/prisma'

export const WEEK_UNLOCK_THRESHOLD = 3  // 고유 비쉼표 질문 3개 완료 시 다음 주차 잠금 해제 가능
export const WEEK_TOTAL_NON_REST   = 6  // 주당 비쉼표 질문 수 (7일 중 쉼표 1개 제외)
export const MAX_WEEK              = 7

// 해당 주차의 고유 비쉼표 완료 수 조회
export async function getUniqueNonRestCount(petId: string, week: number): Promise<number> {
  const letters = await prisma.letter.findMany({
    where: { petId, week, questionId: { not: null } },
    select: { questionId: true },
  })
  const restIds = new Set(
    (await prisma.question.findMany({ where: { week, isRest: true }, select: { id: true } })).map(q => q.id)
  )
  return new Set(letters.map(l => l.questionId!).filter(id => !restIds.has(id))).size
}
