'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft, Activity, Camera, TrendingUp, BarChart3,
  Dumbbell, ArrowUpToLine, Zap, Minus, Check
} from 'lucide-react'

const features = [
  { icon: Camera, title: 'フォームを撮る', description: '動画をアップロードするだけ。AIパーソナルトレーナーがフォームを分析して、できていることと改善点を具体的に教えてくれます。' },
  { icon: Dumbbell, title: '記録する', description: 'ハーフデッドリフト・懸垂・ベンチプレスの3種目に絞ることで、シンプルに続けられます。自己ベスト更新のさりげない喜びが積み重なります。' },
  { icon: BarChart3, title: '振り返る', description: '過去のフォーム動画を並べて比較できます。1ヶ月前の自分と今の自分を見比べることで、成長実感がモチベーションになります。' },
]

const exercises = [
  { icon: Dumbbell, name: 'ハーフデッドリフト', color: '#2563B0', bg: 'bg-blue-50' },
  { icon: ArrowUpToLine, name: '懸垂', color: '#10b981', bg: 'bg-emerald-50' },
  { icon: Zap, name: 'ベンチプレス', color: '#8b5cf6', bg: 'bg-violet-50' },
]

const philosophy = [
  '数値（体重・体脂肪・kg）は「見れる」けど主役じゃない',
  '主役は「フォームの成長実感」と「自己ベスト更新の小さな喜び」',
  '低頻度（週1〜月1）でも使いたくなる設計',
  '数値に縛られず、楽しさがモチベーションになる状態を維持する',
]

export default function ConceptPage() {
  return (
    <div className="px-4 md:px-8 pt-6 pb-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-xl shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">PhysicalGoとは</h1>
      </div>

      {/* Hero */}
      <div className="text-center py-8 space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
        <p className="text-3xl font-light tracking-tight">撮る・記録する・振り返る。</p>
        <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
          トレーニングを楽しみながら、<br />結果として身体が変わっていく体験。
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="border border-border/60">
            <CardContent className="p-5 flex gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Philosophy */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />設計哲学
        </h2>
        <Card className="border border-border/60">
          <CardContent className="p-5 space-y-3">
            {philosophy.map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <Minus className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Target user */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-2 text-sm text-primary">こんな人のために作りました</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">
            筋トレは続けているけど、フォームが正しいか不安。成長しているのかわからない。数値管理はしんどい。でもトレーニング自体は楽しみたい——そんな人のためのアプリです。
          </p>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">対応種目</h2>
        <div className="grid grid-cols-3 gap-3">
          {exercises.map(({ icon: Icon, name, color, bg }) => (
            <Card key={name} className="border border-border/60">
              <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <p className="text-xs font-medium leading-tight">{name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">PhysicalGo v1.0.0</p>
      </div>
    </div>
  )
}
