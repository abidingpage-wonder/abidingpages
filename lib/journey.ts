import { prisma } from '@/lib/prisma'

export const WEEK_UNLOCK_THRESHOLD = 3  // 비쉼표 질문 3개 완료 시 다음 주차 잠금 해제
export const WEEK_TOTAL             = 7  // 주당 전체 질문 수 (쉼표 포함)
export const MAX_WEEK               = 7

// 해당 주차의 고유 완료 수 — 쉼표 포함 전체 (주차 완료·진행률 판단용)
export async function getUniqueCount(petId: string, week: number): Promise<number> {
  const letters = await prisma.letter.findMany({
    where: { petId, week, questionId: { not: null }, letterStatus: 'normal' },
    select: { questionId: true },
  })
  return new Set(letters.map(l => l.questionId!)).size
}

// 해당 주차의 고유 비쉼표 완료 수 — 잠금 해제 조건 판단용
export async function getNonRestCount(petId: string, week: number): Promise<number> {
  const letters = await prisma.letter.findMany({
    where: { petId, week, questionId: { not: null }, letterStatus: 'normal' },
    select: { questionId: true },
  })
  const restIds = new Set(
    (await prisma.question.findMany({ where: { week, isRest: true }, select: { id: true } })).map(q => q.id)
  )
  return new Set(letters.map(l => l.questionId!).filter(id => !restIds.has(id))).size
}
