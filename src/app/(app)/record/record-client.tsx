'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Star, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
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

const EXERCISE_ICONS: Record<string, string> = {
  half_deadlift: '🏋️',
  pull_up: '💪',
  bench_press: '🤸',
}

export function RecordClient({ exercises, personalRecords, userId }: Props) {
  const router = useRouter()
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({})
  const [prResult, setPrResult] = useState<{
    isPR: boolean
    prevValue?: number
    newValue: number
    exerciseName: string
  } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const getExerciseRecords = useCallback((exerciseId: string) => {
    return personalRecords.filter(r => r.exercise_id === exerciseId)
  }, [personalRecords])

  const getLatestPR = useCallback((exerciseId: string, isPullUp: boolean) => {
    const records = getExerciseRecords(exerciseId)
    if (records.length === 0) return null
    if (isPullUp) {
      return Math.max(...records.map(r => r.reps ?? 0))
    }
    return Math.max(...records.map(r => r.weight_kg ?? 0))
  }, [getExerciseRecords])

  const handleSubmit = async () => {
    if (!selectedExercise) return
    const isPullUp = selectedExercise.name === 'pull_up'
    const value = isPullUp ? Number(repsInput) : Number(weightInput)
    if (!value || value <= 0) {
      toast.error('値を入力してください')
      return
    }

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
      setPrResult({
        isPR: data.is_pr,
        prevValue: prevBest ?? undefined,
        newValue: value,
        exerciseName: selectedExercise.name_ja,
      })

      if (data.is_pr) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }

      setWeightInput('')
      setRepsInput('')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? '記録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getChartData = (exerciseId: string, isPullUp: boolean) => {
    return getExerciseRecords(exerciseId)
      .slice()
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(r => ({
        date: format(new Date(r.recorded_at), 'M/d'),
        value: isPullUp ? r.reps : r.weight_kg,
      }))
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-2xl mx-auto">
      {showConfetti && <ConfettiComponent />}

      <div>
        <h1 className="text-2xl font-normal">
          自己ベスト記録
        </h1>
        <p className="text-sm text-muted-foreground mt-1">種目を選んで記録しよう</p>
      </div>

      {/* PR Result Banner */}
      {prResult && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            prResult.isPR
              ? 'bg-accent/10 border border-accent/30'
              : 'bg-primary/5 border border-primary/20'
          }`}
        >
          {prResult.isPR ? (
            <>
              <Trophy className="w-8 h-8 text-accent shrink-0" />
              <div>
                <p className="font-semibold text-accent">新記録！</p>
                <p className="text-sm text-foreground/70">
                  {prResult.prevValue
                    ? `${prResult.prevValue}${prResult.exerciseName === '懸垂' ? '回' : 'kg'} → ${prResult.newValue}${prResult.exerciseName === '懸垂' ? '回' : 'kg'}`
                    : `${prResult.newValue}${prResult.exerciseName === '懸垂' ? '回' : 'kg'} で記録開始！`
                  }
                </p>
              </div>
            </>
          ) : (
            <>
              <Dumbbell className="w-6 h-6 text-primary shrink-0" />
              <p className="text-sm text-foreground/70">今日も積み上げた 💪</p>
            </>
          )}
          <button
            onClick={() => setPrResult(null)}
            className="ml-auto text-muted-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Exercise Selection */}
      <div className="grid grid-cols-3 gap-3">
        {exercises.map(ex => {
          const isPullUp = ex.name === 'pull_up'
          const latestPR = getLatestPR(ex.id, isPullUp)
          const isSelected = selectedExercise?.id === ex.id
          return (
            <button
              key={ex.id}
              onClick={() => {
                setSelectedExercise(isSelected ? null : ex)
                setPrResult(null)
              }}
              className={`rounded-xl p-3 border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="text-2xl mb-1">{EXERCISE_ICONS[ex.name]}</div>
              <p className="text-xs font-medium leading-tight">{ex.name_ja}</p>
              {latestPR !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {latestPR}{isPullUp ? '回' : 'kg'}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Record Form */}
      {selectedExercise && (
        <Card className="border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{EXERCISE_ICONS[selectedExercise.name]}</span>
              <h2 className="font-semibold">{selectedExercise.name_ja}</h2>
            </div>

            {selectedExercise.name === 'pull_up' ? (
              <div className="space-y-1">
                <Label htmlFor="reps">回数</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="reps"
                    type="number"
                    placeholder="例: 10"
                    value={repsInput}
                    onChange={e => setRepsInput(e.target.value)}
                    className="text-lg h-12"
                    inputMode="numeric"
                  />
                  <span className="text-muted-foreground font-medium">回</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="weight">重量（5回以上できた最大重量）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weight"
                    type="number"
                    placeholder="例: 80"
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    className="text-lg h-12"
                    inputMode="decimal"
                  />
                  <span className="text-muted-foreground font-medium">kg</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
            >
              {loading ? '記録中...' : '記録する'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History per exercise */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">記録履歴</h2>
        {exercises.map(ex => {
          const isPullUp = ex.name === 'pull_up'
          const records = getExerciseRecords(ex.id)
          const chartData = getChartData(ex.id, isPullUp)
          const isExpanded = showHistory[ex.id]
          if (records.length === 0) return null
          return (
            <Card key={ex.id} className="border border-border/50">
              <CardContent className="p-4">
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => setShowHistory(prev => ({ ...prev, [ex.id]: !isExpanded }))}
                >
                  <div className="flex items-center gap-2">
                    <span>{EXERCISE_ICONS[ex.name]}</span>
                    <span className="font-medium text-sm">{ex.name_ja}</span>
                    <Badge variant="outline" className="text-xs">
                      {records.length}件
                    </Badge>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-3 animate-in fade-in">
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          formatter={(val) => [`${val}${isPullUp ? '回' : 'kg'}`, ex.name_ja]}
                        />
                        <Line type="monotone" dataKey="value" stroke="#2563B0" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="space-y-1.5">
                      {records.slice(0, 8).map(r => (
                        <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-muted-foreground">
                            {format(new Date(r.recorded_at), 'M月d日', { locale: ja })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {isPullUp ? `${r.reps}回` : `${r.weight_kg}kg`}
                            </span>
                            {r.is_pr && <Star className="w-3 h-3 fill-accent text-accent" />}
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
      </div>
    </div>
  )
}
