'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, HelpCircle, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { FormSession, FormFeedback, Exercise } from '@/types'

interface Props {
  session: FormSession & { exercises?: Exercise }
  feedback: FormFeedback | null
  pastSessions: { id: string; recorded_at: string; weight_kg: number | null; reps: number | null; frame_url: string | null }[]
}

const RESULT_CONFIG = {
  OK: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'OK' },
  '要改善': { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', label: '要改善' },
  '確認不可': { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', label: '確認不可' },
}

export function FeedbackClient({ session, feedback, pastSessions }: Props) {
  const exercise = session.exercises
  const checkpoints = feedback?.checkpoints as Record<string, { result: string; comment: string }> | null

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/archive">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-0 text-xs">
              {exercise?.name_ja}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(session.recorded_at), 'M月d日 HH:mm', { locale: ja })}
            </span>
          </div>
          <h1 className="text-xl font-normal mt-0.5">
            フォームフィードバック
          </h1>
        </div>
      </div>

      {/* Session Info */}
      <div className="flex gap-3 text-sm">
        {session.weight_kg && (
          <span className="bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
            {session.weight_kg}kg
          </span>
        )}
        {session.reps && (
          <span className="bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
            {session.reps}回
          </span>
        )}
      </div>

      {/* Video */}
      {session.video_url && (
        <div className="rounded-xl overflow-hidden bg-black aspect-video">
          <video
            src={session.video_url}
            className="w-full h-full object-contain"
            controls
            playsInline
            muted
          />
        </div>
      )}

      {!feedback ? (
        <Card className="border border-border/50">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">フィードバックを取得中...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Comment */}
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-primary mb-1">総合コメント</p>
              <p className="text-base text-foreground">{feedback.overall_comment}</p>
            </CardContent>
          </Card>

          {/* Previous Comparison */}
          {feedback.previous_comparison && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">前回との比較</p>
              <p className="text-sm text-blue-800">{feedback.previous_comparison}</p>
            </div>
          )}

          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                できていること
              </h2>
              <div className="space-y-2">
                {feedback.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    <span className="text-green-600 text-sm mt-0.5">✓</span>
                    <p className="text-sm text-green-800">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {feedback.improvements && feedback.improvements.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                改善点
              </h2>
              <div className="space-y-2">
                {feedback.improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                    <span className="text-orange-500 text-sm mt-0.5">→</span>
                    <p className="text-sm text-orange-800">{imp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkpoints */}
          {checkpoints && Object.keys(checkpoints).length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm">チェックポイント詳細</h2>
              <div className="space-y-2">
                {Object.entries(checkpoints).map(([name, cp]) => {
                  const config = RESULT_CONFIG[cp.result as keyof typeof RESULT_CONFIG] ?? RESULT_CONFIG['確認不可']
                  const Icon = config.icon
                  return (
                    <div key={name} className={`flex items-start gap-3 border rounded-lg px-3 py-2.5 ${config.bg}`}>
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{name}</span>
                          <Badge variant="outline" className={`text-xs ${config.color} border-current`}>
                            {config.label}
                          </Badge>
                        </div>
                        {cp.comment && (
                          <p className="text-xs text-muted-foreground mt-0.5">{cp.comment}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">過去のフォームチェック</h2>
            <Link href="/archive">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                すべて見る <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {pastSessions.map(ps => (
              <Link key={ps.id} href={`/form/${ps.id}`}>
                <div className="shrink-0 w-28">
                  <div className="aspect-video rounded-lg bg-muted overflow-hidden mb-1.5">
                    {ps.frame_url ? (
                      <img src={ps.frame_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl">📹</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ps.recorded_at), 'M/d', { locale: ja })}
                  </p>
                  {ps.weight_kg && (
                    <p className="text-xs font-medium">{ps.weight_kg}kg</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/form" className="flex-1">
          <Button variant="outline" className="w-full">
            新しくチェック
          </Button>
        </Link>
        <Link href="/archive" className="flex-1">
          <Button variant="outline" className="w-full">
            アーカイブ
          </Button>
        </Link>
      </div>
    </div>
  )
}
