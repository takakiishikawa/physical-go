'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SettingsPage,
  SettingsGroup,
  SettingsItem,
} from '@takaki/go-design-system'
import { User, Scale, Info } from 'lucide-react'
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

  const accountContent = (
    <SettingsGroup title="アカウント情報">
      <SettingsItem
        label="プロフィール"
        description={user.email}
        control={
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <span className="text-sm font-medium">{user.name || 'ユーザー'}</span>
          </div>
        }
      />
    </SettingsGroup>
  )

  const bodyContent = (
    <div className="space-y-4">
      <SettingsGroup title="初期身体データ" description="ダッシュボードの表示に使用します">
        <SettingsItem
          label="体重 (kg)"
          control={
            <Input
              id="weight"
              type="number"
              placeholder="例: 72.0"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              inputMode="decimal"
              className="w-28 h-9"
            />
          }
        />
        <SettingsItem
          label="体脂肪率 (%)"
          control={
            <Input
              id="bodyFat"
              type="number"
              placeholder="例: 22.0"
              value={bodyFatInput}
              onChange={e => setBodyFatInput(e.target.value)}
              inputMode="decimal"
              className="w-28 h-9"
            />
          }
        />
      </SettingsGroup>
      <Button onClick={handleSave} disabled={loading} size="sm">
        {loading ? '保存中...' : '保存する'}
      </Button>
    </div>
  )

  const aboutContent = (
    <SettingsGroup title="このアプリについて">
      <SettingsItem
        label="PhysicalGoとは"
        description="コンセプト・設計思想を確認する"
        control={
          <Link href="/concept">
            <Button variant="outline" size="sm">
              <Info className="w-4 h-4" />
              開く
            </Button>
          </Link>
        }
      />
    </SettingsGroup>
  )

  return (
    <SettingsPage
      sections={[
        { id: 'account', label: 'アカウント', icon: <User className="w-4 h-4" />, content: accountContent },
        { id: 'body',    label: '身体データ', icon: <Scale className="w-4 h-4" />, content: bodyContent },
        { id: 'about',   label: 'このアプリ',  icon: <Info className="w-4 h-4" />,  content: aboutContent },
      ]}
    />
  )
}
