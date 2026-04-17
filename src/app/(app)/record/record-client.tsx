'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dumbbell, Star, ChevronDown, ChevronUp, Trophy,
  ArrowUpToLine, Zap, TrendingUp, History, CheckCircle2, Plus
} from 'lucide-react'
import type { Exercise, PersonalRecord } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const ConfettiComponent = dynamic(() => import('./confetti'), { ssr: false })

interface Props {
  exercises: Exercise[]
  personalRecords: PersonalRecord[]
  userId: string
}

const EXERCISE_META: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  half_deadlift: { icon: Dumbbell,       color: '#2563B0', bg: 'bg-blue-50',    border: 'border-blue-200' },
  pull_up:       { icon: ArrowUpToLine,  color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  bench_press:   { icon: Zap,            color: '#8b5cf6', bg: 'bg-violet-50',  border: 'border-violet-200' },
}

export function RecordClient({ exercises, personalRecords, userId }: Props) {
  const router = useRouter()
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({})
  const [prResult, setPrResult] = useState<{
    isPR: boolean; prevValue?: number; newValue: number; exerciseName: string
  } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const getExerciseRecords = useCallback((exerciseId: string) => {
    return personalRecords.filter(r => r.exercise_id === exerciseId)
  }, [personalRecords])

  const getLatestPR = useCallback((exerciseId: string, isPullUp: boolean) => {
    const records = getExerciseRecords(exerciseId)
    if (records.length === 0) return null
    return isPullUp
      ? Math.max(...records.map(r => r.reps ?? 0))
      : Math.max(...records.map(r => r.weight_kg ?? 0))
  }, [getExerciseRecords])

  const handleSubmit = async () => {
    if (!selectedExercise) return
    const isPullUp = selectedExercise.name === 'pull_up'
    const value = isPullUp ? Number(repsInput) : Number(weightInput)
    if (!value || value <= 0) { toast.error('値を入力してください'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/record/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: selectedExercise.id,
          exercise_name: selectedExercise.name,
          weight_kg: isPullUp ? null : value,
          reps: isPullUp ? value : null,
          record_type: isPullUp ? 'max_reps' : 'weight_5rep',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const prevBest = getLatestPR(selectedExercise.id, isPullUp)
      setPrResult({ isPR: data.is_pr, prevValue: prevBest ?? undefined, newValue: value, exerciseName: selectedExercise.name_ja })
      if (data.is_pr) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000) }
      setWeightInput(''); setRepsInput('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? '記録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getChartData = (exerciseId: string, isPullUp: boolean) =>
    getExerciseRecords(exerciseId)
      .slice().sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(r => ({ date: format(new Date(r.recorded_at), 'M/d'), value: isPullUp ? r.reps : r.weight_kg }))

  return (
    <div className="px-4 md:px-8 pt-6 pb-6 max-w-6xl mx-auto space-y-6">
      {showConfetti && <ConfettiComponent />}

      <div>
        <h1 className="text-2xl font-semibold">自己ベスト記録</h1>
        <p className="text-sm text-muted-foreground mt-1">種目を選んで今日の記録を残そう</p>
      </div>

      {/* PR Banner */}
      {prResult && (
        <div className={`rounded-xl p-4 flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 ${
          prResult.isPR ? 'bg-amber-50 border-amber-200' : 'bg-primary/5 border-primary/20'
        }`}>
          {prResult.isPR ? (
            <>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700">自己ベスト更新</p>
                <p className="text-sm text-amber-600/80">
                  {prResult.prevValue
                    ? `${prResult.prevValue}${prResult.exerciseName === '懸垂' ? '回' : 'kg'} → ${prResult.newValue}${prResult.exerciseName === '懸垂' ? '回' : 'kg'}`
                    : `${prResult.newValue}${prResult.exerciseName === '懸垂' ? '回' : 'kg'} で記録開始`}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-foreground/70 font-medium">今日も積み上げた</p>
            </>
          )}
          <button onClick={() => setPrResult(null)} className="ml-auto text-muted-foreground p-1">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Exercise selection + form */}
        <div className="md:col-span-1 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">種目を選択</p>
            <div className="space-y-2">
              {exercises.map(ex => {
                const isPullUp = ex.name === 'pull_up'
                const latestPR = getLatestPR(ex.id, isPullUp)
                const isSelected = selectedExercise?.id === ex.id
                const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift
                const Icon = meta.icon
                return (
                  <button
                    key={ex.id}
                    onClick={() => { setSelectedExercise(isSelected ? null : ex); setPrResult(null) }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className={`w-9 h-9 ${meta.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ex.name_ja}</p>
                      {latestPR !== null && (
                        <p className="text-xs text-muted-foreground">
                          現在 {latestPR}{isPullUp ? '回' : 'kg'}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Record Form */}
          {selectedExercise && (() => {
            const isPullUp = selectedExercise.name === 'pull_up'
            const meta = EXERCISE_META[selectedExercise.name] ?? EXERCISE_META.half_deadlift
            const Icon = meta.icon
            return (
              <Card className="border border-primary/20 animate-in fade-in">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    {selectedExercise.name_ja} を記録
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  {isPullUp ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="reps" className="text-xs">回数</Label>
                      <div className="flex gap-2 items-center">
                        <Input id="reps" type="number" placeholder="例: 10" value={repsInput}
                          onChange={e => setRepsInput(e.target.value)} inputMode="numeric" className="h-11 text-lg" />
                        <span className="text-sm text-muted-foreground font-medium shrink-0">回</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="weight" className="text-xs">重量（5回以上できた最大重量）</Label>
                      <div className="flex gap-2 items-center">
                        <Input id="weight" type="number" placeholder="例: 80" value={weightInput}
                          onChange={e => setWeightInput(e.target.value)} inputMode="decimal" className="h-11 text-lg" />
                        <span className="text-sm text-muted-foreground font-medium shrink-0">kg</span>
                      </div>
                    </div>
                  )}
                  <Button onClick={handleSubmit} disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90">
                    {loading ? '記録中...' : (
                      <span className="flex items-center gap-2"><Plus className="w-4 h-4" />記録する</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })()}
        </div>

        {/* Right: History */}
        <div className="md:col-span-2 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4" />記録履歴
          </p>
          {exercises.map(ex => {
            const isPullUp = ex.name === 'pull_up'
            const records = getExerciseRecords(ex.id)
            const chartData = getChartData(ex.id, isPullUp)
            const isExpanded = showHistory[ex.id]
            const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift
            const Icon = meta.icon
            if (records.length === 0) return null
            return (
              <Card key={ex.id} className="border border-border/60">
                <CardContent className="p-4">
                  <button className="w-full flex items-center justify-between"
                    onClick={() => setShowHistory(prev => ({ ...prev, [ex.id]: !isExpanded }))}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 ${meta.bg} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                      </div>
                      <span className="font-medium text-sm">{ex.name_ja}</span>
                      <Badge variant="outline" className="text-xs">{records.length}件</Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 animate-in fade-in">
                      <ResponsiveContainer width="100%" height={130}>
                        <LineChart data={chartData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(val) => [`${val}${isPullUp ? '回' : 'kg'}`, ex.name_ja]} />
                          <Line type="monotone" dataKey="value" stroke={meta.color} strokeWidth={2} dot={{ r: 3, fill: meta.color }} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="divide-y divide-border/30">
                        {records.slice(0, 10).map(r => (
                          <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                            <span className="text-muted-foreground text-xs">
                              {format(new Date(r.recorded_at), 'M月d日', { locale: ja })}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{isPullUp ? `${r.reps}回` : `${r.weight_kg}kg`}</span>
                              {r.is_pr && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {exercises.every(ex => getExerciseRecords(ex.id).length === 0) && (
            <div className="text-center py-16 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">まだ記録がありません</p>
              <p className="text-xs mt-1">左から種目を選んで最初の記録をしよう</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
