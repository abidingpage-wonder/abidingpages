import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import LetterEditor from './_components/LetterEditor'

interface Props {
  searchParams: Promise<{ emotion?: string }>
}

export default async function LetterPage({ searchParams }: Props) {
  const { emotion } = await searchParams

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

  return (
    <LetterEditor
      petName={pet.name}
      week={week}
      day={day}
      emotionTag={emotion ?? null}
    />
  )
}
