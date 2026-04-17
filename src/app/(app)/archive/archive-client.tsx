'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Columns2, LayoutGrid, Video, Dumbbell, ArrowUpToLine, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Exercise, FormSession } from '@/types'

interface Props {
  exercises: Exercise[]
  sessions: FormSession[]
  feedbacks: { session_id: string; overall_comment: string | null; created_at: string }[]
}

const EXERCISE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  half_deadlift: { icon: Dumbbell,      color: '#2563B0', bg: 'bg-blue-50' },
  pull_up:       { icon: ArrowUpToLine, color: '#10b981', bg: 'bg-emerald-50' },
  bench_press:   { icon: Zap,           color: '#8b5cf6', bg: 'bg-violet-50' },
}

export function ArchiveClient({ exercises, sessions, feedbacks }: Props) {
  const [activeTab, setActiveTab] = useState(exercises[0]?.name ?? '')
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const activeExercise = exercises.find(e => e.name === activeTab)
  const filteredSessions = sessions.filter(s => s.exercise_id === activeExercise?.id)
  const feedbackMap = Object.fromEntries(feedbacks.map(f => [f.session_id, f]))

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) setSelected(prev => prev.filter(s => s !== id))
    else if (selected.length < 2) setSelected(prev => [...prev, id])
  }

  const compareA = sessions.find(s => s.id === selected[0])
  const compareB = sessions.find(s => s.id === selected[1])

  return (
    <div className="px-4 md:px-8 pt-6 pb-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">フォームアーカイブ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">過去のフォームチェックを振り返ろう</p>
        </div>
        <Button
          variant={compareMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setCompareMode(!compareMode); setSelected([]) }}
          className="gap-1.5"
        >
          <Columns2 className="w-3.5 h-3.5" />
          {compareMode ? '比較中' : '比較する'}
        </Button>
      </div>

      {/* Compare hint */}
      {compareMode && (
        <div className={`rounded-xl p-3 border text-sm flex items-center gap-2 ${
          selected.length === 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-primary/5 border-primary/20 text-primary'
        }`}>
          <Columns2 className="w-4 h-4 shrink-0" />
          {selected.length === 0 && '比較したい2つのセッションを選んでください'}
          {selected.length === 1 && 'あと1つ選択してください'}
          {selected.length === 2 && '選択完了。下に比較が表示されます。'}
        </div>
      )}

      {/* Exercise Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {exercises.map(ex => {
          const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift
          const Icon = meta.icon
          const count = sessions.filter(s => s.exercise_id === ex.id).length
          return (
            <button key={ex.name} onClick={() => { setActiveTab(ex.name); setSelected([]) }}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === ex.name ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {ex.name_ja}
              {count > 0 && <span className={`text-xs ${activeTab === ex.name ? 'text-white/70' : 'text-muted-foreground'}`}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Comparison View */}
      {compareMode && selected.length === 2 && compareA && compareB && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">比較ビュー</p>
          <div className="grid grid-cols-2 gap-4">
            {[compareA, compareB].map((s, idx) => {
              const fb = feedbackMap[s.id]
              return (
                <div key={s.id} className="space-y-2">
                  <div className="aspect-video rounded-xl bg-muted overflow-hidden shadow-sm">
                    {s.video_url
                      ? <video src={s.video_url} className="w-full h-full object-contain" controls muted playsInline />
                      : <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8 text-muted-foreground/30" /></div>
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{idx === 0 ? '比較A' : '比較B'}</Badge>
                    <span className="text-xs font-medium">{format(new Date(s.recorded_at), 'M月d日', { locale: ja })}</span>
                    {s.weight_kg && <span className="text-xs text-muted-foreground">{s.weight_kg}kg</span>}
                  </div>
                  {fb?.overall_comment && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{fb.overall_comment}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">まだフォームチェックがありません</p>
          <Link href="/form">
            <Button size="sm" className="bg-primary mt-1">フォームチェックする</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSessions.map(session => {
            const fb = feedbackMap[session.id]
            const isSelected = selected.includes(session.id)
            const selIdx = selected.indexOf(session.id)
            return (
              <div key={session.id} className="relative">
                {compareMode ? (
                  <button onClick={() => toggleSelect(session.id)}
                    className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-transparent'
                    }`}>
                    <SessionCard session={session} feedback={fb} />
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selIdx + 1}</span>
                      </div>
                    )}
                  </button>
                ) : (
                  <Link href={`/form/${session.id}`}>
                    <div className="rounded-xl overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all">
                      <SessionCard session={session} feedback={fb} />
                    </div>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, feedback }: {
  session: FormSession
  feedback?: { overall_comment: string | null } | null
}) {
  return (
    <div>
      <div className="aspect-video bg-muted overflow-hidden">
        {session.video_url
          ? <video src={session.video_url} className="w-full h-full object-cover pointer-events-none" muted playsInline />
          : <div className="w-full h-full flex items-center justify-center"><Video className="w-6 h-6 text-muted-foreground/30" /></div>
        }
      </div>
      <div className="p-2.5 space-y-0.5">
        <p className="text-xs font-medium">{format(new Date(session.recorded_at), 'M月d日', { locale: ja })}</p>
        {(session.weight_kg || session.reps) && (
          <p className="text-xs text-muted-foreground">
            {[session.weight_kg && `${session.weight_kg}kg`, session.reps && `${session.reps}回`].filter(Boolean).join(' · ')}
          </p>
        )}
        {feedback?.overall_comment && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{feedback.overall_comment}</p>
        )}
      </div>
    </div>
  )
}
