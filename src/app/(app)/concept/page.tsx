import { Activity } from "lucide-react";
import { ConceptPage } from "@takaki/go-design-system";

export default function Page() {
  return (
    <ConceptPage
      productName="PhysicalGo"
      productLogo={<Activity className="w-5 h-5 text-primary" />}
      tagline="ハーフデッドリフト・懸垂・ベンチプレスの3種目に特化した、フォーム成長記録アプリ"
      coreMessage="トレーニングを楽しみながら、結果として身体が変わっていく体験。数値に縛られず、フォームの成長実感と自己ベスト更新の小さな喜びがモチベーションになる状態をつくる。"
      coreValue="フォームの成長実感と自己ベスト更新の小さな喜び。AIパーソナルトレーナーが毎回のフォームを分析し、過去との比較で成長が見える。"
      scope={{
        solve: [
          "フォームが正しいか分からない不安",
          "成長しているのかが実感できない",
          "記録管理がしんどくて続かない",
          "過去のフォームと比べて何が変わったか分からない",
        ],
        notSolve: [
          "カロリー・栄養管理",
          "トレーニングプログラム設計",
          "コミュニティ・競争機能",
          "全種目の記録管理",
        ],
      }}
      productLogic={{
        steps: [
          {
            title: "動画を撮る",
            description: "トレーニング中にスマホで撮影するだけ",
          },
          {
            title: "AIが分析",
            description: "フォームの強み・改善点・チェックポイントを評価",
          },
          {
            title: "記録する",
            description: "自己ベストを更新したら自動で検出・祝福",
          },
          {
            title: "振り返る",
            description: "過去のフォームと並べて成長実感を得る",
          },
        ],
        outcome: "トレーニングが楽しくなり、低頻度でも継続できる状態",
      }}
      resultMetric={{
        title: "フォーム改善による自己ベスト更新",
        description:
          "正しいフォームの習得が、記録の向上につながる。数値の追求ではなく、動きの質の向上が結果をつくる。",
      }}
      behaviorMetrics={[
        {
          title: "フォームチェック回数",
          description: "月1回以上、AIによるフォーム分析を行う",
        },
        {
          title: "フォームアーカイブ参照",
          description: "過去のセッションを見返して比較する",
        },
        {
          title: "自己ベスト記録更新",
          description: "3種目いずれかでPRを更新する",
        },
        {
          title: "ボディデータ記録",
          description: "月1回以上、体重・体脂肪率を記録する",
        },
      ]}
    />
  );
}
