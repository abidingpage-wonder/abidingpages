import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { WEEK_TOTAL, MAX_WEEK } from '@/lib/journey'
import LetterEditor from './_components/LetterEditor'

interface Props {
  searchParams: Promise<{ emotion?: string; questionId?: string; free?: string }>
}

// ── 개발용 목업 ────────────────────────────────────────────────────────
const DEV_MOCK = {
  petName: '순탄이',
  week: 1,
  day: 3,
}
// ──────────────────────────────────────────────────────────────────────

async function checkJourneyCompleted(petId: string, week: number): Promise<boolean> {
  if (week < MAX_WEEK) return false
  const week7Letters = await prisma.letter.findMany({
    where: { petId, week: MAX_WEEK, questionId: { not: null }, letterStatus: 'normal' },
    select: { questionId: true },
  })
  const uniqueAll = new Set(week7Letters.map(l => l.questionId!))
  return uniqueAll.size >= WEEK_TOTAL
}

export default async function LetterPage({ searchParams }: Props) {
  const { emotion, questionId, free } = await searchParams
  const freeEntry = free === '1'

  // DEV_BYPASS_AUTH=true 이면 DB에서 여정 상태 조회 후 렌더
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    const devPet = await prisma.pet.findFirst({ select: { id: true, name: true } })
    const devJourney = devPet
      ? await prisma.journeyProgress.findUnique({ where: { petId: devPet.id }, select: { currentWeek: true, currentDay: true } })
      : null
    const devWeek = devJourney?.currentWeek ?? DEV_MOCK.week
    const devDay  = devJourney?.currentDay  ?? DEV_MOCK.day
    const devJourneyCompleted = devPet ? await checkJourneyCompleted(devPet.id, devWeek) : false
    return (
      <LetterEditor
        petName={devPet?.name ?? DEV_MOCK.petName}
        week={devWeek}
        day={devDay}
        emotionTag={emotion ?? null}
        initialQuestionId={questionId ?? null}
        journeyCompleted={devJourneyCompleted}
        freeEntry={freeEntry}
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { activePetId: true },
  })
  if (!dbUser?.activePetId) redirect('/home')

  const pet = await prisma.pet.findUnique({
    where: { id: dbUser.activePetId },
    select: { id: true, name: true, ownerNickname: true },
  })
  if (!pet) redirect('/home')

  const journey = await prisma.journeyProgress.findUnique({
    where: { petId: pet.id },
    select: { currentWeek: true, currentDay: true },
  })

  const week = journey?.currentWeek ?? 1
  const day  = journey?.currentDay  ?? 1
  const journeyCompleted = await checkJourneyCompleted(pet.id, week)

  return (
    <LetterEditor
      petName={pet.name}
      week={week}
      day={day}
      emotionTag={emotion ?? null}
      initialQuestionId={questionId ?? null}
      journeyCompleted={journeyCompleted}
      freeEntry={freeEntry}
    />
  )
}
