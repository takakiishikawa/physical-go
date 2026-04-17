'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogOut, User } from 'lucide-react'
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
      const { error } = await supabase
        .schema('physicalgo')
        .from('user_settings')
        .upsert({
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-normal">
        設定
      </h1>

      {/* Account Info */}
      <Card className="border border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <p className="font-medium">{user.name || 'ユーザー'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body Settings */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm">初期身体データ</h2>
        <Card className="border border-border/50">
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
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? '保存中...' : '保存する'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* About */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm">アプリについて</h2>
        <Card className="border border-border/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">アプリ名</span>
              <span>PhysicalGo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">バージョン</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">対応種目</span>
              <span>3種目</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        ログアウト
      </Button>
    </div>
  )
}
