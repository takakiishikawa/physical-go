'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Scale, Plus, Camera } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { BodyRecord } from '@/types'

interface Props {
  bodyRecords: BodyRecord[]
  userId: string
}

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
  const chartData = bodyRecords.map(r => ({
    date: format(new Date(r.recorded_at), 'M/d'),
    weight: r.weight_kg,
    bodyFat: r.body_fat_pct,
  }))

  const handleSubmit = async () => {
    if (!weightInput && !bodyFatInput) {
      toast.error('体重または体脂肪率を入力してください')
      return
    }
    setLoading(true)
    try {
      let photoUrl: string | null = null

      if (photoFile) {
        const path = `${userId}/body/${Date.now()}-${photoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const { error: uploadError } = await supabase.storage
          .from('physicalgo')
          .upload(path, photoFile)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('physicalgo').getPublicUrl(path)
          photoUrl = publicUrl
        }
      }

      const { error } = await supabase
        .schema('physicalgo')
        .from('body_records')
        .insert({
          user_id: userId,
          weight_kg: weightInput ? Number(weightInput) : null,
          body_fat_pct: bodyFatInput ? Number(bodyFatInput) : null,
          note: noteInput || null,
          photo_url: photoUrl,
          recorded_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success('記録しました')
      setShowForm(false)
      setWeightInput('')
      setBodyFatInput('')
      setNoteInput('')
      setPhotoFile(null)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? '記録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal">
          ボディデータ
        </h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/90 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          記録
        </Button>
      </div>

      {/* Latest values - understated */}
      {latest && (
        <div className="flex gap-4">
          {latest.weight_kg && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">最新 体重</p>
              <p className="text-xl font-light text-foreground/60">{latest.weight_kg}<span className="text-xs ml-0.5">kg</span></p>
            </div>
          )}
          {latest.body_fat_pct && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">最新 体脂肪率</p>
              <p className="text-xl font-light text-foreground/60">{latest.body_fat_pct}<span className="text-xs ml-0.5">%</span></p>
            </div>
          )}
        </div>
      )}

      {/* Record Form */}
      {showForm && (
        <Card className="border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-xs">体重 (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="例: 72.0"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  inputMode="decimal"
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bodyFat" className="text-xs">体脂肪率 (%)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  placeholder="例: 22.0"
                  value={bodyFatInput}
                  onChange={e => setBodyFatInput(e.target.value)}
                  inputMode="decimal"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="note" className="text-xs">メモ（任意）</Label>
              <Input
                id="note"
                placeholder="体調など"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">身体写真（任意・顔なし推奨）</Label>
              <label className="flex items-center gap-2 border-2 border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/40 transition-colors">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {photoFile ? photoFile.name : '写真を選択'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                キャンセル
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '記録中...' : '記録する'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-sm">推移グラフ</h2>
          <Card className="border border-border/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-2">体重 (kg)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(val) => [`${val}kg`, '体重']} />
                  <Line type="monotone" dataKey="weight" stroke="#2563B0" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-2">体脂肪率 (%)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(val) => [`${val}%`, '体脂肪率']} />
                  <Line type="monotone" dataKey="bodyFat" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photo Timeline */}
      {bodyRecords.some(r => r.photo_url) && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">身体写真タイムライン</h2>
          <div className="grid grid-cols-3 gap-2">
            {bodyRecords
              .filter(r => r.photo_url)
              .reverse()
              .map(r => (
                <div key={r.id} className="space-y-1">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={r.photo_url!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {format(new Date(r.recorded_at), 'M月', { locale: ja })}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* History Table */}
      {bodyRecords.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">記録一覧</h2>
          <div className="space-y-1.5">
            {[...bodyRecords].reverse().map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 text-sm">
                <span className="text-muted-foreground text-xs">
                  {format(new Date(r.recorded_at), 'M月d日', { locale: ja })}
                </span>
                <div className="flex gap-3">
                  {r.weight_kg && <span className="font-medium text-foreground/70">{r.weight_kg}kg</span>}
                  {r.body_fat_pct && <span className="text-muted-foreground">{r.body_fat_pct}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bodyRecords.length === 0 && !showForm && (
        <div className="text-center py-16">
          <Scale className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">まだ記録がありません</p>
          <Button size="sm" className="mt-3 bg-primary" onClick={() => setShowForm(true)}>
            最初の記録をする
          </Button>
        </div>
      )}
    </div>
  )
}
