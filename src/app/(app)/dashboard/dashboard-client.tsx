"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Video,
  Plus,
  Dumbbell,
  Zap,
  ArrowUpToLine,
  Trophy,
} from "lucide-react";
import {
  PageHeader,
  SectionCards,
  ChartArea,
  Section,
  EmptyState,
  type KpiCard,
} from "@takaki/go-design-system";
import type {
  Exercise,
  PersonalRecord,
  FormFeedback,
  BodyRecord,
} from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Props {
  exercises: Exercise[];
  personalRecords: PersonalRecord[];
  recentFeedback:
    | (FormFeedback & { form_sessions?: { exercises?: Exercise } })
    | null;
  latestBodyRecord: BodyRecord | null;
  userName: string;
}

const EXERCISE_META: Record<
  string,
  { icon: React.ElementType; colorVar: string }
> = {
  half_deadlift: { icon: Dumbbell, colorVar: "var(--color-exercise-deadlift)" },
  pull_up: { icon: ArrowUpToLine, colorVar: "var(--color-exercise-pullup)" },
  bench_press: { icon: Zap, colorVar: "var(--color-exercise-benchpress)" },
};

export function DashboardClient({
  exercises,
  personalRecords,
  recentFeedback,
  latestBodyRecord,
  userName,
}: Props) {
  const router = useRouter();
  const chartDataByExercise = useMemo(() => {
    return exercises.map((ex) => {
      const isPullUp = ex.name === "pull_up";
      const records = personalRecords
        .filter((r) => r.exercise_id === ex.id)
        .sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() -
            new Date(b.recorded_at).getTime(),
        );
      const data = records
        .filter((r) => (isPullUp ? r.reps != null : r.weight_kg != null))
        .map((r) => ({
          date: r.recorded_at,
          value: Number(isPullUp ? r.reps : r.weight_kg),
        }));
      const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift;
      const bestVal =
        data.length > 0 ? Math.max(...data.map((d) => d.value)) : null;
      return { exercise: ex, isPullUp, data, ...meta, bestVal };
    });
  }, [exercises, personalRecords]);

  const totalPRs = personalRecords.filter((r) => r.is_pr).length;
  const totalSessions = personalRecords.length;

  const kpiCards: KpiCard[] = [
    {
      title: "自己ベスト更新",
      value: totalPRs,
      description: "累計PR更新回数",
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      title: "総記録数",
      value: totalSessions,
      description: "累計トレーニング記録",
    },
    ...(latestBodyRecord?.weight_kg != null
      ? [
          {
            title: "体重",
            value: `${latestBodyRecord.weight_kg}kg`,
            description: "最新記録",
          },
        ]
      : []),
    ...(latestBodyRecord?.body_fat_pct != null
      ? [
          {
            title: "体脂肪率",
            value: `${latestBodyRecord.body_fat_pct}%`,
            description: "最新記録",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={`おかえり、${userName.split(" ")[0]}`}
        description="今日もトレーニングを記録しよう"
        actions={
          <div className="flex gap-2">
            <Link href="/record">
              <Button size="sm" className="gap-1.5 hidden md:flex">
                <Plus className="w-3.5 h-3.5" />
                記録する
              </Button>
            </Link>
            <Link href="/form">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 hidden md:flex"
              >
                <Video className="w-3.5 h-3.5" />
                フォームチェック
              </Button>
            </Link>
          </div>
        }
      />

      <SectionCards cards={kpiCards} />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Section title="自己ベスト推移" variant="bordered">
            <div className="space-y-4 pt-2">
              {chartDataByExercise.map(
                ({ exercise, isPullUp, data, colorVar, bestVal }) =>
                  data.length > 1 ? (
                    <ChartArea
                      key={exercise.id}
                      data={data}
                      config={{
                        value: {
                          label: isPullUp ? "回数" : "重量(kg)",
                          color: colorVar,
                        },
                      }}
                      xKey="date"
                      yKeys={["value"]}
                      title={exercise.name_ja}
                      description={
                        bestVal !== null
                          ? `最高: ${bestVal}${isPullUp ? "回" : "kg"}`
                          : undefined
                      }
                      filterByDate={false}
                      xTickFormatter={(v) => format(new Date(v), "M/d")}
                      tooltipLabelFormatter={(v) =>
                        format(new Date(v), "M月d日", { locale: ja })
                      }
                    />
                  ) : (
                    <Card key={exercise.id}>
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          {exercise.name_ja}:{" "}
                          {data.length === 0
                            ? "まだ記録がありません"
                            : "記録が1件のみです"}
                        </p>
                      </CardContent>
                    </Card>
                  ),
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="直近のフォームチェック" variant="bordered">
            <div className="pt-2">
              {recentFeedback ? (
                <Link href={`/form/${recentFeedback.session_id}`}>
                  <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          {(recentFeedback as any).exercises?.name_ja}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(recentFeedback.created_at),
                            "M月d日",
                            { locale: ja },
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                        {recentFeedback.overall_comment}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        詳細を見る <ChevronRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <EmptyState
                  icon={<Video className="w-8 h-8" />}
                  title="フォームチェックがありません"
                  description="動画を撮って AIにフォームを分析してもらおう"
                  action={{
                    label: "チェックする",
                    onClick: () => router.push("/form"),
                  }}
                />
              )}
            </div>
          </Section>

          <div className="md:hidden grid grid-cols-2 gap-3">
            <Link href="/record">
              <Card className="border-primary/20 bg-primary/5 cursor-pointer">
                <CardContent className="p-3 text-center">
                  <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs font-medium text-primary">記録する</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/form">
              <Card className="cursor-pointer">
                <CardContent className="p-3 text-center">
                  <Video className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs font-medium">フォームチェック</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
