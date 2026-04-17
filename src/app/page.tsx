'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, Camera, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Camera,
    title: 'フォームチェック',
    description: '動画をアップロードするだけ。AIがフォームを詳細に分析します。',
  },
  {
    icon: TrendingUp,
    title: '自己ベスト管理',
    description: '3種目の記録を追跡。PR更新の小さな喜びが積み重なります。',
  },
  {
    icon: BarChart3,
    title: '成長の可視化',
    description: '過去のフォームと並べて比較。成長実感がモチベーションになります。',
  },
]

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://physical-go.vercel.app/auth/callback',
        scopes: 'email profile',
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — brand */}
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-semibold">PhysicalGo</span>
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-light text-white leading-tight">
              撮る・記録する・<br />振り返る。
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              トレーニングが楽しくなる。<br />
              数値に縛られず、成長実感がモチベーションになる状態を。
            </p>
          </div>
          <div className="space-y-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">
          ハーフデッドリフト・懸垂・ベンチプレスの3種目に特化
        </p>
      </div>

      {/* Right panel — login */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="md:hidden mb-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold">PhysicalGo</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            撮る・記録する・振り返る。<br />トレーニングが楽しくなる。
          </p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="hidden md:block space-y-1">
            <h2 className="text-2xl font-semibold">ログイン</h2>
            <p className="text-muted-foreground text-sm">Googleアカウントでサインインしてください</p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 text-sm font-medium border-border hover:bg-muted flex items-center gap-3 rounded-xl"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Googleでログイン
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            ログインすることで利用規約とプライバシーポリシーに同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  )
}
