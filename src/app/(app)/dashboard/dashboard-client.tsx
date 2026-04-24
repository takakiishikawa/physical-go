'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  SectionCards, ChartArea, Section, EmptyState, type KpiCard,
} from '@takaki/go-design-system'
import { PageShell } from '@/components/layout/page-shell'
import type { Exercise, PersonalRecord } from '@/types'
import { EXERCISE_META, EXERCISE_NAMES } from '@/lib/exercise-meta'
import { format, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  exercises: Exercise[]
  personalRecords: PersonalRecord[]
}

export function DashboardClient({ exercises, personalRecords }: Props) {
  const router = useRouter()
  const oneMonthAgo = useMemo(() => subDays(new Date(), 30), [])

  const exerciseData = useMemo(() => {
    return exercises.map(ex => {
      const isPullUp = ex.name === EXERCISE_NAMES.PULL_UP
      const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift

      const sorted = personalRecords
        .filter(r => r.exercise_id === ex.id)
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

      const chartData = sorted
        .filter(r => isPullUp ? r.reps != null : r.weight_kg != null)
        .map(r => ({ date: r.recorded_at, value: Number(isPullUp ? r.reps : r.weight_kg) }))

      const currentVal = chartData.at(-1)?.value ?? null
      const oldVal = [...chartData].filter(d => new Date(d.date) <= oneMonthAgo).at(-1)?.value ?? null
      const diff = currentVal !== null && oldVal !== null ? currentVal - oldVal : null
      const unit = isPullUp ? '回' : 'kg'

      return { exercise: ex, isPullUp, chartData, meta, currentVal, oldVal, diff, unit }
    })
  }, [exercises, personalRecords, oneMonthAgo])

  const kpiCards: KpiCard[] = exerciseData.map(({ exercise, currentVal, oldVal, diff, unit, meta }) => {
    const Icon = meta.icon
    let trend: KpiCard['trend']
    if (diff !== null) {
      const sign = diff > 0 ? '+' : ''
      trend = {
        value: diff === 0 ? '変化なし' : `${sign}${diff}${unit}`,
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      }
    }
    return {
      title: exercise.name_ja,
      value: currentVal !== null ? `${currentVal}${unit}` : '未記録',
      description: oldVal !== null ? `1ヶ月前: ${oldVal}${unit}` : '比較データなし',
      trend,
      icon: <Icon className="w-4 h-4" style={{ color: meta.colorVar }} />,
    }
  })

  return (
    <PageShell title="ダッシュボード">
      <SectionCards cards={kpiCards} />

      <div className="space-y-6">
        {exerciseData.map(({ exercise, isPullUp, chartData, meta }) =>
          chartData.length > 1 ? (
            <ChartArea
              key={exercise.id}
              data={chartData}
              config={{ value: { label: isPullUp ? '回数' : '重量(kg)', color: meta.colorVar } }}
              xKey="date"
              yKeys={['value']}
              title={exercise.name_ja}
              filterByDate={false}
              xTickFormatter={(v) => format(new Date(v), 'M/d')}
              tooltipLabelFormatter={(v) => format(new Date(v), 'M月d日', { locale: ja })}
            />
          ) : (
            <Section key={exercise.id} title={exercise.name_ja} variant="bordered">
              <EmptyState
                icon={<meta.icon className="w-8 h-8" style={{ color: meta.colorVar }} />}
                title="記録がありません"
                description="記録を追加するとグラフが表示されます"
                action={{ label: '記録する', onClick: () => router.push('/record') }}
              />
            </Section>
          )
        )}
      </div>
    </PageShell>
  )
}
