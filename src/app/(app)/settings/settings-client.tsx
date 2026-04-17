'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Info, Scale, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { UserSettings } from '@/types'

interface Props {
  user: { id: string; email: string; name: string; avatar?: string }
  settings: UserSettings | null
}

export function SettingsClient({ user, settings }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [weightInput, setWeightInput] = useState(settings?.weight_kg?.toString() ?? '')
  const [bodyFatInput, setBodyFatInput] = useState(settings?.body_fat_pct?.toString() ?? '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.schema('physicalgo').from('user_settings').upsert({
        user_id: user.id,
        weight_kg: weightInput ? Number(weightInput) : null,
        body_fat_pct: bodyFatInput ? Number(bodyFatInput) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('設定を保存しました')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message ?? '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">設定</h1>
        <p className="text-sm text-muted-foreground mt-0.5">アカウントと初期値の管理</p>
      </div>

      {/* Account */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />アカウント
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-12 h-12 rounded-full ring-2 ring-border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold">{user.name || 'ユーザー'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body Settings */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />初期身体データ
          </CardTitle>
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
          <Button onClick={handleSave} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
            {loading ? '保存中...' : '保存する'}
          </Button>
        </CardContent>
      </Card>

      {/* Concept */}
      <Link href="/concept">
        <Button variant="outline" className="w-full gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            PhysicalGoとは
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Button>
      </Link>

    </div>
  )
}
