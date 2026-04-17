'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Camera, Upload, Info, Loader2, Play, CheckCircle2,
  Dumbbell, ArrowUpToLine, Zap, X, ListChecks
} from 'lucide-react'
import type { Exercise } from '@/types'

interface Props { exercises: Exercise[]; userId: string }

const EXERCISE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  half_deadlift: { icon: Dumbbell,      color: '#2563B0', bg: 'bg-blue-50' },
  pull_up:       { icon: ArrowUpToLine, color: '#10b981', bg: 'bg-emerald-50' },
  bench_press:   { icon: Zap,           color: '#8b5cf6', bg: 'bg-violet-50' },
}

export function FormClient({ exercises }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) { toast.error('動画ファイルを選択してください'); return }
    if (file.size > 100 * 1024 * 1024) { toast.error('ファイルサイズは100MB以下にしてください'); return }
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleAnalyze = async () => {
    if (!selectedExercise) { toast.error('種目を選択してください'); return }
    if (!videoFile) { toast.error('動画を選択してください'); return }
    setLoading(true)
    setLoadingStep('動画をアップロード中...')
    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('exercise_id', selectedExercise.id)
      formData.append('exercise_name', selectedExercise.name)
      if (weightInput) formData.append('weight_kg', weightInput)
      if (repsInput) formData.append('reps', repsInput)
      setLoadingStep('AIがフォームを解析中...')
      const res = await fetch('/api/form/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('フォームチェック完了')
      router.push(`/form/${data.session_id}`)
    } catch (e: any) {
      toast.error(e.message ?? '解析に失敗しました')
    } finally {
      setLoading(false); setLoadingStep('')
    }
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">フォームチェック</h1>
        <p className="text-sm text-muted-foreground mt-1">動画をアップロードするとAIがフォームを詳細に分析します</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Upload + Settings */}
        <div className="space-y-5">
          {/* Exercise Selection */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">種目を選択</p>
            <div className="grid grid-cols-3 gap-2">
              {exercises.map(ex => {
                const isSelected = selectedExercise?.id === ex.id
                const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift
                const Icon = meta.icon
                return (
                  <button key={ex.id} onClick={() => setSelectedExercise(isSelected ? null : ex)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}>
                    <div className={`w-8 h-8 ${meta.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <p className="text-xs font-medium text-center leading-tight">{ex.name_ja}</p>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">動画をアップロード</p>
            <input ref={fileRef} type="file" accept="video/*" capture="environment" onChange={handleFileChange} className="hidden" />
            {videoPreview ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video src={videoPreview} className="w-full h-full object-contain" controls muted playsInline />
                  <button onClick={() => { setVideoFile(null); setVideoPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {videoFile?.name}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { if (fileRef.current) { fileRef.current.capture = 'environment'; fileRef.current.click() } }}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-all">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">今すぐ撮影</span>
                </button>
                <button onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute('capture'); fileRef.current.click() } }}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-all">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">ギャラリーから</span>
                </button>
              </div>
            )}
          </div>

          {/* Weight / Reps */}
          {selectedExercise && (
            <div className="grid grid-cols-2 gap-3">
              {selectedExercise.name !== 'pull_up' && (
                <div className="space-y-1.5">
                  <Label htmlFor="weight" className="text-xs">重量 (kg)</Label>
                  <Input id="weight" type="number" placeholder="例: 80" value={weightInput}
                    onChange={e => setWeightInput(e.target.value)} inputMode="decimal" className="h-10" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="reps" className="text-xs">回数</Label>
                <Input id="reps" type="number" placeholder="例: 5" value={repsInput}
                  onChange={e => setRepsInput(e.target.value)} inputMode="numeric" className="h-10" />
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <Button onClick={handleAnalyze} disabled={loading || !selectedExercise || !videoFile}
            className="w-full h-12 bg-primary hover:bg-primary/90 gap-2">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{loadingStep}</>
            ) : (
              <><Play className="w-4 h-4" />AIでフォームを解析する</>
            )}
          </Button>
        </div>

        {/* Right: Guide + Checkpoints */}
        <div className="space-y-4">
          {selectedExercise ? (
            <>
              {selectedExercise.filming_guide && (
                <Card className="border border-blue-100 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1">撮影ガイド</p>
                        <p className="text-sm text-blue-800 leading-relaxed">{selectedExercise.filming_guide}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedExercise.key_checkpoints?.length > 0 && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-primary" />
                      AIがチェックするポイント
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {selectedExercise.key_checkpoints.map((cp, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                          </div>
                          <span>{cp}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">解析内容</p>
                  <div className="space-y-1.5">
                    {['フォームの強みと改善点', '各チェックポイントの評価', '前回との比較・成長の記録'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">種目を選択してください</p>
              <p className="text-xs">撮影ガイドとチェックポイントが表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
