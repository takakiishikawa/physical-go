'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import {
  Scale, Plus, Camera, TrendingDown, TrendingUp,
  CalendarDays, ImageIcon, BarChart3, X
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import type { BodyRecord } from '@/types'

interface Props { bodyRecords: BodyRecord[]; userId: string }

export function BodyClient({ bodyRecords, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [bodyFatInput, setBodyFatInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const latest = bodyRecords[bodyRecords.length - 1]
  const prev = bodyRecords[bodyRecords.length - 2]
  const chartData = bodyRecords.map(r => ({
    date: format(new Date(r.recorded_at), 'M/d'),
    weight: r.weight_kg,
    bodyFat: r.body_fat_pct,
  }))

  const weightDiff = latest?.weight_kg && prev?.weight_kg ? latest.weight_kg - prev.weight_kg : null
  const fatDiff = latest?.body_fat_pct && prev?.body_fat_pct ? latest.body_fat_pct - prev.body_fat_pct : null

  const handleSubmit = async () => {
    if (!weightInput && !bodyFatInput) { toast.error('体重または体脂肪率を入力してください'); return }
    setLoading(true)
    try {
      let photoUrl: string | null = null
      if (photoFile) {
        const path = `${userId}/body/${Date.now()}-${photoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const { error: uploadError } = await supabase.storage.from('physicalgo').upload(path, photoFile)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('physicalgo').getPublicUrl(path)
          photoUrl = publicUrl
        }
      }
      const { error } = await supabase.schema('physicalgo').from('body_records').insert({
        user_id: userId,
        weight_kg: weightInput ? Number(weightInput) : null,
        body_fat_pct: bodyFatInput ? Number(bodyFatInput) : null,
        note: noteInput || null,
        photo_url: photoUrl,
        recorded_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success('記録しました')
      setShowForm(false); setWeightInput(''); setBodyFatInput(''); setNoteInput(''); setPhotoFile(null)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? '記録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ボディデータ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">体重・体脂肪率の定点観測</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90 gap-1.5">
          <Plus className="w-3.5 h-3.5" />記録する
        </Button>
      </div>

      {/* Latest stats — understated */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {latest.weight_kg !== null && (
            <Card className="border border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">体重</p>
                </div>
                <p className="text-2xl font-light text-foreground/60">
                  {latest.weight_kg}<span className="text-sm ml-0.5">kg</span>
                </p>
                {weightDiff !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${weightDiff < 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
                    {weightDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}kg
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {latest.body_fat_pct !== null && (
            <Card className="border border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">体脂肪率</p>
                </div>
                <p className="text-2xl font-light text-foreground/60">
                  {latest.body_fat_pct}<span className="text-sm ml-0.5">%</span>
                </p>
                {fatDiff !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${fatDiff < 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
                    {fatDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {fatDiff > 0 ? '+' : ''}{fatDiff.toFixed(1)}%
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          <Card className="border border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">最終記録</p>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(latest.recorded_at), 'M月d日', { locale: ja })}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">記録数</p>
              </div>
              <p className="text-2xl font-light text-foreground/60">
                {bodyRecords.length}<span className="text-sm ml-0.5">件</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Form */}
      {showForm && (
        <Card className="border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                新規記録
              </CardTitle>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="weight" className="text-xs">体重 (kg)</Label>
                <Input id="weight" type="number" placeholder="例: 72.0" value={weightInput}
                  onChange={e => setWeightInput(e.target.value)} inputMode="decimal" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bodyFat" className="text-xs">体脂肪率 (%)</Label>
                <Input id="bodyFat" type="number" placeholder="例: 22.0" value={bodyFatInput}
                  onChange={e => setBodyFatInput(e.target.value)} inputMode="decimal" className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs">メモ（任意）</Label>
              <Input id="note" placeholder="体調など" value={noteInput}
                onChange={e => setNoteInput(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">身体写真（任意・顔なし推奨）</Label>
              <label className="flex items-center gap-2.5 border-2 border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/40 transition-colors">
                <Camera className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {photoFile ? photoFile.name : '写真を選択'}
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>キャンセル</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={loading}>
                {loading ? '記録中...' : '記録する'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {bodyRecords.length === 0 && !showForm ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <Scale className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">まだ記録がありません</p>
          <Button size="sm" className="bg-primary mt-1" onClick={() => setShowForm(true)}>最初の記録をする</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Charts */}
          {chartData.length > 1 && (
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />推移グラフ
              </h2>
              <Card className="border border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-3">体重 (kg)</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}kg`, '体重']} />
                      <Line type="monotone" dataKey="weight" stroke="#2563B0" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-3">体脂肪率 (%)</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}%`, '体脂肪率']} />
                      <Line type="monotone" dataKey="bodyFat" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Right: Photo timeline + log */}
          <div className="space-y-4">
            {bodyRecords.some(r => r.photo_url) && (
              <div className="space-y-3">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />身体写真タイムライン
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[...bodyRecords].reverse().filter(r => r.photo_url).map(r => (
                    <div key={r.id} className="space-y-1">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                        <img src={r.photo_url!} alt="" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">
                        {format(new Date(r.recorded_at), 'M月', { locale: ja })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />記録一覧
              </h2>
              <Card className="border border-border/60">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {[...bodyRecords].reverse().map(r => (
                      <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(r.recorded_at), 'M月d日', { locale: ja })}
                        </span>
                        <div className="flex gap-4 items-center">
                          {r.weight_kg && <span className="font-medium text-foreground/70">{r.weight_kg}<span className="text-xs text-muted-foreground ml-0.5">kg</span></span>}
                          {r.body_fat_pct && <span className="text-muted-foreground">{r.body_fat_pct}<span className="text-xs ml-0.5">%</span></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
