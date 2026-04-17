'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GitCompare, Video } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Exercise, FormSession } from '@/types'

interface Props {
  exercises: Exercise[]
  sessions: FormSession[]
  feedbacks: { session_id: string; overall_comment: string | null; strengths: string[] | null; improvements: string[] | null; created_at: string }[]
}

export function ArchiveClient({ exercises, sessions, feedbacks }: Props) {
  const [activeTab, setActiveTab] = useState(exercises[0]?.name ?? '')
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const activeExercise = exercises.find(e => e.name === activeTab)
  const filteredSessions = sessions.filter(s => s.exercise_id === activeExercise?.id)
  const feedbackMap = Object.fromEntries(feedbacks.map(f => [f.session_id, f]))

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(s => s !== id))
    } else if (selected.length < 2) {
      setSelected(prev => [...prev, id])
    }
  }

  const compareSessionA = sessions.find(s => s.id === selected[0])
  const compareSessionB = sessions.find(s => s.id === selected[1])

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal">
          フォームアーカイブ
        </h1>
        <Button
          variant={compareMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setCompareMode(!compareMode)
            setSelected([])
          }}
          className="text-xs gap-1.5"
        >
          <GitCompare className="w-3 h-3" />
          比較
        </Button>
      </div>

      {compareMode && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary">
          {selected.length === 0 && '2つのセッションを選択してください'}
          {selected.length === 1 && 'あと1つ選択してください'}
          {selected.length === 2 && '選択完了。下に比較が表示されます。'}
        </div>
      )}

      {/* Exercise Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {exercises.map(ex => (
          <button
            key={ex.name}
            onClick={() => { setActiveTab(ex.name); setSelected([]) }}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === ex.name
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {ex.name_ja}
          </button>
        ))}
      </div>

      {/* Comparison View */}
      {compareMode && selected.length === 2 && compareSessionA && compareSessionB && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">比較ビュー</h2>
          <div className="grid grid-cols-2 gap-3">
            {[compareSessionA, compareSessionB].map(s => {
              const fb = feedbackMap[s.id]
              return (
                <div key={s.id} className="space-y-2">
                  <div className="aspect-video rounded-xl bg-muted overflow-hidden">
                    {s.video_url ? (
                      <video src={s.video_url} className="w-full h-full object-contain" controls muted playsInline />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📹</div>
                    )}
                  </div>
                  <p className="text-xs font-medium">
                    {format(new Date(s.recorded_at), 'M月d日', { locale: ja })}
                  </p>
                  {s.weight_kg && <p className="text-xs text-muted-foreground">{s.weight_kg}kg</p>}
                  {fb?.overall_comment && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{fb.overall_comment}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">まだフォームチェックがありません</p>
          <Link href="/form">
            <Button size="sm" className="mt-3 bg-primary">フォームチェックする</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredSessions.map(session => {
            const fb = feedbackMap[session.id]
            const isSelected = selected.includes(session.id)
            return (
              <div key={session.id} className="relative">
                {compareMode ? (
                  <button
                    onClick={() => toggleSelect(session.id)}
                    className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    }`}
                  >
                    <SessionCard session={session} feedback={fb} />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {selected.indexOf(session.id) + 1}
                        </span>
                      </div>
                    )}
                  </button>
                ) : (
                  <Link href={`/form/${session.id}`}>
                    <div className="rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-colors">
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

function SessionCard({
  session,
  feedback,
}: {
  session: FormSession
  feedback?: { overall_comment: string | null } | null
}) {
  return (
    <div>
      <div className="aspect-video bg-muted overflow-hidden">
        {session.video_url ? (
          <video
            src={session.video_url}
            className="w-full h-full object-cover pointer-events-none"
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📹</div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium">
          {format(new Date(session.recorded_at), 'M月d日', { locale: ja })}
        </p>
        {(session.weight_kg || session.reps) && (
          <p className="text-xs text-muted-foreground">
            {session.weight_kg ? `${session.weight_kg}kg` : ''}{session.reps ? ` ${session.reps}回` : ''}
          </p>
        )}
        {feedback?.overall_comment && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feedback.overall_comment}</p>
        )}
      </div>
    </div>
  )
}
