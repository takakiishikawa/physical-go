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
import { ChevronRight, Star, TrendingUp } from 'lucide-react'
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

const EXERCISE_COLORS: Record<string, string> = {
  half_deadlift: '#2563B0',
  pull_up: '#10b981',
  bench_press: '#8b5cf6',
}

export function DashboardClient({ exercises, personalRecords, recentFeedback, latestBodyRecord, userName }: Props) {
  const chartDataByExercise = useMemo(() => {
    return exercises.map(ex => {
      const records = personalRecords.filter(r => r.exercise_id === ex.id)
      const data = records.map(r => ({
        date: format(new Date(r.recorded_at), 'M/d'),
        value: ex.name === 'pull_up' ? r.reps : r.weight_kg,
        isPR: r.is_pr,
      }))
      return { exercise: ex, data, color: EXERCISE_COLORS[ex.name] ?? '#2563B0' }
    })
  }, [exercises, personalRecords])

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm">おかえり</p>
        <h1 className="text-2xl font-normal">
          {userName.split(' ')[0]}
        </h1>
      </div>

      {/* Body Data Summary */}
      {latestBodyRecord && (
        <Card className="border-0 bg-muted/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                {latestBodyRecord.weight_kg && (
                  <div>
                    <p className="text-xs text-muted-foreground">体重</p>
                    <p className="text-lg font-semibold text-foreground/70">{latestBodyRecord.weight_kg}<span className="text-xs ml-0.5">kg</span></p>
                  </div>
                )}
                {latestBodyRecord.body_fat_pct && (
                  <div>
                    <p className="text-xs text-muted-foreground">体脂肪率</p>
                    <p className="text-lg font-semibold text-foreground/70">{latestBodyRecord.body_fat_pct}<span className="text-xs ml-0.5">%</span></p>
                  </div>
                )}
              </div>
              <Link href="/body">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  詳細 <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PR Progress Charts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            自己ベスト推移
          </h2>
          <Link href="/record">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              記録する <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {chartDataByExercise.map(({ exercise, data, color }) => (
            <Card key={exercise.id} className="border border-border/50">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{exercise.name_ja}</CardTitle>
                  {data.length > 0 && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
                      {exercise.name === 'pull_up'
                        ? `最高 ${Math.max(...data.map(d => Number(d.value) || 0))}回`
                        : `最高 ${Math.max(...data.map(d => Number(d.value) || 0))}kg`
                      }
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {data.length === 0 ? (
                  <div className="h-24 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">まだ記録がありません</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(val) => [
                          `${val}${exercise.name === 'pull_up' ? '回' : 'kg'}`,
                          exercise.name_ja
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color }}
                      />
                      {data.map((d, i) =>
                        d.isPR ? (
                          <ReferenceDot
                            key={i}
                            x={d.date}
                            y={Number(d.value)}
                            r={6}
                            fill={color}
                            stroke="white"
                            strokeWidth={2}
                            label={<StarLabel />}
                          />
                        ) : null
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Form Feedback */}
      {recentFeedback && (
        <div>
          <h2 className="text-lg font-semibold mb-3">直近のフォームチェック</h2>
          <Link href={`/form/${recentFeedback.session_id}`}>
            <Card className="border border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary text-xs border-0">
                        {(recentFeedback as any).exercises?.name_ja ?? ''}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(recentFeedback.created_at), 'M月d日', { locale: ja })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                      {recentFeedback.overall_comment}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/record">
          <Card className="border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <p className="text-2xl mb-1">💪</p>
              <p className="text-sm font-medium text-primary">記録する</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/form">
          <Card className="border border-border/50 hover:border-primary/20 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <p className="text-2xl mb-1">📸</p>
              <p className="text-sm font-medium">フォームチェック</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function StarLabel() {
  return (
    <g transform="translate(-6, -18)">
      <text fontSize="12" textAnchor="middle" x="6" y="12">⭐</text>
    </g>
  )
}
