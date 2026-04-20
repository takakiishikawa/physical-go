'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  HelpCircle, MessageSquare, TrendingUp, ListChecks, Video
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { FormSession, FormFeedback, Exercise } from '@/types'

interface Props {
  session: FormSession & { exercises?: Exercise }
  feedback: FormFeedback | null
  pastSessions: { id: string; recorded_at: string; weight_kg: number | null; reps: number | null; frame_url: string | null }[]
}

const RESULT_CONFIG = {
  OK:       { icon: CheckCircle2, color: 'text-success',           bg: 'bg-success/10 border-success/20',   label: 'OK' },
  '要改善': { icon: AlertCircle,  color: 'text-warning',           bg: 'bg-warning/10 border-warning/20',   label: '要改善' },
  '確認不可': { icon: HelpCircle, color: 'text-muted-foreground',  bg: 'bg-muted border-border',            label: '確認不可' },
}

export function FeedbackClient({ session, feedback, pastSessions }: Props) {
  const exercise = session.exercises
  const checkpoints = feedback?.checkpoints as Record<string, { result: string; comment: string }> | null

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/archive">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-0 text-xs">{exercise?.name_ja}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(session.recorded_at), 'M月d日 HH:mm', { locale: ja })}
            </span>
            {(session.weight_kg || session.reps) && (
              <div className="flex gap-1.5">
                {session.weight_kg && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{session.weight_kg}kg</span>}
                {session.reps && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{session.reps}回</span>}
              </div>
            )}
          </div>
          <h1 className="text-xl font-semibold mt-0.5">フォームフィードバック</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Video */}
        <div className="space-y-4">
          {session.video_url ? (
            <div className="rounded-lg overflow-hidden bg-black aspect-video shadow-sm">
              <video src={session.video_url} className="w-full h-full object-contain" controls playsInline muted />
            </div>
          ) : (
            <div className="rounded-lg bg-muted aspect-video flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Past sessions */}
          {pastSessions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">過去のセッション</p>
                <Link href="/archive">
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    すべて <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pastSessions.map(ps => (
                  <Link key={ps.id} href={`/form/${ps.id}`}>
                    <div className="shrink-0 w-24 space-y-1">
                      <div className="aspect-video rounded-lg bg-muted overflow-hidden">
                        {ps.frame_url
                          ? <img src={ps.frame_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Video className="w-5 h-5 text-muted-foreground/30" /></div>
                        }
                      </div>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(ps.recorded_at), 'M/d', { locale: ja })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Feedback */}
        <div className="space-y-4">
          {!feedback ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">フィードバックを読み込み中...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overall */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">総合コメント</p>
                      <p className="text-sm text-foreground leading-relaxed">{feedback.overall_comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Previous comparison */}
              {feedback.previous_comparison && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2.5">
                      <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1">前回との比較</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{feedback.previous_comparison}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      できていること
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {feedback.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-success/10 border border-success/20 rounded-lg px-3 py-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{s}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Improvements */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      改善点
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {feedback.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-warning/10 border border-warning/20 rounded-lg px-3 py-2.5">
                        <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{imp}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Checkpoints */}
              {checkpoints && Object.keys(checkpoints).length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-primary" />
                      チェックポイント詳細
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {Object.entries(checkpoints).map(([name, cp]) => {
                      const config = RESULT_CONFIG[cp.result as keyof typeof RESULT_CONFIG] ?? RESULT_CONFIG['確認不可']
                      const Icon = config.icon
                      return (
                        <div key={name} className={`flex items-start gap-3 border rounded-lg px-3 py-3 ${config.bg}`}>
                          <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{name}</span>
                              <Badge variant="outline" className={`text-xs ${config.color} border-current`}>{config.label}</Badge>
                            </div>
                            {cp.comment && <p className="text-xs text-muted-foreground mt-0.5">{cp.comment}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Link href="/form" className="flex-1">
              <Button variant="outline" className="w-full gap-2"><Video className="w-3.5 h-3.5" />新しくチェック</Button>
            </Link>
            <Link href="/archive" className="flex-1">
              <Button variant="outline" className="w-full gap-2"><ChevronLeft className="w-3.5 h-3.5" />アーカイブへ</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
