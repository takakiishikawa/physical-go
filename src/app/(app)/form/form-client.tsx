'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Camera, Upload, Info, Loader2, Film } from 'lucide-react'
import type { Exercise } from '@/types'

interface Props {
  exercises: Exercise[]
  userId: string
}

const EXERCISE_ICONS: Record<string, string> = {
  half_deadlift: '🏋️',
  pull_up: '💪',
  bench_press: '🤸',
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
    if (!file.type.startsWith('video/')) {
      toast.error('動画ファイルを選択してください')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('ファイルサイズは100MB以下にしてください')
      return
    }
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

      setLoadingStep('フレームを解析中...')
      const res = await fetch('/api/form/analyze', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('フォームチェック完了！')
      router.push(`/form/${data.session_id}`)
    } catch (e: any) {
      toast.error(e.message ?? '解析に失敗しました')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-normal">
          フォームチェック
        </h1>
        <p className="text-sm text-muted-foreground mt-1">動画をアップロードしてAIに解析してもらおう</p>
      </div>

      {/* Exercise Selection */}
      <div>
        <Label className="text-sm font-medium mb-2 block">種目を選択</Label>
        <div className="grid grid-cols-3 gap-3">
          {exercises.map(ex => {
            const isSelected = selectedExercise?.id === ex.id
            return (
              <button
                key={ex.id}
                onClick={() => setSelectedExercise(isSelected ? null : ex)}
                className={`rounded-xl p-3 border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="text-2xl mb-1">{EXERCISE_ICONS[ex.name]}</div>
                <p className="text-xs font-medium leading-tight">{ex.name_ja}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filming Guide */}
      {selectedExercise?.filming_guide && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-primary mb-0.5">撮影ガイド</p>
            <p className="text-xs text-blue-800">{selectedExercise.filming_guide}</p>
          </div>
        </div>
      )}

      {/* Key Checkpoints */}
      {selectedExercise?.key_checkpoints && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">チェックポイント</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedExercise.key_checkpoints.map((cp, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-muted/40">
                {cp}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Video Upload */}
      <div>
        <Label className="text-sm font-medium mb-2 block">動画をアップロード</Label>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {videoPreview ? (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                src={videoPreview}
                className="w-full h-full object-contain"
                controls
                muted
                playsInline
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVideoFile(null)
                setVideoPreview(null)
                if (fileRef.current) fileRef.current.value = ''
              }}
              className="w-full text-xs"
            >
              別の動画を選択
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.capture = 'environment'
                  fileRef.current.click()
                }
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors"
            >
              <Camera className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">今すぐ撮影</span>
            </button>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute('capture')
                  fileRef.current.click()
                }
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">ギャラリーから</span>
            </button>
          </div>
        )}
      </div>

      {/* Weight / Reps */}
      {selectedExercise && (
        <div className="grid grid-cols-2 gap-3">
          {selectedExercise.name !== 'pull_up' && (
            <div className="space-y-1">
              <Label htmlFor="weight" className="text-xs">重量 (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="例: 80"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                inputMode="decimal"
                className="h-10"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="reps" className="text-xs">回数</Label>
            <Input
              id="reps"
              type="number"
              placeholder="例: 5"
              value={repsInput}
              onChange={e => setRepsInput(e.target.value)}
              inputMode="numeric"
              className="h-10"
            />
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <Button
        onClick={handleAnalyze}
        disabled={loading || !selectedExercise || !videoFile}
        className="w-full h-12 text-base bg-primary hover:bg-primary/90"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingStep}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            AIでフォームをチェック
          </div>
        )}
      </Button>
    </div>
  )
}
