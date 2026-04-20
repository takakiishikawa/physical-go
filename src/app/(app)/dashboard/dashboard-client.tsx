'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronRight, TrendingUp, Trophy, Video, Scale,
  Dumbbell, Activity, Zap, ArrowUpToLine, Plus, Star
} from 'lucide-react'
import type { Exercise, PersonalRecord, FormFeedback, BodyRecord } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  exercises: Exercise[]
  personalRecords: PersonalRecord[]
  recentFeedback: (FormFeedback & { form_sessions?: { exercises?: Exercise } }) | null
  latestBodyRecord: BodyRecord | null
  userName: string
}

const EXERCISE_META: Record<string, { icon: React.ElementType; colorVar: string }> = {
  half_deadlift: { icon: Dumbbell,       colorVar: 'var(--color-exercise-deadlift)' },
  pull_up:       { icon: ArrowUpToLine,  colorVar: 'var(--color-exercise-pullup)' },
  bench_press:   { icon: Zap,            colorVar: 'var(--color-exercise-benchpress)' },
}

export function DashboardClient({ exercises, personalRecords, recentFeedback, latestBodyRecord, userName }: Props) {
  const chartDataByExercise = useMemo(() => {
    return exercises.map(ex => {
      const records = personalRecords
        .filter(r => r.exercise_id === ex.id)
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      const data = records.map(r => ({
        date: format(new Date(r.recorded_at), 'M/d'),
        value: ex.name === 'pull_up' ? r.reps : r.weight_kg,
        isPR: r.is_pr,
      }))
      const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift
      const latestVal = data.length > 0 ? Number(data[data.length - 1].value) : null
      const bestVal = data.length > 0 ? Math.max(...data.map(d => Number(d.value) || 0)) : null
      return { exercise: ex, data, ...meta, latestVal, bestVal }
    })
  }, [exercises, personalRecords])

  const totalPRs = personalRecords.filter(r => r.is_pr).length
  const totalSessions = personalRecords.length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">おかえり</p>
          <h1 className="text-2xl font-semibold mt-0.5">{userName.split(' ')[0]}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/record">
            <Button size="sm" className="gap-1.5 hidden md:flex">
              <Plus className="w-3.5 h-3.5" />
              記録する
            </Button>
          </Link>
          <Link href="/form">
            <Button size="sm" variant="outline" className="gap-1.5 hidden md:flex">
              <Video className="w-3.5 h-3.5" />
              フォームチェック
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Trophy}
          label="自己ベスト更新"
          value={totalPRs}
          unit="回"
          iconStyle={{ color: 'var(--color-warning)' }}
        />
        <StatCard
          icon={Activity}
          label="総記録数"
          value={totalSessions}
          unit="件"
          iconClassName="text-primary"
        />
        {latestBodyRecord?.weight_kg && (
          <StatCard
            icon={Scale}
            label="体重"
            value={latestBodyRecord.weight_kg}
            unit="kg"
            iconClassName="text-success"
            muted
          />
        )}
        {latestBodyRecord?.body_fat_pct && (
          <StatCard
            icon={TrendingUp}
            label="体脂肪率"
            value={latestBodyRecord.body_fat_pct}
            unit="%"
            iconClassName="text-muted-foreground"
            muted
          />
        )}
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Charts — 2/3 width on desktop */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              自己ベスト推移
            </h2>
            <Link href="/record">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                すべての記録 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {chartDataByExercise.map(({ exercise, data, icon: Icon, colorVar, bestVal }) => (
              <Card key={exercise.id}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: colorVar }} />
                      <CardTitle className="text-sm font-medium">{exercise.name_ja}</CardTitle>
                    </div>
                    {bestVal !== null && (
                      <Badge variant="outline" className="text-xs font-medium">
                        {exercise.name === 'pull_up' ? `最高 ${bestVal}回` : `最高 ${bestVal}kg`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  {data.length === 0 ? (
                    <div className="h-20 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">まだ記録がありません</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={110}>
                      <LineChart data={data} margin={{ top: 6, right: 12, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
                          formatter={(val) => [`${val}${exercise.name === 'pull_up' ? '回' : 'kg'}`, exercise.name_ja]}
                        />
                        <Line type="monotone" dataKey="value" stroke={colorVar} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: colorVar, stroke: 'white', strokeWidth: 2 }} />
                        {data.map((d, i) => d.isPR ? (
                          <ReferenceDot key={i} x={d.date} y={Number(d.value)} r={5} fill={colorVar} stroke="white" strokeWidth={2} />
                        ) : null)}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
              <Video className="w-4 h-4" />
              直近のフォームチェック
            </h2>
            {recentFeedback ? (
              <Link href={`/form/${recentFeedback.session_id}`}>
                <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary/10 text-primary border-0 text-xs">
                        {(recentFeedback as any).exercises?.name_ja}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(recentFeedback.created_at), 'M月d日', { locale: ja })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                      {recentFeedback.overall_comment}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      詳細を見る <ChevronRight className="w-3 h-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center space-y-2">
                  <Video className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">まだフォームチェックがありません</p>
                  <Link href="/form">
                    <Button size="sm" variant="outline" className="text-xs mt-1 h-7">チェックする</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick actions (mobile only) */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            <Link href="/record">
              <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                <CardContent className="p-3 text-center">
                  <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs font-medium text-primary">記録する</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/form">
              <Card className="hover:border-primary/20 transition-colors cursor-pointer">
                <CardContent className="p-3 text-center">
                  <Video className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs font-medium">フォームチェック</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Exercise summary */}
          <div>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
              <Star className="w-4 h-4" />
              種目サマリー
            </h2>
            <div className="space-y-2">
              {chartDataByExercise.map(({ exercise, icon: Icon, colorVar, bestVal, latestVal }) => (
                <Card key={exercise.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" style={{ color: colorVar }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{exercise.name_ja}</p>
                      <p className="text-xs text-muted-foreground">
                        {bestVal !== null
                          ? `最高 ${bestVal}${exercise.name === 'pull_up' ? '回' : 'kg'}`
                          : '未記録'}
                      </p>
                    </div>
                    <Link href="/record">
                      <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, unit, iconClassName, iconStyle, muted }: {
  icon: React.ElementType
  label: string
  value: number
  unit: string
  iconClassName?: string
  iconStyle?: React.CSSProperties
  muted?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className={`w-4 h-4 mb-2 ${iconClassName ?? ''}`} style={iconStyle} />
        <p className={`text-2xl font-semibold ${muted ? 'text-foreground/50' : ''}`}>
          {value}<span className="text-sm font-normal ml-0.5 text-muted-foreground">{unit}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
