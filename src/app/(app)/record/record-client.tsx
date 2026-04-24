'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Star, Trophy, Check, X, Pencil, Trash2, Plus } from 'lucide-react'
import { Section, EmptyState, Spinner } from '@takaki/go-design-system'
import { PageShell } from '@/components/layout/page-shell'
import type { Exercise, PersonalRecord } from '@/types'
import { EXERCISE_META, EXERCISE_NAMES } from '@/lib/exercise-meta'
import { todayStr, toLocalIso } from '@/lib/date-utils'
import { useDeleteConfirm } from '@/hooks/use-delete-confirm'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const ConfettiComponent = dynamic(() => import('./confetti'), { ssr: false })

interface Props {
  exercises: Exercise[]
  personalRecords: PersonalRecord[]
  userId: string
}

export function RecordClient({ exercises, personalRecords }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { confirmDelete } = useDeleteConfirm()

  const [activeTab, setActiveTab] = useState(exercises[0]?.id ?? '')
  const [recordDate, setRecordDate] = useState(todayStr())
  const [weightInput, setWeightInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const getExerciseRecords = useCallback((exerciseId: string) =>
    personalRecords.filter(r => r.exercise_id === exerciseId), [personalRecords])

  const getLatestPR = useCallback((exerciseId: string, isPullUp: boolean) => {
    const records = getExerciseRecords(exerciseId)
    if (records.length === 0) return null
    return isPullUp
      ? Math.max(...records.map(r => r.reps ?? 0))
      : Math.max(...records.map(r => r.weight_kg ?? 0))
  }, [getExerciseRecords])

  const handleSubmit = async (ex: Exercise) => {
    const isPullUp = ex.name === EXERCISE_NAMES.PULL_UP
    const value = isPullUp ? Number(repsInput) : Number(weightInput)
    if (!value || value <= 0) { toast.error('値を入力してください'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/record/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: ex.id,
          exercise_name: ex.name,
          weight_kg: isPullUp ? null : value,
          reps: isPullUp ? value : null,
          record_type: isPullUp ? 'max_reps' : 'weight_5rep',
          recorded_at: toLocalIso(recordDate),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const unit = isPullUp ? '回' : 'kg'
      if (data.is_pr) {
        const prevBest = getLatestPR(ex.id, isPullUp)
        const desc = prevBest
          ? `${prevBest}${unit} → ${value}${unit}`
          : `${value}${unit} でスタート`
        toast.success(`${ex.name_ja} 自己ベスト更新！🎉`, { description: desc })
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      } else {
        toast.success('今日も積み上げた 💪')
      }

      setWeightInput(''); setRepsInput('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? '記録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (r: PersonalRecord) => {
    setEditingId(r.id)
    setEditDate(format(new Date(r.recorded_at), 'yyyy-MM-dd'))
    setEditWeight(r.weight_kg?.toString() ?? '')
    setEditReps(r.reps?.toString() ?? '')
  }

  const handleUpdate = async (isPullUp: boolean) => {
    if (!editingId) return
    const value = isPullUp ? Number(editReps) : Number(editWeight)
    if (!value || value <= 0) { toast.error('値を入力してください'); return }
    setEditLoading(true)
    try {
      const { error } = await supabase.schema('physicalgo').from('personal_records').update({
        weight_kg: isPullUp ? null : value,
        reps: isPullUp ? value : null,
        recorded_at: toLocalIso(editDate),
      }).eq('id', editingId)
      if (error) throw error
      toast.success('更新しました')
      setEditingId(null)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? '更新に失敗しました')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    confirmDelete(async () => {
      const { error } = await supabase.schema('physicalgo').from('personal_records').delete().eq('id', id)
      if (error) { toast.error('削除に失敗しました'); return }
      toast.success('削除しました')
      router.refresh()
    })
  }

  return (
    <PageShell title="記録">
      {showConfetti && <ConfettiComponent />}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline">
          {exercises.map(ex => {
            const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift
            const Icon = meta.icon
            return (
              <TabsTrigger key={ex.id} value={ex.id} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: meta.colorVar }} />
                {ex.name_ja}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {exercises.map(ex => {
          const isPullUp = ex.name === EXERCISE_NAMES.PULL_UP
          const records = getExerciseRecords(ex.id)
          const sortedRecords = records
            .slice()
            .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())

          return (
            <TabsContent key={ex.id} value={ex.id} className="mt-5 space-y-5">
              <div className="bg-muted/40 rounded-lg border border-border p-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">記録日</Label>
                    <Input
                      type="date"
                      value={recordDate}
                      onChange={e => setRecordDate(e.target.value)}
                      className="h-9 w-36"
                      max={todayStr()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {isPullUp ? '回数' : '重量（5回以上できた最大重量）'}
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        placeholder={isPullUp ? '例: 10' : '例: 80'}
                        value={isPullUp ? repsInput : weightInput}
                        onChange={e => isPullUp ? setRepsInput(e.target.value) : setWeightInput(e.target.value)}
                        inputMode={isPullUp ? 'numeric' : 'decimal'}
                        className="h-9 w-28"
                      />
                      <span className="text-sm text-muted-foreground">{isPullUp ? '回' : 'kg'}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubmit(ex)}
                    disabled={loading}
                    size="sm"
                    className="gap-1.5 h-9"
                  >
                    {loading ? <><Spinner size="sm" />登録中...</> : <><Plus className="w-3.5 h-3.5" />ベストを登録する</>}
                  </Button>
                </div>
              </div>

              {records.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="w-10 h-10" />}
                  title="まだ記録がありません"
                  description="上のフォームから最初の記録を追加しよう"
                />
              ) : (
                <Section title="記録" description={`${records.length}件`} variant="bordered">
                  <div className="divide-y divide-border">
                    {sortedRecords.map(r => (
                      <div key={r.id}>
                        {editingId === r.id ? (
                          <div className="py-3 space-y-3">
                            <div className="flex flex-wrap gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">記録日</Label>
                                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                                  className="h-8 w-36 text-sm" max={todayStr()} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">{isPullUp ? '回数' : '重量(kg)'}</Label>
                                <div className="flex items-center gap-1">
                                  {isPullUp ? (
                                    <Input type="number" value={editReps} onChange={e => setEditReps(e.target.value)}
                                      inputMode="numeric" className="h-8 w-24 text-sm" />
                                  ) : (
                                    <Input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)}
                                      inputMode="decimal" className="h-8 w-24 text-sm" />
                                  )}
                                  <span className="text-xs text-muted-foreground">{isPullUp ? '回' : 'kg'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditingId(null)}>
                                <X className="w-3 h-3 mr-1" />キャンセル
                              </Button>
                              <Button size="sm" className="text-xs" onClick={() => handleUpdate(isPullUp)} disabled={editLoading}>
                                {editLoading ? <><Spinner size="sm" />更新中...</> : <><Check className="w-3 h-3" />保存</>}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between py-2.5">
                            <div className="flex items-center gap-2.5">
                              {r.is_pr && <Star className="w-3.5 h-3.5 text-warning shrink-0" />}
                              <span className="text-sm font-medium tabular-nums">
                                {isPullUp ? `${r.reps}回` : `${r.weight_kg}kg`}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(r.recorded_at), 'M/d(E)', { locale: ja })}
                              </span>
                            </div>
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={() => startEdit(r)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </PageShell>
  )
}
