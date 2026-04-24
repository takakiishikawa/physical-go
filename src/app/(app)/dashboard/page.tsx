import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [
    { data: exercises },
    { data: personalRecords },
  ] = await Promise.all([
    supabase.schema('physicalgo').from('exercises').select('*'),
    supabase
      .schema('physicalgo')
      .from('personal_records')
      .select('*, exercises(*)')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true }),
  ])

  return (
    <DashboardClient
      exercises={exercises ?? []}
      personalRecords={personalRecords ?? []}
    />
  )
}
