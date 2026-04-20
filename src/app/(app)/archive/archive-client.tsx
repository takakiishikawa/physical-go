'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Columns2, Video, Dumbbell, ArrowUpToLine, Zap } from 'lucide-react'
import { PageHeader, Banner, Section, EmptyState } from '@takaki/go-design-system'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Exercise, FormSession } from '@/types'

interface Props {
  exercises: Exercise[]
  sessions: FormSession[]
  feedbacks: { session_id: string; overall_comment: string | null; created_at: string }[]
}

const EXERCISE_META: Record<string, { icon: React.ElementType; colorVar: string }> = {
  half_deadlift: { icon: Dumbbell,      colorVar: 'var(--color-exercise-deadlift)' },
  pull_up:       { icon: ArrowUpToLine, colorVar: 'var(--color-exercise-pullup)' },
  bench_press:   { icon: Zap,           colorVar: 'var(--color-exercise-benchpress)' },
}

export function ArchiveClient({ exercises, sessions, feedbacks }: Props) {
  const router = useRouter()
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
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="フォームアーカイブ"
        description="過去のフォームチェックを振り返ろう"
        actions={
          <Button
            variant={compareMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setCompareMode(!compareMode); setSelected([]) }}
            className="gap-1.5"
          >
            <Columns2 className="w-3.5 h-3.5" />
            {compareMode ? '比較中' : '比較する'}
          </Button>
        }
      />

      {compareMode && (
        <Banner
          variant={selected.length === 2 ? 'success' : 'info'}
          title={
            selected.length === 0 ? '比較したい2つのセッションを選んでください' :
            selected.length === 1 ? 'あと1つ選択してください' :
            '選択完了。下に比較が表示されます。'
          }
          dismissible={false}
        />
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelected([]) }}>
        <TabsList variant="underline">
          {exercises.map(ex => {
            const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift
            const Icon = meta.icon
            const count = sessions.filter(s => s.exercise_id === ex.id).length
            return (
              <TabsTrigger key={ex.name} value={ex.name} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: meta.colorVar }} />
                {ex.name_ja}
                {count > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{count}</Badge>}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {exercises.map(ex => (
          <TabsContent key={ex.name} value={ex.name} className="mt-6">
            {compareMode && selected.length === 2 && compareA && compareB && (
              <Section title="比較ビュー" variant="bordered" className="mb-6">
                <div className="grid grid-cols-2 gap-4 pt-3">
                  {[compareA, compareB].map((s, idx) => {
                    const fb = feedbackMap[s.id]
                    return (
                      <div key={s.id} className="space-y-2">
                        <div className="aspect-video rounded-lg bg-muted overflow-hidden shadow-sm">
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
              </Section>
            )}

            {filteredSessions.length === 0 ? (
              <EmptyState
                icon={<Video className="w-10 h-10" />}
                title="まだフォームチェックがありません"
                action={{ label: 'フォームチェックする', onClick: () => router.push('/form') }}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredSessions.map(session => {
                  const fb = feedbackMap[session.id]
                  const isSelected = selected.includes(session.id)
                  const selIdx = selected.indexOf(session.id)
                  return (
                    <div key={session.id} className="relative">
                      {compareMode ? (
                        <button
                          onClick={() => toggleSelect(session.id)}
                          className={`w-full text-left rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-transparent'
                          }`}
                        >
                          <SessionCard session={session} feedback={fb} />
                          {isSelected && (
                            <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{selIdx + 1}</span>
                            </div>
                          )}
                        </button>
                      ) : (
                        <Link href={`/form/${session.id}`}>
                          <div className="rounded-lg overflow-hidden border border-border hover:border-primary/40 hover:shadow-sm transition-all">
                            <SessionCard session={session} feedback={fb} />
                          </div>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
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
