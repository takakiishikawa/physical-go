@AGENTS.md

# このプロダクト固有のルール

## プロダクト名
PhysicalGo

## プライマリカラー
- Primary: `#DC2626`
- Hover: `#B91C1C`
- **選定理由**: 筋力トレーニング・身体的パワー・達成感のコンセプトから。赤は強さ・活力・スポーツのエネルギーを表す色として世界共通。Goシリーズ内でNativeGo（青=知性）と明確に差別化。アプリ識別色も`#DC2626`で統一。

## ドメイン
`https://physical-go.vercel.app`

## データモデルの概要
- **exercises**: ハーフデッドリフト・懸垂・ベンチプレスの3種目（Supabase physicalgo スキーマ）
- **personal_records**: 種目別の自己ベスト記録（weight_kg / reps / is_pr）
- **form_sessions**: フォームチェック動画セッション（Supabase Storage: physicalgo バケット）
- **form_feedbacks**: AIによるフォーム分析結果（checkpoints JSON / strengths / improvements）
- **body_records**: 体重・体脂肪率・写真の時系列記録
- **user_settings**: ユーザー初期設定（基準体重・体脂肪率）

## 外部連携
- **Supabase**: Auth（Google OAuth）/ DB（physicalgo スキーマ）/ Storage（physicalgo バケット）
- **Anthropic Claude API**: フォーム動画解析（@anthropic-ai/sdk）
- **Vercel**: ホスティング・デプロイ自動化

## 固有セマンティックカラー
exercise-specific colors（globals.css で定義）:
- `--color-exercise-deadlift: #2563B0`（ハーフデッドリフト = 青）
- `--color-exercise-pullup: #059669`（懸垂 = 緑）
- `--color-exercise-benchpress: #7C3AED`（ベンチプレス = 紫）

これらは各種目を識別するためのドメイン固有色。直接Tailwindクラスではなく `style={{ color: 'var(--color-exercise-X)' }}` で使用。

## 絶対に守るルール（最重要）

### 1. UIコンポーネントは必ず @takaki/go-design-system から import する

- ✅ 正しい：`import { Button, Card } from '@takaki/go-design-system'`
- ✅ 可：`import { Button } from '@/components/ui/button'`（design systemへの薄いre-exportのため）
- ❌ NG：独自に `components/ui/button.tsx` を @base-ui や Radix から直接実装する

### 2. デザイントークンの上書き禁止

許可されている上書き：
- `--color-primary`（#DC2626）
- `--color-primary-hover`（#B91C1C）
- `--color-exercise-*`（種目固有の識別色）

### 3. className の使用範囲

禁止：
- 直接色クラス（`bg-red-500`, `text-blue-600` など）
- 任意値カラー（`bg-[#xxx]`）
- アイコン装飾背景（色付き角丸正方形 `bg-xxx-50 rounded-lg`）→ アイコン単体で表示

### 4. Authリダイレクト
Google OAuthのコールバック: `https://physical-go.vercel.app/auth/callback`

### 5. Supabaseスキーマ
全テーブルは `physicalgo` スキーマ使用: `supabase.schema('physicalgo').from('...')`

## CSS の読み込み方（Tailwind v4 + Turbopack）

globals.css:
```css
@import "tailwindcss";
@source "../../node_modules/@takaki/go-design-system/dist";
@import "@takaki/go-design-system/theme.css";
@import "tw-animate-css";
```

layout.tsx の `<head>` 内:
```tsx
<DesignTokens primaryColor="#DC2626" primaryColorHover="#B91C1C" />
```

## デザインシステムの更新への追従

vercel.json の buildCommand で自動更新:
```json
{ "buildCommand": "npm update @takaki/go-design-system && npm run build" }
```
